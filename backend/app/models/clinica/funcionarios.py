from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class Funcionario(Base):
    __tablename__ = "funcionarios"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    clinica_id = Column(Integer, ForeignKey("clinicas.id"))
    
    cargo = Column(String, nullable=True) # Ex: Recepcionista, Médico, Dentista
    ativo = Column(Boolean, default=True)
    data_admissao = Column(DateTime, default=datetime.datetime.now)

    usuario = relationship("Usuario")
    clinica = relationship("Clinica", back_populates="funcionarios")