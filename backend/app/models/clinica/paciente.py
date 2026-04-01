from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base



class Paciente(Base):
    __tablename__ = "pacientes"
    
    id = Column(Integer, primary_key=True, index=True)
    clinica_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    nome = Column(String, nullable=False)
    telefone = Column(String, nullable=False)
    email_cliente = Column(String, nullable=False)
    
    clinica = relationship("Clinica", back_populates="pacientes")
    agendamentos = relationship("Agendamento", back_populates="paciente")
    #mundaças futuras