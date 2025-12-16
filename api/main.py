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

# Endpoint de exemplo para pegar dados do Supabase
@app.get("/data")
async def get_data():
    try:
        response = supabase.table("sua_tabela").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        return {"error": str(e)}

