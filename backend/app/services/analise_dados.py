import pandas as pd
import io
from .ia_services import IAService
class AnaliseService:
    @staticmethod
    async def executar_fluxo_inteligente(file, clinica_id, db):
        
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents)) if file.filename.endswith('.xlsx') else pd.read_csv(io.BytesIO(contents))
        
        
        df.columns = [c.strip().lower() for c in df.columns]
        total_agendamentos = len(df)
        faltas = df[df['status'].str.contains('falta|faltou', case=False, na=False)]
        perda_financeira = faltas['valor'].sum() if 'valor' in df.columns else 0
        
        
        dados_resumo = {
            "total_consultas": total_agendamentos,
            "total_faltas": len(faltas),
            "perda_monetaria": perda_financeira,
            "taxa_adesao": f"{( (total_agendamentos - len(faltas)) / total_agendamentos ) * 100:.2f}%"
        }

        
        feedback_ia = await IAService.gerar_consultoria(dados_resumo)

        return {
            "metricas": dados_resumo,
            "analise_ia": feedback_ia
        }