import React, { useState, useRef, useEffect } from "react";
import { Send, Leaf, User, MessageSquareCode } from "lucide-react";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  loading: boolean;
}

export default function ChatPanel({ messages, onSendMessage, loading }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick prompt chips
  const quickChips = [
    "How are your roots?",
    "Is my pH stable?",
    "What is tipburn?",
    "How does light intensity look?",
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleChipClick = (chip: string) => {
    if (loading) return;
    onSendMessage(chip);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="bg-[#12141c]/60 border border-slate-900 rounded-lg p-3.5 flex flex-col space-y-3 font-mono text-xs h-[360px] md:h-full select-none" id="chat-terminal-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquareCode className="w-3.5 h-3.5 text-yellow-500" />
            Caretaker Terminal Chat
          </span>
          <span className="text-[8px] text-slate-500 uppercase mt-0.5">
            Real-time chat with LettuceTwin AI
          </span>
        </div>
        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded">
          <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse" />
          ONLINE
        </span>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 bg-slate-950/70 border border-slate-950 rounded p-2 overflow-y-auto space-y-3 min-h-0" id="chat-scroller">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
            <Leaf className="w-6 h-6 text-slate-700 animate-pulse mb-2" />
            <p className="text-[9.5px] font-bold">Ask the digital twin about its physiological comfort, roots, mineral appetite, or climate stress.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div key={m.id} className={`flex items-start gap-2 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`} id={`chat-msg-${m.id}`}>
                {/* Avatar */}
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${isUser ? "bg-[#a3e635] text-slate-950" : "bg-emerald-950 text-emerald-400 border border-emerald-800/40"}`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Leaf className="w-3.5 h-3.5" />}
                </div>
                {/* Message Bubble */}
                <div className={`p-2.5 rounded-lg text-[9px] sm:text-[9.5px] leading-relaxed ${isUser ? "bg-[#a3e635] text-slate-950 font-bold" : "bg-[#141620] text-slate-200 border border-slate-900"}`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            );
          })
        )}
        {loading && (
          <div className="flex items-start gap-2 max-w-[85%] mr-auto" id="chat-loading-bubble">
            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              <Leaf className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-2 bg-[#141620] border border-slate-900 rounded-lg text-[9.5px] text-slate-400 italic">
              <span>Lettuce is photosynthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips Row */}
      <div className="flex flex-wrap gap-1" id="prompt-chips-wrapper">
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            disabled={loading}
            className="text-[8px] font-bold bg-[#14151b] hover:bg-[#1f202a] active:bg-[#a3e635] active:text-slate-950 border border-slate-900 text-slate-400 hover:text-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="flex gap-2" id="chat-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={loading ? "Waiting for twin..." : "Send caretakers instruction..."}
          disabled={loading}
          className="flex-1 bg-slate-950 text-slate-100 border border-slate-900 rounded px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          id="chat-input-field"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-[#a3e635] hover:bg-[#bbf246] text-slate-950 p-2 rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
          id="btn-chat-send"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
