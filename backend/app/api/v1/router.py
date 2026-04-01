from fastapi import APIRouter
from app.api.v1.endpoints import clinica

api_router = APIRouter()

api_router.include_router(clinica.router, prefix="/clinica")