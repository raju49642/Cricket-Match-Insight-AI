from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import re
import json
import requests
from dotenv import load_dotenv
import os
import time
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow frontend (file://, localhost) to call the API

# ── Load model artefacts ──────────────────────────────────────────────────────

model         = pickle.load(open("model.pkl",         "rb"))
label_encoder = pickle.load(open("label_encoder.pkl", "rb"))
features      = pickle.load(open("features.pkl",      "rb"))


# ── Helpers ───────────────────────────────────────────────────────────────────

def clean_columns(columns):
    """Sanitise column names to match training-time feature names."""
    return [re.sub(r'[^A-Za-z0-9_]', '_', col) for col in columns]


VENUE_CITY_MAP = {
    "Wankhede Stadium, Mumbai":                                      "Mumbai",
    "Eden Gardens, Kolkata":                                         "Kolkata",
    "M Chinnaswamy Stadium, Bengaluru":                              "Bangalore",
    "MA Chidambaram Stadium, Chepauk, Chennai":                      "Chennai",
    "Rajiv Gandhi International Stadium, Uppal, Hyderabad":          "Hyderabad",
    "Arun Jaitley Stadium, Delhi":                                   "Delhi",
    "Narendra Modi Stadium, Ahmedabad":                              "Ahmedabad",
    "Sawai Mansingh Stadium, Jaipur":                                "Jaipur",
    "Punjab Cricket Association IS Bindra Stadium, Mohali":          "Mohali",
    "BRSABV Ekana Cricket Stadium, Lucknow":                         "Lucknow",
}

def venue_to_city(venue):
    return VENUE_CITY_MAP.get(venue, "Mumbai")


def get_weather(city):
    started = time.perf_counter()
    try:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?q={city}&appid={api_key}&units=metric"
        )
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return {
            "weather":     data["weather"][0]["main"],
            "temperature": data["main"]["temp"],
            "humidity":    data["main"]["humidity"],
        }
    finally:
        print(f"[PERF] Weather: {time.perf_counter() - started:.2f}s")


def weather_adjustment(weather):
    adjustments = {
        "Rain":        -0.08,
        "Thunderstorm":-0.08,
        "Clouds":      -0.02,
        "Smoke":       -0.02,
        "Haze":        -0.02,
        "Clear":       +0.03,
    }
    return adjustments.get(weather, 0)


def get_team_news(team):
    started = time.perf_counter()
    try:
        api_key = os.getenv("GNEWS_API_KEY")
        url = f"https://gnews.io/api/v4/search?q={team}&lang=en&max=5&apikey={api_key}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return [article["title"] for article in response.json().get("articles", [])]
    except (requests.RequestException, ValueError, KeyError, TypeError) as e:
        print(f"[GNEWS ERROR] {team}: {repr(e)}")
        return []
    finally:
        print(f"[PERF] GNews {team}: {time.perf_counter() - started:.2f}s")


def analyze_both_teams_llm(team1, team2, headlines1, headlines2):
    """Use Groq to produce structured news-sentiment adjustments for two teams."""
    started = time.perf_counter()
    completion = None
    output = None
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")

        from openai import OpenAI

        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key,
            timeout=8,
        )
        prompt = f"""
Compare two IPL teams based ONLY on the supplied news headlines.

Team 1: {team1}
Headlines: {headlines1}
Team 2: {team2}
Headlines: {headlines2}

Analyze the overall positive or negative news impact for each team.

Return JSON ONLY:
{{
  "team1_impact": 0.0,
  "team2_impact": 0.0,
  "insights": ["...", "..."]
}}

Rules:
- team1_impact must be between -1.0 and 1.0.
- team2_impact must be between -1.0 and 1.0.
- Positive news should generally produce a positive impact.
- Negative news should generally produce a negative impact.
- insights must contain exactly 2 concise sentences.
- Do not predict the match winner.
- Do not use information outside the supplied headlines.
- Return valid JSON only.
- No markdown.
- No explanation outside the JSON.
"""
        print("[GROQ] Request started")
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a concise IPL news sentiment analyzer. "
                        "Return only valid JSON with no markdown or explanation outside the JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=512,
            stream=False,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "ipl_team_news_sentiment",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "team1_impact": {
                                "type": "number",
                                "minimum": -1.0,
                                "maximum": 1.0,
                            },
                            "team2_impact": {
                                "type": "number",
                                "minimum": -1.0,
                                "maximum": 1.0,
                            },
                            "insights": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["team1_impact", "team2_impact", "insights"],
                        "additionalProperties": False,
                    },
                },
            },
        )
        print(f"[GROQ] Response received in {time.perf_counter() - started:.2f}s")

        output = completion.choices[0].message.content
        if not isinstance(output, str):
            raise TypeError("Groq response content is not a string")

        parsed = json.loads(output)

        required_keys = {"team1_impact", "team2_impact", "insights"}
        if not isinstance(parsed, dict) or not required_keys.issubset(parsed):
            raise ValueError("Groq JSON is missing required fields")
        if any(
            isinstance(parsed[key], bool) or not isinstance(parsed[key], (int, float))
            for key in ("team1_impact", "team2_impact")
        ):
            raise ValueError("Groq impact values must be numeric")
        if not isinstance(parsed["insights"], list):
            raise ValueError("Groq insights must be a list")

        team1_impact = float(parsed["team1_impact"])
        team2_impact = float(parsed["team2_impact"])
        if not all(
            value == value and float("-inf") < value < float("inf")
            for value in (team1_impact, team2_impact)
        ):
            raise ValueError("Groq impact values must be finite")

        insights = [insight.strip() for insight in parsed["insights"] if isinstance(insight, str) and insight.strip()]
        if len(insights) < 2:
            raise ValueError("Groq insights must contain at least two valid items")

        result = {
            "team1_impact": max(-1.0, min(1.0, team1_impact)),
            "team2_impact": max(-1.0, min(1.0, team2_impact)),
            "insights": insights[:2],
        }
        return result

    except Exception as e:
        print(f"[GROQ ERROR] {type(e).__name__}: {e}")
        if completion is not None:
            choice = completion.choices[0] if completion.choices else None
            usage = getattr(completion, "usage", None)
            print(f"[GROQ ERROR] Finish reason: {getattr(choice, 'finish_reason', None)}")
            print(f"[GROQ ERROR] Response length: {len(output) if isinstance(output, str) else 0}")
            print(
                "[GROQ ERROR] Token usage: "
                f"prompt={getattr(usage, 'prompt_tokens', None)}, "
                f"completion={getattr(usage, 'completion_tokens', None)}"
            )
        return {
            "team1_impact": 0,
            "team2_impact": 0,
            "insights": ["LLM analysis unavailable"],
        }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return "IPL Prediction API Running 🚀"


