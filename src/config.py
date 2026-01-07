from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/leads_db"

    # SerpAPI
    serpapi_key: str = ""

    # Go High Level
    ghl_api_key: str = ""
    ghl_location_id: str = ""
    ghl_workflow_id: str = ""

    # App
    debug: bool = False

    # Scoring weights (sum = 100)
    score_weight_website: int = 15
    score_weight_ssl: int = 5
    score_weight_chat: int = 20
    score_weight_whatsapp: int = 15
    score_weight_form: int = 10
    score_weight_facebook: int = 10
    score_weight_instagram: int = 10
    score_weight_linkedin: int = 5
    score_weight_analytics: int = 5
    score_weight_pixel: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
