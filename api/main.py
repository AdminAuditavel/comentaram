from fastapi import FastAPI, Query
from api.deps import supabase
from datetime import date

app = FastAPI(title="Pulso Esportivo API", version="v1")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ranking/today")
def ranking_today():
    data = (
        supabase
        .table("daily_iap_ranking")
        .select("*")
        .order("rank_position")
        .execute()
        .data
    )
    return data

@app.get("/ranking/by-date")
def ranking_by_date(d: date = Query(..., description="YYYY-MM-DD")):
    data = (
        supabase
        .table("daily_iap_ranking")
        .select("*")
        .eq("aggregation_date", str(d))
        .order("rank_position")
        .execute()
        .data
    )
    return data

@app.get("/clubs")
def clubs():
    return (
        supabase
        .table("clubs")
        .select("id, name_official, name_short")
        .eq("active", True)
        .execute()
        .data
    )

@app.get("/clubs/{club_id}/history")
def club_history(club_id: str, limit: int = 30):
    return (
        supabase
        .table("daily_iap")
        .select("aggregation_date, iap_score, volume_total")
        .eq("club_id", club_id)
        .order("aggregation_date", desc=True)
        .limit(limit)
        .execute()
        .data
    )