@app.route("/predict", methods=["POST"])
def predict():
    prediction_started = time.perf_counter()
    try:
        data = request.json

        input_data = {
            "team1":         data["team1"],
            "team2":         data["team2"],
            "venue":         data["venue"],
            "toss_winner":   data.get("toss_winner", ""),
            "toss_decision": data.get("toss_decision", ""),
        }

        # ── Feature engineering ──────────────────────────────────────────
        df          = pd.DataFrame([input_data])
        df_encoded  = pd.get_dummies(df)
        df_encoded.columns = clean_columns(df_encoded.columns)
        df_encoded  = df_encoded.reindex(columns=features, fill_value=0)

        # ── Base prediction ──────────────────────────────────────────────
        rf_started = time.perf_counter()
        probs      = list(model.predict_proba(df_encoded)[0])
        print(f"[PERF] Random Forest: {time.perf_counter() - rf_started:.2f}s")
        pred_class = probs.index(max(probs))

        # ── Weather adjustment ───────────────────────────────────────────
        city = venue_to_city(input_data["venue"])
        with ThreadPoolExecutor(max_workers=3) as executor:
            weather_future = executor.submit(get_weather, city)
            team1_news_future = executor.submit(get_team_news, input_data["team1"])
            team2_news_future = executor.submit(get_team_news, input_data["team2"])

            try:
                weather_data = weather_future.result()
            except Exception as e:
                print("[WEATHER ERROR]", repr(e))
                weather_data = {"weather": "Unknown", "temperature": 0, "humidity": 0}

            team1_news = team1_news_future.result()
            team2_news = team2_news_future.result()

        weather_adj = weather_adjustment(weather_data["weather"])

        # ── News / LLM adjustment ────────────────────────────────────────
        llm_result = analyze_both_teams_llm(
            input_data["team1"], input_data["team2"],
            team1_news, team2_news,
        )

        final_calc_started = time.perf_counter()
        sentiment_adj = llm_result["team1_impact"] - llm_result["team2_impact"]

        # ── Combine, clamp, normalise ────────────────────────────────────
        total_adj  = max(min(weather_adj + sentiment_adj, 0.1), -0.1)
        probs[pred_class] += total_adj
        total      = sum(probs)
        probs      = [p / total for p in probs]

        # ── Final output ─────────────────────────────────────────────────
        pred_class     = probs.index(max(probs))
        predicted_team = label_encoder.inverse_transform([pred_class])[0]
        best_prob      = max(probs)
        confidence     = "High" if best_prob > 0.6 else "Medium" if best_prob > 0.4 else "Low"
        print(f"[PERF] Final probability calculation: {time.perf_counter() - final_calc_started:.2f}s")

        return jsonify({
            "predicted_winner": predicted_team,
            "confidence":       confidence,
            "probabilities":    dict(zip(label_encoder.classes_, probs)),
            "weather":          weather_data,
            "insights":         llm_result.get("insights", []),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        print(f"[PERF] Total prediction: {time.perf_counter() - prediction_started:.2f}s")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
