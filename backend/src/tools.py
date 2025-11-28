import httpx
import json
from .config import SERPER_API_KEY

SERPER_TOOL_DESCRIPTION = {
    "name": "search",
    "description": "Search the web for information using Google Search. Use this tool when you need to find current events, news, or information not in your training data.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query"
            }
        },
        "required": ["query"]
    }
}

async def serper_search(query: str):
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query})
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, data=payload)
        response.raise_for_status()
        results = response.json()
        
        # Compress results - just take organic results snippets
        organic = results.get("organic", [])
        compressed = []
        for item in organic[:5]: # Top 5 results
            compressed.append(f"Title: {item.get('title')}\nLink: {item.get('link')}\nSnippet: {item.get('snippet')}")
            
        return "\n\n".join(compressed)
