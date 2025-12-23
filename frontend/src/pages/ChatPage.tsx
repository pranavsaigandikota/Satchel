import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Send, Scroll, Trash2, ArrowLeft, PenTool, Bot } from 'lucide-react';

interface ChatSession {
    id: number;
    title: string;
    createdAt: string;
}

interface ChatMessage {
    role: 'USER' | 'ASSISTANT';
    content: string;
}

const ChatPage = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
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
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (id: number) => {
        try {
            const res = await api.get(`/chat/${id}`);
            // Backend returns Session object with nested messages
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
            setSessions([res.data, ...sessions]); // Prepend new session
            setCurrentSessionId(res.data.id);
            setMessages([]);
        } catch (err) {
            console.error(err);
        }
    };
    
    const deleteSession = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/chat/${id}`);
            setSessions(sessions.filter(s => s.id !== id));
            if (currentSessionId === id) {
                setCurrentSessionId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const sendMessage = async () => {
        if (!input.trim()) return;
        if (!currentSessionId) {
           const res = await api.post('/chat/start', { title: input.substring(0,20) });
           setSessions([res.data, ...sessions]);
           setCurrentSessionId(res.data.id);
           await sendToSession(res.data.id, input);
        } else {
           await sendToSession(currentSessionId, input);
        }
    };

    const sendToSession = async (sessionId: number, text: string) => {
        const userMsg: ChatMessage = { role: 'USER', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post(`/chat/${sessionId}/send`, { message: text });
            // API returns just string response currently
            const aiMsg: ChatMessage = { role: 'ASSISTANT', content: res.data };
            setMessages(prev => [...prev, aiMsg]);
            
            // Refresh history to update titles
            fetchHistory();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (proposalJson: string) => {
        try {
            await api.post('/chat/execute-action', { proposal: proposalJson });
            alert("The inventory has been updated according to your command."); 
        } catch (err) {
            alert("The spell fizzled (Action failed).");
            console.error(err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper to render message content with Action Cards
    const renderContent = (msg: ChatMessage) => {
        const content = (
            <div className={`whitespace-pre-wrap font-body text-lg ${msg.role === 'ASSISTANT' ? 'text-ink' : 'text-parchment'}`}>
                {msg.role === 'USER' ? msg.content : msg.content.replace(/```json[\s\S]*?```/, '')} 
                {/* Remove raw JSON from display if parsed below */}
            </div>
        );

        if (msg.role === 'USER') return content;

        // Check for JSON Proposal code block
        const regex = /```json\s*(\{[\s\S]*?"action":\s*"REDUCE_QUANTITY"[\s\S]*?\})\s*```/;
        const match = msg.content.match(regex);

        if (match) {
            const jsonPart = match[1];
            let proposal = null;
            try { proposal = JSON.parse(jsonPart); } catch(e) {}

            return (
                <div>
                     {content}
                     {proposal && (
                         <div className="mt-4 p-4 bg-parchment border-2 border-dashed border-leather-light rounded shadow-sm rotate-1">
                             <div className="font-heading text-rpg-red font-bold mb-2 flex items-center gap-2">
                                <Scroll className="w-5 h-5" />
                                Proposed Decree
                             </div>
                             <div className="text-sm font-body mb-3 text-ink">
                                Consume the following items:
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {proposal.items.map((it:any, idx:number) => (
                                        <li key={idx}>Item #{it.id} (Qty: {it.quantity})</li>
                                    ))}
                                </ul>
                             </div>
                             <button 
                                onClick={() => handleAction(jsonPart)}
                                className="w-full bg-leather text-gold font-heading py-2 rounded shadow border border-gold hover:bg-leather-light transition-colors"
                             >
                                Confirm & Update
                             </button>
                         </div>
                     )}
                </div>
            );
        }

        return content;
    };

    return (
        <div className="h-full flex flex-col font-body">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-ink/10">
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => window.history.back()}
                        className="text-leather hover:text-leather-dark transition-colors"
                        title="Go Back"
                     >
                        <ArrowLeft className="w-6 h-6" />
                     </button>
                     <h2 className="font-heading text-2xl text-leather-dark">
                        {sessions.find(s => s.id === currentSessionId)?.title || 'Rumors & Recipes'}
                     </h2>
                </div>
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="md:hidden text-leather"
                >
                    {sidebarOpen ? 'Close Archives' : 'Archives'}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden gap-6">
                
                {/* Sidebar (History) */}
                <div className={`${sidebarOpen ? 'w-full md:w-1/3' : 'w-0'} transition-all duration-300 md:flex flex-col border-r-2 border-ink/10 pr-2 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
                     <div className="flex justify-between items-center mb-4">
                         <span className="font-heading text-lg text-ink/70 uppercase tracking-widest">Chronicles</span>
                         <button onClick={startNewChat} className="text-leather hover:text-gold transition-colors" title="New Chat">
                            <PenTool className="w-5 h-5" />
                         </button>
                     </div>
                     <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                         {sessions.map(s => (
                             <div 
                                key={s.id} 
                                onClick={() => { setCurrentSessionId(s.id); if(window.innerWidth < 768) setSidebarOpen(false); }}
                                className={`p-3 rounded border cursor-pointer transition-all group relative ${currentSessionId === s.id ? 'bg-leather text-parchment border-leather shadow-md' : 'bg-parchment-dark border-transparent hover:border-leather/30'}`}
                             >
                                 <p className="font-body text-lg truncate pr-6">{s.title}</p>
                                 <div className="text-xs opacity-60 flex justify-between mt-1">
                                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <button 
                                    onClick={(e) => deleteSession(s.id, e)}
                                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-rpg-red hover:scale-110 transition-all"
                                    title="Burn Scroll"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${sidebarOpen ? 'hidden md:flex' : 'flex'}`}>
                     
                     {/* Messages */}
                     <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar pb-4">
                         {messages.length === 0 && (
                            <div className="text-center opacity-50 mt-10">
                                <Bot className="w-12 h-12 mx-auto mb-4 text-leather" />
                                <p className="text-xl">The oracle is listening...</p>
                            </div>
                         )}
                         {messages.map((msg, idx) => (
                             <div key={idx} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] relative p-4 rounded-lg shadow-sm ${msg.role === 'USER' ? 'bg-leather text-parchment rounded-br-none' : 'bg-parchment-dark border border-ink/10 text-ink rounded-bl-none'}`}>
                                     {renderContent(msg)}
                                 </div>
                             </div>
                         ))}
                         {loading && (
                             <div className="flex justify-start">
                                 <div className="bg-parchment-dark p-4 rounded-lg rounded-bl-none italic text-ink/50 animate-pulse">
                                     Scribing response...
                                 </div>
                             </div>
                         )}
                         <div ref={messagesEndRef} />
                     </div>

                     {/* Input */}
                     <div className="mt-4 pt-4 border-t-2 border-ink/10 flex gap-2">
                         <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Consult the oracle..."
                            className="flex-1 bg-parchment border-2 border-leather-light/30 rounded px-4 py-2 focus:outline-none focus:border-leather text-ink placeholder-leather/40"
                         />
                         <button 
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-leather text-gold p-3 rounded shadow hover:bg-leather-light disabled:opacity-50 transition-colors"
                         >
                            <Send className="w-5 h-5" />
                         </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
