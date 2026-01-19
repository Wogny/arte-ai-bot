import requests
import os
import sys

def setup_meta(app_id, app_secret, short_token):
    print(f"--- Iniciando Configuração Meta ---")
    
    # 1. Trocar token curto por token de longa duração (60 dias)
    print("1. Gerando Token de Longa Duração...")
    url = "https://graph.facebook.com/v18.0/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "error" in data:
        print(f"Erro ao gerar token: {data['error']['message']}")
        return
    
    long_token = data["access_token"]
    print("Sucesso! Token de longa duração gerado.")
    
    # 2. Buscar ID do Usuário e Páginas
    print("\n2. Buscando Páginas do Facebook vinculadas...")
    url = "https://graph.facebook.com/v18.0/me/accounts"
    params = {"access_token": long_token}
    response = requests.get(url, params=params)
    pages_data = response.json()
    
    if "data" not in pages_data or len(pages_data["data"]) == 0:
        print("Nenhuma página do Facebook encontrada. Certifique-se de que você é admin de uma página.")
        return

    # 3. Buscar Conta do Instagram em cada página
    print(f"Encontradas {len(pages_data['data'])} páginas. Buscando contas do Instagram Business...")
    
    found_ig = False
    for page in pages_data["data"]:
        page_id = page["id"]
        page_name = page["name"]
        print(f"Verificando página: {page_name} ({page_id})")
        
        url = f"https://graph.facebook.com/v18.0/{page_id}"
        params = {
            "fields": "instagram_business_account",
            "access_token": long_token
        }
        response = requests.get(url, params=params)
        ig_data = response.json()
        
        if "instagram_business_account" in ig_data:
            ig_id = ig_data["instagram_business_account"]["id"]
            print(f"!!! CONTA INSTAGRAM ENCONTRADA: {ig_id}")
            
            # Buscar detalhes do Instagram
            url = f"https://graph.facebook.com/v18.0/{ig_id}"
            params = {
                "fields": "username,name,profile_picture_url",
                "access_token": long_token
            }
            ig_details = requests.get(url, params=params).json()
            
            print(f"Username: @{ig_details.get('username')}")
            print(f"Nome: {ig_details.get('name')}")
            
            # Salvar no .env
            print("\n3. Salvando configurações no arquivo .env...")
            with open("/home/ubuntu/arte-ai-bot/.env", "a") as f:
                f.write(f"\n# Configurações Automáticas Meta\n")
                f.write(f"FACEBOOK_LONG_LIVED_TOKEN={long_token}\n")
                f.write(f"INSTAGRAM_BUSINESS_ACCOUNT_ID={ig_id}\n")
                f.write(f"INSTAGRAM_USERNAME={ig_details.get('username')}\n")
            
            print("TUDO PRONTO! O site agora está conectado ao Instagram.")
            found_ig = True
            break
            
    if not found_ig:
        print("\nAVISO: Nenhuma conta do Instagram Business foi encontrada vinculada às suas páginas.")
        print("Certifique-se de que seu Instagram é uma conta 'Profissional' e está vinculada a uma Página do Facebook.")

if __name__ == "__main__":
    APP_ID = "1668700137832011"
    APP_SECRET = "17b4d63126c9172318cf078fbc45b99e"
    SHORT_TOKEN = "EAAXtrIbzvksBQmZAffjz8Hy8d2EuEVLfyixKOP3pJdKtLh0akViRQCIHAg19dISyfiLoF3rSVmZBR1qPqPZACtqZAXu65vTrNuhy0gM40nar3BZAaZCg8cpd4gnZBVeZClVCp144i41FCLz8riqCJUTH8XyIXvfKYOEolc6ZAXeip0IB2oOim3wn3P7FiBL93tQ6yRZBP57TpiAlLtKTvEpIk8ZCirwkQ8ZCjKFsdVhkd4fjwh35I7ZBsMqg4y2k6eD9h3wwXxqFOZAsZBV651mqUmggfI6y22ts55DjBE1qM5PfwZDZD"
    setup_meta(APP_ID, APP_SECRET, SHORT_TOKEN)
