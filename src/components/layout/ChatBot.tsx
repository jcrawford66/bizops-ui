import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { format } from 'date-fns'

export default function ChatBot() {
  const { chatOpen, setChatOpen, chatMessages, sendChatMessage } = useApp()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = () => {
    if (!input.trim()) return
    sendChatMessage(input.trim())
    setInput('')
  }

  if (!chatOpen) return null

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">BizOps AI</p>
            <p className="text-white/70 text-xs">Ask about your business</p>
          </div>
        </div>
        <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-brand-400" />
              </div>
            )}
            <div className="max-w-[75%]">
              <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-200 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
              <p className={`text-[10px] text-slate-500 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {format(msg.timestamp, 'h:mm a')}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-thin">
        {['Last customer?', 'Revenue this month?', 'Low stock items?'].map(p => (
          <button
            key={p}
            onClick={() => sendChatMessage(p)}
            className="text-xs bg-slate-700 hover:bg-brand-500/20 hover:text-brand-400 text-slate-400 px-3 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your business..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-7 h-7 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
