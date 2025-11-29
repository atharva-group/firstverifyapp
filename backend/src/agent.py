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
            "max_tokens": 64000,
            "stream": True
        }

        async with httpx.AsyncClient() as client:
            # First request - might be content or tool calls
            async with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=payload) as response:
                response.raise_for_status()
                
                tool_calls = []
                current_tool_call = None
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0]["delta"]
                            
                            # Handle content
                            if "content" in delta and delta["content"]:
                                yield delta["content"]
                                
                            # Handle tool calls
                            if "tool_calls" in delta:
                                for tc_delta in delta["tool_calls"]:
                                    if "id" in tc_delta:
                                        # New tool call starting
                                        if current_tool_call:
                                            tool_calls.append(current_tool_call)
                                        current_tool_call = {
                                            "id": tc_delta["id"],
                                            "function": {
                                                "name": tc_delta["function"]["name"],
                                                "arguments": ""
                                            },
                                            "type": "function"
                                        }
                                    elif "function" in tc_delta and "arguments" in tc_delta["function"]:
                                        # Appending arguments to current tool call
                                        if current_tool_call:
                                            current_tool_call["function"]["arguments"] += tc_delta["function"]["arguments"]
                                            
                        except json.JSONDecodeError:
                            continue
                            
                # Append the last tool call if exists
                if current_tool_call:
                    tool_calls.append(current_tool_call)

            # If we have tool calls, execute them and make a second request
            if tool_calls:
                # Add the assistant's message with tool calls to history
                messages.append({
                    "role": "assistant",
                    "tool_calls": tool_calls,
                    "content": None
                })
                
                for tool_call in tool_calls:
                    function_name = tool_call["function"]["name"]
                    try:
                        function_args = json.loads(tool_call["function"]["arguments"])
                    except json.JSONDecodeError:
                        # Fallback or error handling for bad JSON
                        function_args = {}
                    
                    if function_name == "search":
                        tool_result = await serper_search(
                            query=function_args.get("query"),
                            search_type=function_args.get("search_type", "search"),
                            tbs=function_args.get("tbs", "qdr:w")
                        )
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "name": function_name,
                            "content": tool_result
                        })
                
                # Second request with tool results
                payload["messages"] = messages
                # payload.pop("tools") # Optional: remove tools to force final answer
                
                async with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                delta = data["choices"][0]["delta"]
                                if "content" in delta and delta["content"]:
                                    yield delta["content"]
                            except json.JSONDecodeError:
                                continue
