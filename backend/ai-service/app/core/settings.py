from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "Zylora AI Intelligence Service"
    service_version: str = "0.1.0"
    backend_api_base_url: str = ""
    openai_api_key: str = ""
    vector_database_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
