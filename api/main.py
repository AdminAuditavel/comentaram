from fastapi import FastAPI
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Carregar as variáveis de ambiente
load_dotenv()

app = FastAPI()

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Endpoint de teste
@app.get("/")
def read_root():
    return {"message": "Pulso Esportivo API funcionando!"}

# Endpoint para pegar dados da tabela daily_ranking
@app.get("/daily_ranking")
async def get_daily_ranking():
    try:
        response = supabase.table("daily_ranking").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        return {"error": str(e)}
