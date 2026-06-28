import os
from typing import Optional

from .base import AIProvider


class ProviderFactory:
    _providers: dict[str, type[AIProvider]] = {}

    @classmethod
    def register(cls, name: str, provider_cls: type[AIProvider]):
        cls._providers[name] = provider_cls

    @classmethod
    def create(cls, name: Optional[str] = None, **kwargs) -> AIProvider:
        name = name or os.getenv("AI_PROVIDER", "mock")

        if name == "mock":
            from .mock import MockProvider
            return MockProvider(**kwargs)

        if name == "ollama":
            from .ollama import OllamaProvider
            return OllamaProvider(**kwargs)

        if name in cls._providers:
            return cls._providers[name](**kwargs)

        raise ValueError(f"Unknown AI provider: {name}. Available: mock, ollama, {list(cls._providers.keys())}")
