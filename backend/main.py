"""
Entrypoint da aplicação FastAPI.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select


from app.api.v1.router import api_router
from app.core.database import SessionLocal   
from app.models.clinica.usuario import Usuario          
from app.core.security import hash_password

# ---------------------------------------------------------------------------
# Lógica de Inicialização (Criação do Admin)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # O que acontece ao ligar o servidor:
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if admin_email and admin_password:
        async with SessionLocal() as session:
            # Verifica se o admin já existe
            result = await session.execute(select(Usuario).filter(Usuario.email == admin_email))
            user = result.scalars().first()
            
            if not user:
                new_admin = User(
                    email=admin_email,
                    hashed_password=hash_password(admin_password),
                    is_admin=True  
                )
                session.add(new_admin)
                await session.commit()
                print(f">>> [SUCESSO] Admin {admin_email} criado!")
            else:
                print(">>> [INFO] Admin já existe no banco.")
    
    yield
    
    pass

# ---------------------------------------------------------------------------
# Instância da aplicação
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Valora-API",
    version="1.0.0",
    lifespan=lifespan  # Conecta a lógica de criação do admin aqui
)

# ---------------------------------------------------------------------------
# Middlewares
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(api_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# Rotas Base
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"])
def root():
    return JSONResponse(
        content={
            "projeto": "Valora SaaS",
            "status": "Online",
            "versao": "1.0.0",
            "desenvolvedor": {
                "nome": "Renan A.",
                "cargo": "Backend Developer",
                "contato": "renannalves334@gmail.com",
                "linkedin": "https://www.linkedin.com/in/renanalves433/",
                "github": "https://github.com/Renanntj",
                "portifolio": "https://renanntj.github.io/Renan-Alves/"
            },
            "documentacao": "/docs"
        }
    )
    
@app.get("/healthz", tags=["Infraestrutura"], include_in_schema=False)
def health_check() -> dict:
    return {"status": "ok"}