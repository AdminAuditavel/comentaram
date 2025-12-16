from fastapi import FastAPI
from db.supabase import supabase
import os
from dotenv import load_dotenv

# Carregar as variáveis de ambiente
load_dotenv()

app = FastAPI()

# Carregar as variáveis do .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Função para calcular o IAP e gerar o ranking
def get_ranking():
    # Buscar os dados do ranking (essa parte depende de como você está armazenando os dados)
    ranking_data = (
        supabase.table("ranking")  # Ajuste com o nome da sua tabela
        .select("club_id, rank_position, score, volume_total")
        .execute()
        .data
    )
    return ranking_data

@app.get("/ranking")
def read_ranking():
    ranking = get_ranking()
    return {"ranking": ranking}
