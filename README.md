# Cricket Match Insight AI

A hybrid IPL match-prediction application that combines a trained Random Forest model with live weather, cricket-news sentiment, and Groq-powered AI insights.

## Features

- Predicts an IPL match winner and confidence level.
- Uses a Random Forest model for the base probabilities.
- Applies live weather context from OpenWeather.
- Retrieves team news headlines from GNews.
- Uses Groq (`openai/gpt-oss-20b`) to produce two structured news-sentiment insights.
- Keeps the total weather/news probability adjustment capped at ±0.1 before normalizing the final probabilities.

## Project structure

```text
Backend/                         Flask prediction API
  app.py                          Main API and hybrid prediction pipeline
  model.pkl                       Trained model (not committed)
  label_encoder.pkl               Label encoder (not committed)
  features.pkl                    Feature list (not committed)

Frontend/hybrid-ipl-predictor-app/
  src/                            Angular application
  package.json                    Frontend scripts and dependencies
```

## Prerequisites

- Python 3.10+
- Node.js and npm
- API keys for OpenWeather, GNews, and Groq
- The trained backend artifacts: `model.pkl`, `label_encoder.pkl`, and `features.pkl`

## Backend setup

From the `Backend` directory, create and activate a virtual environment, then install the required packages:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install flask flask-cors pandas requests python-dotenv openai scikit-learn
```

Create `Backend/.env` with your own credentials:

```env
OPENWEATHER_API_KEY=your_openweather_key
GNEWS_API_KEY=your_gnews_key
GROQ_API_KEY=your_groq_key
```

Place the trained `model.pkl`, `label_encoder.pkl`, and `features.pkl` files in `Backend/`, then start Flask:

```bash
cd Backend
python app.py
```

The API runs at `http://127.0.0.1:5000`.

## Frontend setup

In a second terminal:

```bash
cd Frontend/hybrid-ipl-predictor-app
npm install
npm start
```

Open `http://localhost:4200` in your browser. The Angular app sends prediction requests to `http://127.0.0.1:5000/predict`.

## API

### `POST /predict`

Example request body:

```json
{
  "team1": "Chennai Super Kings",
  "team2": "Kolkata Knight Riders",
  "venue": "Eden Gardens, Kolkata",
  "toss_winner": "Chennai Super Kings",
  "toss_decision": "bat"
}
```

The response includes the predicted winner, confidence, normalized probabilities, weather information, and AI-generated insights.

## Security and repository policy

The repository intentionally excludes API keys, virtual environments, frontend dependencies, build output, and trained model binaries. Never commit `.env` or any private credentials.

## License

This project currently has no license file. Add one before publishing or distributing it under specific terms.
