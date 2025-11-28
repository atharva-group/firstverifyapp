import httpx
import json
from .config import OPENROUTER_API_KEY
from .prompts import SYSTEM_PROMPT
from .tools import SERPER_TOOL_DESCRIPTION, serper_search

class OpenRouterAgent:
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "anthropic/claude-3.5-sonnet" # Or any other model

    async def chat(self, messages):
        # Add system prompt if not present
        if not any(m["role"] == "system" for m in messages):
            messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

        tools = [SERPER_TOOL_DESCRIPTION]
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/soroban", # Required by OpenRouter
            "X-Title": "Soroban Simple Agent"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "tools": tools,
            "max_tokens": 64000
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            message = data["choices"][0]["message"]
            
            # Handle tool calls
            if message.get("tool_calls"):
                tool_calls = message["tool_calls"]
                messages.append(message) # Add assistant message with tool calls
                
                for tool_call in tool_calls:
                    function_name = tool_call["function"]["name"]
                    function_args = json.loads(tool_call["function"]["arguments"])
                    
                    if function_name == "search":
                        tool_result = await serper_search(function_args["query"])
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "name": function_name,
                            "content": tool_result
                        })
                
                # Get final response after tool execution
                payload["messages"] = messages
                # Remove tools from second call to force a final answer (optional, but good for simple agents)
                # payload.pop("tools") 
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            
            return message["content"]
