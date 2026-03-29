from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

# URL do banco de dados SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./db/clinical_data.db"

# Criação da engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Sessão local
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa
Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    
    birth_date = Column(DateTime, nullable=True) 
    
    contact_info = Column(String)
    main_complaint = Column(Text)
    hourly_rate = Column(Float, default=0.0)
    current_debt = Column(Float, default=0.0)
    

    recurrence_week_day = Column(Integer, nullable=True) 
    
    recurrence_time = Column(String, nullable=True)
    # ---------------------------------------
    
    created_at = Column(DateTime, default=datetime.now)

    sessions = relationship("SessionLog", back_populates="patient", cascade="all, delete-orphan")
    

class SessionLog(Base):
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Data específica DESTA sessão (histórico ou futuro agendado pontual)
    session_date = Column(DateTime, default=datetime.now)
    
    content_private = Column(Text, nullable=False)
    insights_ai = Column(Text)
    is_paid = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="sessions")

class Interaction(Base):
    """
    Log de auditoria do chat
    """
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)                 
    content = Column(Text, nullable=False)                
    timestamp = Column(DateTime, default=datetime.now) 


class AppConfig(Base):
    __tablename__ = "app_config"

    id = Column(Integer, primary_key=True, index=True)
    api_secret = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas Clínicas (Patients, SessionLogs, Interactions) verificadas/criadas.")

def reset_database():
    print("🗑️ Apagando todas as tabelas...")
    Base.metadata.drop_all(bind=engine)
    
    print("✨ Criando novas tabelas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Banco de dados resetado com sucesso!")

if __name__ == "__main__":
    delete = False 
    if delete:
        try:
            input("⚠️ CUIDADO: Isso apagará TODOS os dados. Pressione Enter para confirmar ou Ctrl+C para cancelar.")
            reset_database()
        except KeyboardInterrupt:
            print("\nOperação cancelada.")
    else:
        create_tables()
