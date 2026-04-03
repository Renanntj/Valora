"""
Entrypoint da aplicação FastAPI.

- Campos comentados são para implimentações futuras

Middlewares de segurança configurados:
    - TrustedHostMiddleware: bloqueia requests com Host header inválido
    - CORSMiddleware: restringe origens permitidas
    - Security headers customizados (X-Content-Type-Options, etc.)

Para produção:
    - Configure ALLOWED_ORIGINS via variável de ambiente
    - Rode atrás de um proxy reverso (nginx/caddy) com TLS
    - Ative rate limiting no gateway (ex: nginx limit_req)
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.api.v1.router import api_router


# ---------------------------------------------------------------------------
# Instância da aplicação
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Valora-API",
    version="1.0.0",
    # Em produção, desabilite a documentação automática ou proteja com auth
    # docs_url="/docs" if settings.is_development else None,
    # redoc_url="/redoc" if settings.is_development else None,
    # openapi_url="/openapi.json" if settings.is_development else None,
)

# ---------------------------------------------------------------------------
# Middlewares de segurança
# ---------------------------------------------------------------------------

# if not settings.is_development:
#     app.add_middleware(
#         TrustedHostMiddleware,
#         allowed_hosts=["seudominio.com.br", "www.seudominio.com.br"],
#     )

# 2. CORS — ajuste allowed_origins para seus domínios reais
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://seudominio.com.br"] if not settings.is_development else ["*"],
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PATCH", "DELETE"],
#     allow_headers=["Authorization", "Content-Type"],
# )


# 3. Security headers — aplicados em toda resposta
# @app.middleware("http")
# async def add_security_headers(request: Request, call_next) -> Response:
#     response: Response = await call_next(request)
#     response.headers["X-Content-Type-Options"] = "nosniff"
#     response.headers["X-Frame-Options"] = "DENY"
#     response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
#     response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
#     if not settings.is_development:
#         response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
#     return response

app.include_router(api_router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

# @app.get("/health", tags=["Infraestrutura"], include_in_schema=False)
# def health_check() -> dict:
#     """Endpoint para health checks de load balancers e orquestradores."""
#     return {"status": "ok"}