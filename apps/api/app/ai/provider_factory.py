from app.ai.base_provider import AIProvider
from app.config import settings

_provider_instance: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = _create_provider()
    return _provider_instance


def _create_provider() -> AIProvider:
    provider = settings.ai_provider

    if provider == "opencode":
        from app.ai.opencode_provider import OpenCodeProvider
        return OpenCodeProvider()
    elif provider == "openai":
        from app.ai.openai_provider import OpenAIProvider
        return OpenAIProvider()
    elif provider == "anthropic":
        from app.ai.anthropic_provider import AnthropicProvider
        return AnthropicProvider()
    else:
        raise ValueError(f"Unknown AI provider: {provider}. Use: opencode, openai, anthropic")
