# Hybrid IPL Prediction Engine — Angular Frontend

A futuristic/cyber-styled Angular frontend for your existing Flask
prediction backend. Built with plain CSS animations (no Three.js,
GSAP, or WebGL) so it stays debuggable and easy to learn from.

## 1. What's included

This folder contains only the `src/` files for the app (components,
services, models, styles). You'll generate the surrounding Angular
project shell yourself with the Angular CLI, then drop these files in
— that way the project always matches the exact Angular CLI version
installed on your machine.

```
src/
├── index.html                  # Google Fonts (Rajdhani, Exo 2) + <app-root>
├── main.ts                     # Standalone bootstrap
├── styles.scss                 # Global dark theme + grid background
└── app/
    ├── app.component.ts/html/scss   # Top-level view switcher
    ├── app.config.ts                # provideHttpClient()
    ├── models/
    │   └── prediction.model.ts      # Request/response types + team & venue lists
    ├── services/
    │   └── prediction.service.ts    # Calls POST http://127.0.0.1:5000/predict
    └── components/
        ├── intro-animation/         # "Glowing Prediction Core" opening (2–3s)
        ├── prediction-form/         # Team1/Team2/Venue/Toss inputs + Predict button
        ├── team-selector/           # Reusable team dropdown (prevents duplicate teams)
        ├── analysis-animation/      # 8-stage "cinematic analysis" while API runs
        └── prediction-result/       # Winner, animated probability bars, weather, insights
```

## 2. Required Angular commands

```bash
# 1. Install the Angular CLI if you don't already have it
npm install -g @angular/cli

# 2. Scaffold a new standalone Angular project (no routing needed)
ng new hybrid-ipl-predictor --standalone --style=scss --routing=false --skip-tests

# 3. Move into the project
cd hybrid-ipl-predictor
```

When prompted by `ng new`, any answer works for SSR (choose "No" for
simplicity — this app is a client-only SPA that calls your local
Flask API).

## 3. Drop in the provided files

Delete the boilerplate `src/app/app.component.*` files `ng new`
generated, and the boilerplate `src/styles.scss`, then copy in
everything from this package's `src/` folder, preserving the folder
structure shown above:

```bash
# from inside the hybrid-ipl-predictor project ng new created
rm src/app/app.component.*
cp -r /path/to/this/src/* ./src/
```

(If `ng new` created a `src/app/app.routes.ts` or similar and your
CLI version requires it to be imported somewhere, you can safely
delete it too — this app doesn't use routing.)

## 4. Run it

```bash
ng serve
```

Then open **http://localhost:4200**.

Make sure your Flask backend is already running on
`http://127.0.0.1:5000` before you click **PREDICT MATCH** — the
service calls that URL directly and does not modify your backend's
request/response contract in any way.

> **CORS note:** since Angular runs on `localhost:4200` and Flask on
> `127.0.0.1:5000`, your Flask app needs CORS enabled for local
> development (e.g. `flask-cors` with
> `CORS(app, origins=["http://localhost:4200"])`). This is a Flask-side
> config change, not a change to the API contract itself.

## 5. How the pieces fit together

- **AppComponent** is a simple state machine with four views:
  `intro → form → analyzing → result`.
- **IntroAnimationComponent** plays the "Glowing Prediction Core"
  animation once, then emits `introComplete`.
- **PredictionFormComponent** collects the 5 inputs, prevents
  Team 1 = Team 2, and emits a `PredictionRequest` on submit.
- **AnalysisAnimationComponent** starts as soon as the request is
  sent. It plays through 8 visual stages roughly every 450ms. If the
  real API response arrives before all 8 stages finish playing, it
  simply keeps playing to the end; if the API is slower, it holds on
  "PREDICTION READY" (with a pulsing indicator) until the response
  actually arrives. No fake intermediate numbers are ever shown.
- **PredictionResultComponent** renders the real API response:
  predicted winner, confidence, animated probability bars (0 → real
  value), weather, and expandable AI insights — or a clean error
  message if the request failed.
- **PredictionService** is the only place that knows the API URL. It
  turns network failures into a friendly `"Prediction server
  unavailable."` message and passes through any `{ "error": "..." }`
  the backend returns.

## 6. Customizing

- Colors/fonts are CSS variables + `@import`s in `src/styles.scss`
  and the individual component `.scss` files — cyan (`#22d3ee`) is
  the primary accent, orange (`#ff8c3c`) the secondary.
- Animation timings live as named constants near the top of
  `intro-animation.component.ts` and `analysis-animation.component.ts`
  if you want the intro or the analysis stages to run faster/slower.
- Reduced-motion users automatically get a much shorter/static intro
  via the `@media (prefers-reduced-motion: reduce)` rules and a
  `matchMedia` check in `intro-animation.component.ts`.
