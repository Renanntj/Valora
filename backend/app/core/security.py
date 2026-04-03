"""
Módulo central de segurança.

Responsabilidades:
- Hashing e verificação de senhas (bcrypt via passlib)
- Geração e validação de JWT (access + refresh tokens)
- Constantes de configuração de segurança

"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt 
from jose import JWTError, jwt

from app.core.config import settings

# ---------------------------------------------------------------------------
# Utilitários de senha (Bcrypt Puro)
# ---------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """
    Retorna o hash bcrypt de uma senha em texto plano.
    O bcrypt exige bytes, então convertemos e depois voltamos para string.
    """
    pwd_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto plano corresponde ao hash armazenado.
    Protege contra timing attacks nativamente.
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Utilitários de JWT (Mantenha como já estava)
# ---------------------------------------------------------------------------
# ... restante do seu código (create_access_token, decode_token, etc) ...


# ---------------------------------------------------------------------------
# Utilitários de JWT
# ---------------------------------------------------------------------------

def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    """
    Cria um JWT assinado com HS256.

    Args:
        data: Payload do token. Nunca inclua dados sensíveis (ex: senha).
        expires_delta: Tempo de vida do token.

    Returns:
        Token JWT codificado como string.
    """
    payload = data.copy()
    expire = datetime.now(tz=timezone.utc) + expires_delta
    payload.update({"exp": expire, "iat": datetime.now(tz=timezone.utc)})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: int | str, extra_claims: dict[str, Any] | None = None) -> str:
    """
    Gera um access token de curta duração.

    Args:
        subject: Identificador do usuário (user_id).
        extra_claims: Claims adicionais opcionais (ex: roles).

    Returns:
        JWT de acesso.
    """
    payload: dict[str, Any] = {"sub": str(subject), "type": "access"}
    if extra_claims:
        payload.update(extra_claims)
    return _create_token(payload, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(subject: int | str) -> str:
    """
    Gera um refresh token de longa duração.

    Refresh tokens só carregam o `sub` e `type` para minimizar superfície de ataque.
    """
    payload: dict[str, Any] = {"sub": str(subject), "type": "refresh"}
    return _create_token(payload, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str) -> dict[str, Any]:
    """
    Decodifica e valida um JWT.

    Raises:
        JWTError: Token inválido, expirado ou adulterado.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
