import os
import google.generativeai as genai
from .prompt import PROMPT_VALORA
class IAService:
    @staticmethod
    async def gerar_consultoria(dados: dict) -> str:
    
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY não encontrada nas variáveis de ambiente.")
            
        genai.configure(api_key=api_key)
        
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        
        prompt = PROMPT_VALORA
        
        
        try:
            resposta = await model.generate_content_async(prompt)
            return resposta.text
        except Exception as e:
        
            print(f"Erro na API do Gemini: {e}")
            return (
                f"Identificamos um prejuízo de R$ {dados.get('perda_monetaria')} com faltas. "
                "Recomendamos implementar confirmação de consultas com 24h de antecedência para mitigar essas perdas."
            )