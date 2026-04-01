from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class StatusAgendamento(enum.Enum):
    CONCLUIDO = "concluido"
    FALTOU = "faltou"
    CANCELADO = "cancelado"
    AGENDADO = "agendado"

class Agendamento(Base):
    __tablename__ = "agendamentos"
    
    id = Column(Integer, primary_key=True, index=True)
    clinica_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    
    data_hora = Column(DateTime, nullable=False)
    valor_procedimento = Column(Float, nullable=False)
    status = Column(Enum(StatusAgendamento), default=StatusAgendamento.AGENDADO)
    
    clinica = relationship("Clinica", back_populates="agendamentos")
    paciente = relationship("Paciente", back_populates="agendamentos")