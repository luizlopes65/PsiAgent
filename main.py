"""
PsiAgent API - Entry point limpo
Importa a aplicação FastAPI do submódulo main/
"""

from main import app
from config import settings

if __name__ == "__main__":
    import uvicorn
    
    print(settings)  
    
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.reload,
        log_level=settings.log_level
    )
