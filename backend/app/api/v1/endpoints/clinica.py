from fastapi import APIRouter, Depends, HTTPException
from app.core.dependecies import get_db, AdminUser  
from sqlalchemy.orm import Session
from app.models.clinica.clinica import Clinica
from app.schemas.clinica_schemas.schemas_clinica import Criar_Clinica_Schema
from app.services.validar_cnpj import validar_cnpj
from typing import Annotated
router = APIRouter()


# so admin terá acesso
@router.post("/criar-clinica", status_code=201)
async def criar_clinica(
    data: Criar_Clinica_Schema, 
    admin: AdminUser,
    db: Session = Depends(get_db), 
     
):#nome #cpnj #ativa
    verificar_clinica = db.query(Clinica).filter(Clinica.nome_fantasia==data.nome_fantasia).first()
    if verificar_clinica:
        raise HTTPException(status_code=400, detail="Clinica existente")
    else:
        if not validar_cnpj(data.cnpj):
            raise HTTPException(status_code=400, detail="CNPJ Invalido")
    nova_clinica = Clinica(data.nome_fantasia, data.cnpj, data.ativo)
    db.add(nova_clinica)
    db.commit()
    
    return {
        "message": f"{nova_clinica} adicionado com sucesso"
    }