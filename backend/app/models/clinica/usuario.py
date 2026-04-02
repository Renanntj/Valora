from sqlalchemy import Column, Integer, String,ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from .assinatura import StatusAssinatura
import datetime


class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    clinica_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    is_admin_saas = Column(Boolean, default=False)

    # Relacionamentos
    clinica = relationship(
        "Clinica", 
        back_populates="usuarios", 
        foreign_keys="[Usuario.clinica_id]" 
    )
    
    # uselist=False porque 1 Usuário tem 1 Assinatura no seu modelo
    assinatura = relationship("Assinatura", back_populates="usuario", uselist=False)
    
    clinicas_proprias = relationship(
        "Clinica", 
        back_populates="dono", 
        foreign_keys="[Clinica.dono_id]" # Aponta para a FK no modelo Clinica
    )

    @property
    def eh_assinante_ativo(self):
        if not self.assinatura:
            return False
        agora = datetime.datetime.now()
        status_ok = self.assinatura.status in [StatusAssinatura.ATIVA, StatusAssinatura.TRIAL]
        return status_ok and self.assinatura.data_vencimento > agora