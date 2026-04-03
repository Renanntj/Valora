from fastapi import APIRouter
from .endpoints import clinica, auth
api_router = APIRouter()

api_router.include_router(clinica.router, prefix="/clinica")
api_router.include_router(auth.router, prefix="/auth")
