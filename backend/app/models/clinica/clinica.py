from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime



class Clinica(Base):
    __tablename__ = "clinicas"
    id = Column(Integer, primary_key=True, index=True)
    dono_id = Column(Integer, ForeignKey("usuarios.id")) # Relacionamento com o dono
    nome_fantasia = Column(String, nullable=False)
    cnpj = Column(String, unique=True, index=True, nullable=True)
    ativa = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.datetime.now)

    # Relacionamentos
    dono = relationship(
        "Usuario", 
        back_populates="clinicas_proprias", 
        foreign_keys="[Clinica.dono_id]" # Note os colchetes dentro da string
    )   
    
    usuarios = relationship(
        "Usuario", 
        back_populates="clinica", 
        foreign_keys="[Usuario.clinica_id]" # Aponta para a FK no modelo Usuario
    )
    
    # Vínculo com a nova tabela de funcionários
    funcionarios = relationship("Funcionario", back_populates="clinica")
    
    pacientes = relationship("Paciente", back_populates="clinica")
    agendamentos = relationship("Agendamento", back_populates="clinica")