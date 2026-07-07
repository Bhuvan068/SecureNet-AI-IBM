import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    api_key = os.getenv("IBM_API_KEY")
    url = "https://iam.cloud.ibm.com/identity/token"
    data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": api_key,
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=data)
        token = resp.json().get("access_token")
        
        models_url = "https://us-south.ml.cloud.ibm.com/ml/v1/foundation_model_specs?version=2023-05-29"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        resp = await client.get(models_url, headers=headers)
        
        models = resp.json().get("resources", [])
        granite_models = [m["model_id"] for m in models if "granite" in m["model_id"]]
        print("Granite models:", granite_models)

asyncio.run(main())
