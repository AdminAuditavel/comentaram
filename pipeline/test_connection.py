from db.supabase import supabase

def main():
    response = supabase.table("clubs").select("id, name_official").limit(5).execute()
    print("Conexão OK. Clubes:")
    for row in response.data:
        print(row)

if __name__ == "__main__":
    main()
