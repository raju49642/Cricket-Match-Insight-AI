"""One-off NVIDIA Build GLM-5.3 high-effort latency and JSON-quality test."""

import os
import time

from dotenv import load_dotenv
def main() -> None:
    load_dotenv()
    api_key = os.getenv("NVIDIA_API_KEY")

    if not api_key:
        print("[NVIDIA HIGH TEST] FAILED")
        print("[NVIDIA HIGH TEST] Error type: RuntimeError")
        print("[NVIDIA HIGH TEST] Error: NVIDIA_API_KEY is not set.")
        return

    try:
        from openai import OpenAI

        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key,
        )
        print("[NVIDIA HIGH TEST] Request started")
        started = time.perf_counter()
        completion = client.chat.completions.create(
            model="z-ai/glm-5.3-flash",
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise cricket news sentiment analyzer. Return ONLY valid JSON. No markdown and no explanation.",
                },
                {
                    "role": "user",
                    "content": """Compare these two teams based only on the supplied news.

Team 1: Royal Challengers Bengaluru
Headlines:

- RCB captain says team is confident ahead of match
- Key player returns to training

Team 2: Delhi Capitals
Headlines:

- Delhi Capitals face injury concern
- Team prepares for upcoming match

Return exactly this structure:

{
"team1_impact": number,
"team2_impact": number,
"insights": [
"short insight about team 1",
"short insight about team 2"
]
}""",
                },
            ],
            reasoning_effort="high",
            temperature=0,
            top_p=1,
            max_tokens=150,
            stream=False,
        )
        duration = time.perf_counter() - started
        raw_response = completion.choices[0].message.content

        print("[NVIDIA HIGH TEST] Response received")
        print(f"[NVIDIA HIGH TEST] Response time: {duration:.2f} seconds")
        print(f"[NVIDIA HIGH TEST] Raw response: {raw_response}")
    except Exception as error:
        print("[NVIDIA HIGH TEST] FAILED")
        print(f"[NVIDIA HIGH TEST] Error type: {type(error).__name__}")
        print(f"[NVIDIA HIGH TEST] Error: {error}")


if __name__ == "__main__":
    main()
