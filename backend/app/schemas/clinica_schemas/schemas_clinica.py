from pydantic import BaseModel, ConfigDict
from typing import Optional


class Criar_Clinica_Schema(BaseModel):
    nome_fantasia : str
    cnpj : str
    ativo : Optional[bool]
    
    model_config = ConfigDict(from_attributes=True)