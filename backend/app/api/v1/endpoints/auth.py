"""
Router: /auth

Endpoints públicos (sem autenticação prévia):
    POST /auth/login    — autentica e retorna access + refresh tokens
    POST /auth/refresh  — renova o access token via refresh token válido
    POST /auth/logout   — invalida o refresh token (client-side + blocklist futura)

Considerações de segurança implementadas:
    - Mensagens de erro genéricas para evitar user enumeration
    - Delays implícitos via bcrypt (custo computacional de hash)
    - Separação entre access token (curto) e refresh token (longo)
    - Validação do campo `type` no payload do JWT
    - Rate limiting deve ser aplicado na camada de infraestrutura (nginx/gateway)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependecies import get_db, ActiveUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.clinica.usuario import Usuario
from app.schemas.auth_schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
)

router = APIRouter()

# Mensagem genérica para qualquer falha de credencial (evita user enumeration)
_INVALID_CREDENTIALS_MSG = "E-mail ou senha incorretos."


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _get_user_by_email(db: Session, email: str) -> Usuario | None:
    """Busca usuário por e-mail de forma case-insensitive."""
    return (
        db.query(Usuario)
        .filter(Usuario.email == email.lower().strip())
        .first()
    )


def _authenticate_user(db: Session, email: str, password: str) -> Usuario:
    """
    Valida credenciais e retorna o usuário autenticado.

    Sempre executa verify_password mesmo quando o usuário não existe,
    prevenindo timing attacks por enumeração de e-mail.
    """
    user = _get_user_by_email(db, email)

    # Hash fictício para manter tempo de resposta constante
    _dummy_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
    password_to_check = user.senha_hash if user else _dummy_hash

    if not verify_password(password, password_to_check) or user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_INVALID_CREDENTIALS_MSG,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Autenticar usuário",
    description=(
        "Autentica com e-mail e senha. Retorna um access token de curta duração "
        "e um refresh token para renovação. "
        "**Rate limit**: máximo 10 tentativas/minuto por IP (configurar no gateway)."
    ),
)
def login(
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    user = _authenticate_user(db, body.email, body.password)

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Renovar access token",
    description=(
        "Recebe um refresh token válido e retorna um novo access token. "
        "O refresh token não é rotacionado nesta implementação; "
        "implemente uma blocklist (Redis) para revogar tokens comprometidos."
    ),
)
def refresh_token(
    body: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AccessTokenResponse:
    invalid_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(body.refresh_token)

        if payload.get("type") != "refresh":
            raise invalid_exc

        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise invalid_exc

    # Confirma que o usuário ainda existe
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise invalid_exc

    new_access_token = create_access_token(subject=user.id)

    return AccessTokenResponse(
        access_token=new_access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout",
    description=(
        "Endpoint semântico de logout. Como JWTs são stateless, a invalidação "
        "real requer uma blocklist server-side (ex: Redis com TTL = expiração do token). "
        "Implemente `TokenBlocklistService` e chame-o aqui para produção crítica."
    ),
)
def logout(current_user: ActiveUser) -> None:
    """
    TODO: Para invalidação real de tokens em produção:
        1. Receba o access token no header Authorization (use get_current_active_user)
        2. Adicione o `jti` (JWT ID) em uma blocklist Redis com TTL = exp - now
        3. Verifique a blocklist em `get_current_user_from_token`
    """
    return None  # 204 No Content
