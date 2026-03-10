from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/jobagent"
    redis_url: str = "redis://localhost:6379"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    max_applications_per_day: int = 20


settings = Settings()
