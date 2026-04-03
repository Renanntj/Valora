

"""
Dependencies FastAPI reutilizáveis para autenticação e autorização.

Padrão de uso nos endpoints:
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
    admin_user:   Annotated[Usuario, Depends(require_admin)]
    subscriber:   Annotated[Usuario, Depends(require_active_subscription)]

Hierarquia de verificações (do mais permissivo ao mais restrito):
    get_current_user_from_token
        └── get_current_active_user  (garante que o usuário existe no banco)
                ├── require_admin               (is_admin_saas == True)
                └── require_active_subscription (assinatura ATIVA ou TRIAL)
"""

from __future__ import annotations

from typing import Annotated
from .database import SessionLocal
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.clinica.usuario import Usuario

# Bearer token extractor — retorna 401 automaticamente se o header estiver ausente
_bearer_scheme = HTTPBearer(auto_error=True)


# ---------------------------------------------------------------------------
# abrir banco de dados
# ---------------------------------------------------------------------------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        


# ---------------------------------------------------------------------------
# Extração e validação do token
# ---------------------------------------------------------------------------

def get_current_user_from_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> Usuario:
    """
    Extrai o JWT do header Authorization, valida a assinatura e retorna
    o usuário correspondente ao `sub` do token.

    Raises:
        HTTP 401 — token ausente, inválido, expirado ou usuário não encontrado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(credentials.credentials)

        # Garante que é um access token (não um refresh token reutilizado)
        if payload.get("type") != "access":
            raise credentials_exception

        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception

        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        # Usuário foi deletado após emissão do token
        raise credentials_exception

    return user


# ---------------------------------------------------------------------------
# Guardiões de acesso
# ---------------------------------------------------------------------------

def get_current_active_user(
    user: Annotated[Usuario, Depends(get_current_user_from_token)],
) -> Usuario:
    """
    Dependency base para qualquer rota autenticada.

    Ponto de extensão: adicione aqui verificações de conta suspensa,
    e-mail não verificado, etc.
    """
    # Exemplo de extensão futura:
    # if not user.email_verificado:
    #     raise HTTPException(status_code=403, detail="E-mail não verificado.")
    return user


def require_admin(
    user: Annotated[Usuario, Depends(get_current_active_user)],
) -> Usuario:
    """
    Exige que o usuário autenticado seja admin SaaS (is_admin_saas=True).

    Raises:
        HTTP 403 — acesso negado.
    """
    if not user.is_admin_saas:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
    return user


def require_active_subscription(
    user: Annotated[Usuario, Depends(get_current_active_user)],
) -> Usuario:
    """
    Exige que o usuário possua uma assinatura ativa (ATIVA ou TRIAL dentro do prazo).

    Raises:
        HTTP 402 — assinatura expirada ou inexistente.
        HTTP 403 — assinatura cancelada.
    """
    if not user.assinatura:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Nenhuma assinatura encontrada. Contrate um plano para continuar.",
        )

    from app.models.clinica.assinatura import StatusAssinatura  

    if user.assinatura.status == StatusAssinatura.CANCELADA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assinatura cancelada. Entre em contato com o suporte.",
        )

    if not user.eh_assinante_ativo:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Assinatura vencida. Renove seu plano para continuar.",
        )

    return user


# ---------------------------------------------------------------------------
# Type aliases para injeção limpa nos endpoints
# ---------------------------------------------------------------------------

ActiveUser = Annotated[Usuario, Depends(get_current_active_user)]
AdminUser = Annotated[Usuario, Depends(require_admin)]
SubscriberUser = Annotated[Usuario, Depends(require_active_subscription)]
DBSession = Annotated[Session, Depends(get_db)]
