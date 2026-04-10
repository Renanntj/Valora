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

async def ensure_admin():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    
    if not email or not password:
        print(">>> [AVISO] Variáveis ADMIN_EMAIL ou ADMIN_PASSWORD não encontradas.")
        return

    try:
        async with SessionLocal() as session:
            print(f">>> Verificando admin: {email}")
            result = await session.execute(select(Usuario).filter(Usuario.email == email))
            user = result.scalars().first()
            
            if not user:
                new_admin = Usuario(
                    email=email,
                    hashed_password=hash_password(password),
                    is_admin=True
                )
                session.add(new_admin)
                await session.commit()
                print(">>> [SUCESSO] Admin criado agora!")
            else:
                print(">>> [INFO] Admin já existe no banco.")
    except Exception as e:
        print(f">>> [ERRO CRÍTICO NO ADMIN]: {e}")


import asyncio
loop = asyncio.get_event_loop()
if loop.is_running():
    asyncio.ensure_future(ensure_admin())
else:
    loop.run_until_complete(ensure_admin())

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