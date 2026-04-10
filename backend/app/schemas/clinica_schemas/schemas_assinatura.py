from pydantic import BaseModel, Field
from datetime import datetime

class StatusAssinaturaOut(BaseModel):
    clinica_nome: str
    status: str  # Ex: "Ativa", "Inadimplente", "Trial"
    dias_restantes: int
    data_vencimento: datetime

    class Config:

        from_attributes = True
        
class RenovacaoIn(BaseModel):
    # Validamos para que o gerente só possa escolher períodos específicos
    dias: int = Field(..., description="Quantidade de dias para renovar: 30, 60 ou 90")

    class Config:
        json_schema_extra = {
            "example": {
                "dias": 30
            }
        }