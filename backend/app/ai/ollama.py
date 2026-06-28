from typing import Optional
import json
import os

from .base import AIProvider


class OllamaProvider(AIProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: int = 120,
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("AI_MODEL", "qwen3-coder")
        self.timeout = timeout

    @property
    def name(self) -> str:
        return f"ollama/{self.model}"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> str:
        import httpx

        payload = {
            "model": self.model,
            "prompt": f"{system_prompt}\n\n{user_prompt}",
            "stream": False,
            "options": {"num_predict": max_tokens, "temperature": temperature},
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type,
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> dict:
        import httpx

        schema_str = json.dumps(response_schema.model_json_schema(), indent=2)

        full_prompt = (
            f"{system_prompt}\n\n"
            f"You MUST return ONLY valid JSON matching this schema:\n{schema_str}\n\n"
            f"{user_prompt}\n\n"
            f"Return ONLY the JSON object, no explanation, no markdown formatting."
        )

        raw = await self.generate(
            system_prompt="You are a code analysis assistant that returns structured JSON.",
            user_prompt=full_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw
            raw = raw.rsplit("```", 1)[0] if "```" in raw else raw
        if raw.startswith("```json"):
            raw = raw[7:].strip()
            raw = raw.rsplit("```", 1)[0] if "```" in raw else raw

        return json.loads(raw)
