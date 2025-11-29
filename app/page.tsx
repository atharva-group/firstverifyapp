"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight } from "phosphor-react";
import AnalysisBars from "@/components/AnalysisBars";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  analysisData?: any;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!hasStarted) setHasStarted(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${apiUrl}/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const fullContent = data.response;

      // Parse out JSON block
      const jsonMatch = fullContent.match(/```json\n([\s\S]*?)\n```/);
      let analysisData = null;
      let textContent = fullContent;

      if (jsonMatch) {
        try {
          analysisData = JSON.parse(jsonMatch[1]);
          // Remove the JSON block from the text content
          textContent = fullContent.replace(/```json\n[\s\S]*?\n```/, "").trim();
        } catch (e) {
          console.error("Failed to parse JSON from response", e);
        }
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: textContent, analysisData },
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the latest analysis data
  const latestAnalysisData = messages
    .slice()
    .reverse()
    .find((m) => m.analysisData)?.analysisData;

  return (
    <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col p-6 lg:px-8 relative h-full">

        {/* Persistent Title */}
        <motion.div
          layout
          className={`text-center transition-all duration-500 ${hasStarted ? "mb-6" : "mt-[20vh] mb-12"}`}
        >
          <motion.h1
            layout
            className={`font-medium tracking-tight text-heading leading-tight transition-all duration-500 ${hasStarted ? "text-3xl md:text-4xl" : "text-5xl md:text-6xl lg:text-7xl"}`}
          >
            FirstVerify Chat
          </motion.h1>
          <motion.p
            layout
            className={`text-text-secondary max-w-2xl mx-auto leading-relaxed transition-all duration-500 ${hasStarted ? "text-sm md:text-base opacity-80" : "text-lg md:text-xl"}`}
          >
            Your offline, on-device AI assistant.
          </motion.p>
        </motion.div>

        <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto flex flex-col">
          <AnimatePresence mode="wait">
            {!hasStarted ? (
              // Initial Input Box
              <motion.div
                key="hero"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-4">
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
              </motion.div>
            ) : (
              // Split Screen Layout
              <motion.div
                key="split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex flex-col lg:flex-row gap-6 h-full"
              >
                {/* Left Panel: Analysis Bars */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-full lg:w-[40%] bg-white rounded-3xl shadow-lg border border-gray-100 p-6 overflow-y-auto h-full"
                >
                  <h2 className="text-xl font-semibold text-heading mb-4 sticky top-0 bg-white z-10 pb-2">Analysis</h2>
                  {latestAnalysisData ? (
                    <AnalysisBars data={latestAnalysisData} />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-text-secondary">
                      <p>Ask a question to see the analysis.</p>
                    </div>
                  )}
                </motion.div>

                {/* Right Panel: Chat */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-full lg:w-[60%] bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col overflow-hidden h-full"
                >
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-base leading-relaxed shadow-sm ${msg.role === "user"
                            ? "bg-primary text-white"
                            : "bg-white border border-gray-100 text-foreground"
                            }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
