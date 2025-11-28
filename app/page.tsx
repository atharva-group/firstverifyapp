"use client";

import { useState } from "react";
import { ArrowRight } from "phosphor-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const response = await fetch(`${apiUrl}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!response.ok) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
      setIsLoading(false);
      return;
    }

    const data = await response.json();
    setMessages([
      ...newMessages,
      { role: "assistant", content: data.response },
    ]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:px-8 relative overflow-hidden">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

          {/* Hero Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-heading mb-6 leading-tight">
              FirstVerify Chat
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Your offline, on-device AI assistant.
            </p>
          </div>

          {/* Chat Container */}
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[600px]">

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-base leading-relaxed shadow-sm ${msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-100 text-foreground"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full h-14 pl-6 pr-14 rounded-full border border-gray-200 bg-gray-50 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-lg"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2.5 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight size={20} weight="bold" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
