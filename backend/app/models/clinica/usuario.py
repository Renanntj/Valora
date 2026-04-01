from sqlalchemy import Column, Integer, String,ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from .assinatura import StatusAssinatura
import datetime


class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    clinica_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    is_admin_saas = Column(Boolean, default=False)

    clinica = relationship("Clinica", back_populates="usuarios")
    assinatura = relationship("Assinatura", back_populates="clinica", uselist=False)

    @property
    def eh_assinante_ativo(self):
        if not self.assinatura:
            return False
        return (self.assinatura.status == StatusAssinatura.ATIVA or 
                self.assinatura.status == StatusAssinatura.TRIAL) and \
               (self.assinatura.data_vencimento > datetime.datetime.now())