"""
Schemas Pydantic para validação de entrada/saída.

Separação deliberada entre schemas de entrada (request) e saída (response)
para evitar que campos internos (senha_hash, is_admin_saas) sejam expostos
acidentalmente via serialização.
"""

from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Helpers de validação
# ---------------------------------------------------------------------------

_PASSWORD_MIN_LEN = 8
_PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$"
)


def _validate_password_strength(v: str) -> str:
    """
    Garante que a senha atenda a critérios mínimos de segurança:
    - Mínimo 8 caracteres
    - Ao menos 1 letra maiúscula, 1 minúscula, 1 dígito e 1 caractere especial
    """
    if not _PASSWORD_REGEX.match(v):
        raise ValueError(
            "A senha deve ter no mínimo 8 caracteres, incluindo "
            "maiúscula, minúscula, número e caractere especial."
        )
    return v


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Credenciais de login."""

    email: EmailStr
    password: str = Field(..., min_length=1)

    model_config = {"str_strip_whitespace": True}


class TokenResponse(BaseModel):
    """Resposta padrão de autenticação bem-sucedida."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos até expirar o access token


class RefreshRequest(BaseModel):
    """Payload para renovação de access token via refresh token."""

    refresh_token: str


class AccessTokenResponse(BaseModel):
    """Novo access token gerado a partir de um refresh token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ---------------------------------------------------------------------------
# Usuário schemas
# ---------------------------------------------------------------------------

class UsuarioCreate(BaseModel):
    """
    Dados necessários para criar um novo usuário.

    Qualquer usuário pode se registrar. Campos administrativos
    (is_admin_saas, clinica_id) são definidos separadamente por admins.
    """

    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str

    model_config = {"str_strip_whitespace": True}

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class UsuarioPublic(BaseModel):
    """
    Representação segura de um usuário para respostas da API.

    Campos sensíveis (senha_hash, is_admin_saas) são deliberadamente omitidos.
    """

    id: int
    nome: str
    email: EmailStr
    clinica_id: int | None
    eh_assinante_ativo: bool

    model_config = {"from_attributes": True}


class UsuarioAdminUpdate(BaseModel):
    """
    Campos que apenas administradores SaaS podem alterar.

    Endpoint exclusivo: PATCH /usuarios/{id}/admin
    """

    is_admin_saas: bool | None = None
    clinica_id: int | None = None


class UsuarioSelfUpdate(BaseModel):
    """
    Campos que o próprio usuário pode alterar no seu perfil.
    """

    nome: str | None = Field(default=None, min_length=2, max_length=100)
    password: str | None = None

    model_config = {"str_strip_whitespace": True}

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str | None) -> str | None:
        if v is not None:
            return _validate_password_strength(v)
        return v


class UsuarioAdminView(UsuarioPublic):
    """
    Visão estendida visível apenas para admins SaaS.
    Inclui o campo is_admin_saas.
    """

    is_admin_saas: bool
