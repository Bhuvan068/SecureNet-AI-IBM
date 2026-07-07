import asyncio
import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def main():
    api_key = os.getenv("IBM_API_KEY")
    space_id = os.getenv("IBM_SPACE_ID")
    
    url = "https://iam.cloud.ibm.com/identity/token"
    data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": api_key,
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=data)
        token = resp.json().get("access_token")
        
        gen_url = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        prompt = (
            "<|start_of_role|>system<|end_of_role|>You are a helpful assistant.<|end_of_text|>\n"
            "<|start_of_role|>user<|end_of_role|>Hello!<|end_of_text|>\n"
            "<|start_of_role|>assistant<|end_of_role|>"
        )
        
        body = {
            "model_id": "ibm/granite-4-h-small",
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 100,
            },
            "space_id": space_id
        }
        
        resp = await client.post(gen_url, headers=headers, json=body)
        print("Status:", resp.status_code)
        try:
            print("Response:", json.dumps(resp.json(), indent=2))
        except Exception as e:
            print("Response text:", resp.text)

asyncio.run(main())
