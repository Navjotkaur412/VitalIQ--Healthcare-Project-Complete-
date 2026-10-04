from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    mongo_uri: str = "mongodb://127.0.0.1:27017/vitaliq"
    internal_api_key: str = "change_this_to_a_long_random_shared_secret"

    # LLM provider — "auto" picks Gemini if GEMINI_API_KEY is set, else Anthropic if
    # ANTHROPIC_API_KEY is set, else no LLM (deterministic fallbacks only).
    llm_provider: str = "auto"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5-20250929"

    model_path: str = "./model_artifacts/risk_model.joblib"


settings = Settings()
