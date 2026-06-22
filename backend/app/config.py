from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    admin_email: str = "admin@judoapp.de"
    admin_password: str
    media_dir: str = "/app/media"
    access_token_expire_days: int = 7
    allowed_origins: str = "http://localhost:8002"
    heimverein_name: str = "Mein Judoverein"

    model_config = {"env_file": ".env"}

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
