import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # IBM Watson/AutoAI
    IBM_API_KEY: str = os.getenv("IBM_API_KEY", "")
    IBM_DEPLOYMENT_URL: str = os.getenv("IBM_DEPLOYMENT_URL", "")
    IBM_DEPLOYMENT_ID: str = os.getenv("IBM_DEPLOYMENT_ID", "")
    IBM_SPACE_ID: str = os.getenv("IBM_SPACE_ID", "")
    IBM_IAM_URL: str = "https://iam.cloud.ibm.com/identity/token"
    IBM_WATSONX_URL: str = os.getenv("IBM_WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

    # IBM Granite / watsonx.ai
    IBM_PROJECT_ID: str = os.getenv("IBM_PROJECT_ID", "")
    GRANITE_MODEL_ID: str = os.getenv("GRANITE_MODEL_ID", "ibm/granite-13b-instruct-v2")

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./securenet.db"

    # App
    APP_NAME: str = "SecureNet AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "securenet-secret-key-change-in-production")
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
