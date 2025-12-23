import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Send, Bot, PenTool, Trash2 } from 'lucide-react';

interface ChatSession {
    id: number;
    title: string;
    createdAt: string;
}

interface ChatMessage {
    role: 'USER' | 'ASSISTANT';
    content: string;
}

const ChatWidget = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (currentSessionId) {
            fetchMessages(currentSessionId);
        }
    }, [currentSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/chat/history');
            setSessions(res.data);
            if (res.data.length > 0 && !currentSessionId) {
                setCurrentSessionId(res.data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (id: number) => {
        try {
            const res = await api.get(`/chat/${id}`);
            const sorted = res.data.messages.sort((a: any, b: any) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setMessages(sorted);
        } catch (err) {
            console.error(err);
        }
    };

    const startNewChat = async () => {
        try {
            const res = await api.post('/chat/start', { title: 'New Conversation' });
            setSessions([res.data, ...sessions]);
            setCurrentSessionId(res.data.id);
            setMessages([]);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteCurrentSession = async () => {
        if (!currentSessionId) return;
        if (!confirm('Are you sure you want to burn this scroll?')) return;
        
        try {
            await api.delete(`/chat/${currentSessionId}`);
            setSessions(prev => prev.filter(s => s.id !== currentSessionId));
            setCurrentSessionId(null);
            setMessages([]);
            
            // Optionally select the next available or just leave empty
            // If we want to auto-select another:
            // const remaining = sessions.filter(s => s.id !== currentSessionId);
            // if (remaining.length > 0) setCurrentSessionId(remaining[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        
        let sessionId = currentSessionId;
        if (!sessionId) {
            try {
                const res = await api.post('/chat/start', { title: input.substring(0, 20) });
                setSessions([res.data, ...sessions]);
                setCurrentSessionId(res.data.id);
                sessionId = res.data.id;
            } catch (err) { console.error(err); return; }
        }

        const userMsg: ChatMessage = { role: 'USER', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (sessionId) {
                const res = await api.post(`/chat/${sessionId}/send`, { message: input });
                const aiMsg: ChatMessage = { role: 'ASSISTANT', content: res.data };
                setMessages(prev => [...prev, aiMsg]);
                fetchHistory(); // Update titles
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Compact render for sidebar
    return (
        <div className="flex flex-col h-full font-body text-ink">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-ink/20 pb-2">
                <h2 className="font-heading text-xl">Satchy</h2>
                <div className="flex gap-2 items-center">
                    <select 
                        className="bg-transparent text-sm max-w-[100px] truncate focus:outline-none cursor-pointer" 
                        value={currentSessionId || ''}
                        onChange={(e) => setCurrentSessionId(Number(e.target.value))}
                    >
                        <option value="" disabled>Select Chat</option>
                        {sessions.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                    
                    {currentSessionId && (
                        <button onClick={deleteCurrentSession} title="Delete Chat" className="hover:text-rpg-red transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    <button onClick={startNewChat} title="New Chat" className="hover:text-gold transition-colors">
                        <PenTool className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4" style={{ minHeight: '300px' }}>
                {messages.length === 0 && (
                    <div className="text-center opacity-50 mt-4 flex flex-col items-center">
                        <Bot className="w-8 h-8 mb-2" />
                        <p className="text-sm">Wanna cook something? Throw a party? Just ask me and Ill help you!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-2 rounded text-sm ${msg.role === 'USER' ? 'bg-leather text-parchment' : 'bg-black/5 text-ink'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="text-xs italic opacity-50 ml-2">Satchy is typing...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-auto">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-parchment-dark border border-leather/30 rounded px-2 py-1 text-sm focus:outline-none focus:border-leather placeholder-leather/40"
                    />
                    <button 
                        onClick={sendMessage} 
                        disabled={loading || !input.trim()}
                        className="p-2 bg-leather text-gold rounded hover:bg-leather-light disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
