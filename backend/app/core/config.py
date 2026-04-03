"""
Configurações da aplicação via variáveis de ambiente.

Use um arquivo .env local para desenvolvimento. Em produção, injete as variáveis
diretamente no ambiente (ex: via Docker secrets, AWS Secrets Manager, etc.).

"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ------------------------------------------------------------------
    # JWT
    # ------------------------------------------------------------------
    # Gere com: python -c "import secrets; print(secrets.token_hex(64))"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SETUP_SECRET_KEY: str | None = None

    # ------------------------------------------------------------------
    # Banco de dados
    # ------------------------------------------------------------------
    DATABASE_URL: str

    # ------------------------------------------------------------------
    # Ambiente
    # ------------------------------------------------------------------
    ENVIRONMENT: str = "production"  
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


settings = Settings()  # type: ignore[call-arg]
