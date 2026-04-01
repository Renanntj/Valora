from fastapi import FastAPI

app = FastAPI(title="ValoraAPI")

from app.api.v1.router import api_router



app.include_router(api_router, prefix="/api/v1")