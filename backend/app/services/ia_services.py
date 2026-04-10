import google.generativeai as genai  # Importação correta
from app.core.config import settings
from .prompt import PROMPT_VALORA

class IAService:
    
    genai.configure(api_key=settings.GEMINI_API_KEY)

    @staticmethod
    async def gerar_consultoria(dados: dict) -> str:
        
        
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        
        prompt_final = f"{PROMPT_VALORA}\n\nDados da Clínica: {dados}"
        
        try:
            
            resposta = model.generate_content(prompt_final)
            return resposta.text
            
        except Exception as e:
            print(f"Erro no Valora IA: {e}")
            return (
                f"Prejuízo detectado: R$ {dados.get('perda_monetaria')}. "
                "Recomendamos revisão das confirmações de agenda."
            )