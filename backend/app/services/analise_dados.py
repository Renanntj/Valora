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
        
        # Identifica as faltas
        faltas = df[df['status'].str.contains('falta|faltou', case=False, na=False)]
        
        
        colunas_valor = [c for c in df.columns if 'valor' in c]
        if colunas_valor:
            nome_col = colunas_valor[0]
            valores = pd.to_numeric(df[nome_col], errors='coerce').fillna(0)
            perda_financeira = valores.iloc[faltas.index].sum()
        else:
            perda_financeira = 0
            
        dados_resumo = {
            "total_consultas": total_agendamentos,
            "total_faltas": len(faltas),
            "perda_monetaria": float(perda_financeira), # Converte para float puro para o JSON
            "taxa_adesao": f"{((total_agendamentos - len(faltas)) / total_agendamentos) * 100:.2f}%" if total_agendamentos > 0 else "0%"
        }
        
        feedback_ia = await IAService.gerar_consultoria(dados_resumo)

        return {
            "metricas": dados_resumo,
            "analise_ia": feedback_ia
        }