from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from .agent import OpenRouterAgent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = OpenRouterAgent()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@app.post("/agent/chat")
async def chat(request: ChatRequest):
    # Convert Pydantic models to dicts
    messages = [m.dict() for m in request.messages]
    response = await agent.chat(messages)
    return {"response": response}

@app.get("/health")
async def health():
    return {"status": "ok"}
