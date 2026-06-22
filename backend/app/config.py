from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    admin_email: str = "admin@judoapp.de"
    admin_password: str
    media_dir: str = "/app/media"
    access_token_expire_days: int = 7
    allowed_origins: list[str] = ["http://localhost:8002"]
    heimverein_name: str = "Mein Judoverein"

    model_config = {"env_file": ".env"}

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


settings = Settings()
