from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    thread_id: str

class PatientResponse(BaseModel):
    id: int
    nome: str
    valor_sessao: Optional[float]
    queixa: Optional[str] = None
    divida: float
    dia_recorrente: Optional[int] = None 
    horario_recorrente: Optional[str] = None

class UpdateSessionRequest(BaseModel):
    notas: str


class SettingsResponse(BaseModel):
    last_updated: Optional[str] = None


class UpdateSettingsRequest(BaseModel):
    current_password: str
    new_password: str

