from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Any

from app.core.dependecies import get_db, ActiveUser, DBSession
from app.models.clinica import Clinica
from app.schemas.clinica_schemas.schemas_assinatura import StatusAssinaturaOut, RenovacaoIn

router = APIRouter()

@router.get("/status", response_model=StatusAssinaturaOut)
async def consultar_status(
    db: DBSession,
    current_user: ActiveUser
):
    """
    Retorna o status da assinatura da clínica vinculada ao usuário logado.
    """
    # 1. Pegamos a clínica diretamente do usuário autenticado pelo JWT
    clinica = current_user.clinica
    
    if not clinica:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Clínica não encontrada para este usuário."
        )

    
    hoje = datetime.utcnow()
    
    # Tratamento caso a data_vencimento ainda não tenha sido definida
    if not clinica.data_vencimento:
        return {
            "clinica_nome": clinica.nome_fantasia,
            "status": "Sem Assinatura",
            "dias_restantes": 0,
            "data_vencimento": None
        }

    prazo = clinica.data_vencimento - hoje
    dias_restantes = prazo.days

    # 3. Definição da situação (Regra de Negócio)
    if dias_restantes < 0:
        situacao = "Inadimplente"
    elif hasattr(clinica, 'is_trial') and clinica.is_trial:
        situacao = "Trial"
    else:
        situacao = "Ativa"

    return {
        "clinica_nome": clinica.nome_fantasia,
        "status": situacao,
        "dias_restantes": max(0, dias_restantes),
        "data_vencimento": clinica.data_vencimento
    }

@router.post("/renovar", status_code=status.HTTP_200_OK)
async def renovar_assinatura(
    dados: RenovacaoIn, 
    db: DBSession,
    current_user: ActiveUser
):
    """
    Renovação segura: O clinica_id vem do token do usuário logado,
    impedindo que um usuário manipule dados de outras clínicas.
    """
    
   
    clinica = current_user.clinica
    
    if not clinica:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Vínculo com a clínica não encontrado."
        )

    agora = datetime.utcnow()
    
    
    base_data = clinica.data_vencimento if clinica.data_vencimento and clinica.data_vencimento > agora else agora
    
    nova_data = base_data + timedelta(days=dados.dias)
    
    
    clinica.data_vencimento = nova_data
    
    
    if hasattr(clinica, 'is_trial'):
        clinica.is_trial = False
        
    if clinica.assinatura:
        from app.models.clinica.assinatura import StatusAssinatura
        clinica.assinatura.status = StatusAssinatura.ATIVA
        clinica.assinatura.data_vencimento = nova_data

    try:
        db.commit()
        db.refresh(clinica)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao persistir renovação no banco de dados."
        )
    
    return {
        "message": "Assinatura renovada com sucesso",
        "clinica": clinica.nome_fantasia,
        "nova_validade": clinica.data_vencimento.strftime("%Y-%m-%d %H:%M:%S")
    }