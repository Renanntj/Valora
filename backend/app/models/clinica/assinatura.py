from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime
import enum

class StatusAssinatura(enum.Enum):
    ATIVA = "ativa"
    INADIMPLENTE = "inadimplente" # Dado de vencimento
    CANCELADA = "cancelada"
    TRIAL = "trial" # Período de teste gratuito
class Assinatura(Base):
    __tablename__ = "assinaturas"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    
    plano_nome = Column(String)
    valor_pago = Column(Float)
    duracao_dias = Column(Integer)
    
    data_inicio = Column(DateTime, default=datetime.datetime.now)
    data_vencimento = Column(DateTime, nullable=False)
    
    status = Column(Enum(StatusAssinatura), default=StatusAssinatura.TRIAL)
    ultimo_pagamento = Column(DateTime, default=datetime.datetime.now)

    
    usuario = relationship("Usuario", back_populates="assinatura")