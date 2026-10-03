"""One-off Groq GPT-OSS-20B realistic IPL news-analysis benchmark."""

import json
import os
import time

from dotenv import load_dotenv


def is_valid_response(raw_response: str):
    """Parse and validate the required response schema and value bounds."""
    try:
        response_json = json.loads(raw_response)
    except (TypeError, json.JSONDecodeError):
        return False, "N/A", "N/A"

    if not isinstance(response_json, dict):
        return False, "N/A", "N/A"

    team1_impact = response_json.get("team1_impact")
    team2_impact = response_json.get("team2_impact")
    insights = response_json.get("insights")
    valid_impacts = (
        isinstance(team1_impact, (int, float))
        and not isinstance(team1_impact, bool)
        and -1 <= team1_impact <= 1
        and isinstance(team2_impact, (int, float))
        and not isinstance(team2_impact, bool)
        and -1 <= team2_impact <= 1
    )
    valid_insights = isinstance(insights, list) and len(insights) == 2

    return valid_impacts and valid_insights, team1_impact, team2_impact


def main() -> None:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    print(f"[GROQ STABILITY TEST] API key found: {bool(api_key)}")

    if not api_key:
        print("[GROQ STABILITY TEST] FAILED")
        print("[GROQ STABILITY TEST] Error type: RuntimeError")
        print("[GROQ STABILITY TEST] Error: GROQ_API_KEY is not set.")
        return

    from openai import OpenAI

    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key,
    )
    messages = [
        {
            "role": "system",
            "content": (
                "You are a concise IPL news sentiment analyzer. "
                "Return only valid JSON with no markdown or explanation outside the JSON."
            ),
        },
        {
            "role": "user",
            "content": """Compare two IPL teams based ONLY on the supplied news headlines.

Team 1: Royal Challengers Bengaluru
Headlines:
[
  "Royal Challengers Bengaluru prepare for crucial IPL fixture with strong training session",
  "RCB captain says team is confident ahead of upcoming match",
  "Key RCB player returns to training after injury setback",
  "Royal Challengers Bengaluru look to continue strong recent form",
  "RCB management backs young players ahead of important fixture"
]

Team 2: Delhi Capitals
Headlines:
[
  "Delhi Capitals face injury concern ahead of upcoming IPL fixture",
  "DC continue preparations despite setback",
  "Delhi Capitals look to improve recent performances",
  "DC captain calls for stronger batting performance",
  "Delhi Capitals make changes to training plans ahead of match"
]

Analyze the overall positive or negative news impact for each team.

Return JSON ONLY:

{
  "team1_impact": float,
  "team2_impact": float,
  "insights": ["...", "..."]
}

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
- No explanation outside the JSON.""",
        },
    ]
    durations = []
    results = []

    for request_number in range(1, 4):
        print(f"[GROQ STABILITY TEST] Request {request_number} started")
        started = time.perf_counter()
        try:
            completion = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=messages,
                temperature=0.2,
                max_tokens=300,
                stream=False,
            )
            raw_response = completion.choices[0].message.content
            json_valid, team1_impact, team2_impact = is_valid_response(raw_response)
        except Exception as error:
            json_valid = False
            team1_impact = "N/A"
            team2_impact = "N/A"
            print(f"[GROQ STABILITY TEST] Request {request_number} FAILED")
            print(f"[GROQ STABILITY TEST] Error type: {type(error).__name__}")
            print(f"[GROQ STABILITY TEST] Error: {error}")

        duration = time.perf_counter() - started
        durations.append(duration)
        results.append((json_valid, team1_impact, team2_impact))
        print(f"[GROQ STABILITY TEST] Request {request_number} completed")
        print(f"[GROQ STABILITY TEST] Request {request_number} time: {duration:.2f} seconds")
        print(f"[GROQ STABILITY TEST] Request {request_number} JSON valid: {json_valid}")

    print(f"[GROQ STABILITY TEST] Average time: {sum(durations) / len(durations):.2f} seconds")
    print(f"[GROQ STABILITY TEST] Fastest time: {min(durations):.2f} seconds")
    print(f"[GROQ STABILITY TEST] Slowest time: {max(durations):.2f} seconds")
    print(f"[GROQ STABILITY TEST] All JSON valid: {all(result[0] for result in results)}")

    for request_number, (_, team1_impact, team2_impact) in enumerate(results, start=1):
        print(
            f"[GROQ STABILITY TEST] Request {request_number} impacts: "
            f"team1={team1_impact}, team2={team2_impact}"
        )


if __name__ == "__main__":
    main()
