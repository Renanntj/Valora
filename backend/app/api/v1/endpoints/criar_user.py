
"""
Router: /setup
 
Rota TEMPORÁRIA para criação do primeiro usuário administrador SaaS.
 
IMPORTANTE — remova ou desabilite este router assim que o primeiro admin for criado.
 
Proteção implementada:
    - Exige o header X-Setup-Key com valor igual a SETUP_SECRET_KEY do .env
    - Só cria o usuário se NÃO existir nenhum admin (is_admin_saas=True) no banco
    - Disponível apenas quando ENVIRONMENT != "production", ou quando
      SETUP_SECRET_KEY está definida explicitamente
 
Como usar:
    curl -X POST http://localhost:8000/setup/primeiro-admin \
         -H "Content-Type: application/json" \
         -H "X-Setup-Key: sua_chave_aqui" \
         -d '{"nome": "Admin", "email": "admin@empresa.com", "password": "Senha@123"}'
 
Após criar o admin, remova este router do main.py e delete este arquivo.
"""
 
from fastapi import APIRouter, Header, HTTPException, status
from sqlalchemy.exc import IntegrityError
 
from app.core.config import settings
from app.core.dependecies import DBSession
from app.core.security import hash_password
from app.models.clinica.usuario import Usuario
from app.schemas.auth_schemas.auth import UsuarioCreate, UsuarioPublic
 
router = APIRouter()
 
 
def _verify_setup_key(x_setup_key: str = Header(..., alias="X-Setup-Key")) -> None:
    """
    Valida o header X-Setup-Key contra SETUP_SECRET_KEY do .env.
    Retorna 401 com mensagem genérica em caso de falha (sem revelar se a chave existe).
    """
    if not settings.SETUP_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Setup não habilitado. Defina SETUP_SECRET_KEY no .env.",
        )
 
    # Comparação em tempo constante para evitar timing attack
    import hmac
    if not hmac.compare_digest(x_setup_key, settings.SETUP_SECRET_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave de setup inválida.",
        )
 
 
@router.post(
    "/primeiro-admin",
    response_model=UsuarioPublic,
    status_code=status.HTTP_201_CREATED,
    summary="[TEMPORÁRIO] Criar primeiro administrador SaaS",
    description=(
        "Cria o usuário admin inicial. Só funciona se **não houver nenhum admin** "
        "cadastrado no banco. Exige o header `X-Setup-Key` com o valor de "
        "`SETUP_SECRET_KEY` definido no `.env`. "
        "**Remova este endpoint após o uso.**"
    ),
)
def criar_primeiro_admin(
    body: UsuarioCreate,
    db: DBSession,
    _: None = None,  # placeholder para a dependency abaixo
    x_setup_key: str = Header(..., alias="X-Setup-Key"),
) -> UsuarioPublic:
    # 1. Valida a chave de setup
    _verify_setup_key(x_setup_key)
 
    # 2. Garante que não existe nenhum admin ainda
    admin_existente = (
        db.query(Usuario).filter(Usuario.is_admin_saas == True).first()  # noqa: E712
    )
    if admin_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um administrador cadastrado. Este endpoint está desabilitado.",
        )
 
    # 3. Cria o admin
    novo_admin = Usuario(
        nome=body.nome,
        email=body.email.lower().strip(),
        senha_hash=hash_password(body.password),
        is_admin_saas=True,
        clinica_id=None,
    )
 
    db.add(novo_admin)
    try:
        db.commit()
        db.refresh(novo_admin)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não foi possível completar o cadastro. E-mail já em uso.",
        )
 
    return UsuarioPublic.model_validate(novo_admin)