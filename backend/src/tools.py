import httpx
import json
from .config import SERPER_API_KEY

SERPER_TOOL_DESCRIPTION = {
    "name": "search",
    "description": "Search the web for information using Google Search. Use this tool when you need to find current events, news, or information not in your training data. You can specify 'news' type for news articles and 'tbs' for time range.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query"
            },
            "search_type": {
                "type": "string",
                "enum": ["search", "news"],
                "description": "Type of search: 'search' (default) or 'news'",
                "default": "search"
            },
            "tbs": {
                "type": "string",
                "description": "Time range: 'qdr:h' (past hour), 'qdr:d' (past 24h), 'qdr:w' (past week), 'qdr:m' (past month), 'qdr:y' (past year)",
                "default": "qdr:w"
            }
        },
        "required": ["query"]
    }
}

async def serper_search(query: str, search_type: str = "search", tbs: str = "qdr:w"):
    base_url = "https://google.serper.dev"
    url = f"{base_url}/{search_type}" if search_type == "news" else f"{base_url}/search"
    
    payload_dict = {"q": query}
    if tbs:
        payload_dict["tbs"] = tbs
        
    payload = json.dumps(payload_dict)
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, data=payload)
        response.raise_for_status()
        results = response.json()
        
        compressed = []
        
        if search_type == "news":
            news_items = results.get("news", [])
            for item in news_items[:5]:
                compressed.append(f"Title: {item.get('title')}\nSource: {item.get('source')}\nDate: {item.get('date')}\nLink: {item.get('link')}\nSnippet: {item.get('snippet')}")
        else:
            # Organic results for standard search
            organic = results.get("organic", [])
            for item in organic[:5]:
                compressed.append(f"Title: {item.get('title')}\nLink: {item.get('link')}\nSnippet: {item.get('snippet')}")
            
        return "\n\n".join(compressed)
