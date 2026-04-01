from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime





class Clinica(Base):
    __tablename__ = "clinicas"
    
    id = Column(Integer, primary_key=True, index=True)
    nome_fantasia = Column(String, nullable=False)
    cnpj = Column(String, unique=True, index=True, nullable=True)
    ativa = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)

    # Relacionamentos
    usuarios = relationship("Usuario", back_populates="clinica")
    pacientes = relationship("Paciente", back_populates="clinica")
    agendamentos = relationship("Agendamento", back_populates="clinica")