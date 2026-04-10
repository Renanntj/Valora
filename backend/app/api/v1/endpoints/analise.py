from fastapi import APIRouter, UploadFile, File
from app.core.dependecies import DBSession, SubscriberUser
from app.services.analise_dados import AnaliseService

router = APIRouter()
 # exclusiva para assinantes
@router.post("/upload-analise")
async def analisar_planilha_clinica(
    db: DBSession,
    user: SubscriberUser,
    file: UploadFile = File(...)
    
):
    """
    Recebe a planilha, calcula métricas e retorna a consultoria do Valora.
    Acesso restrito a assinantes ativos/trial.
    """
    
    resultado = await AnaliseService.executar_fluxo_inteligente(
        file=file, 
        clinica_id=user.clinica_id,
        db=db 
    )
    
    return {
        "clinica": user.clinica.nome_fantasia if user.clinica else "Clínica",
        "analise": resultado
    }