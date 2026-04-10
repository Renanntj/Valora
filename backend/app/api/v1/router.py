from fastapi import APIRouter
from .endpoints import clinica, auth, assinatura, analise
api_router = APIRouter()

api_router.include_router(clinica.router, prefix="/clinica", tags=["Gestão de Clínicas"])
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticacão"])
api_router.include_router(assinatura.router, prefix="/assinatura", tags=["Assinaturas"])
api_router.include_router(analise.router, prefix="/analise", tags=["Analise de Dados"])