import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Send, Bot, PenTool, Trash2, Paperclip, X } from 'lucide-react';
import SatchyAvatar from '../assets/Satchy.png';

interface ChatSession {
    id: number;
    title: string;
    createdAt: string;
}

interface ChatMessage {
    role: 'USER' | 'ASSISTANT';
    content: string;
    image?: string | null;
}

const ChatWidget = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [executedIndices, setExecutedIndices] = useState<Set<number>>(new Set());
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Define fetchHistory with useCallback to be stable for dependencies
    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get('/chat/history');
            setSessions(res.data);
            // Only defaults if we have no session. 
            // Note: capturing currentSessionId in closure might be stale if not in deps,
            // but for "initial load" logic it's fine. 
            // To be purely correct we might pass a param or use functional updates, 
            // but let's keep it simple.
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        const init = async () => {
            await fetchHistory();
            // We can do auto-select logic here if needed, or rely on user.
            // Original logic tried to auto-select. Let's restore that separately if needed.
            // But actually fetchHistory just updates sessions. 
            // We need to set initial session if none.
            try {
                 const res = await api.get('/chat/history');
                 if (res.data.length > 0) {
                     setCurrentSessionId(prev => prev || res.data[0].id);
                 }
            } catch {
                // Ignore initial fetch error
            }
        };
        init();
    }, [fetchHistory]);

    useEffect(() => {
        if (currentSessionId) {
            fetchMessages(currentSessionId);
        }
    }, [currentSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const fetchMessages = async (id: number) => {
        try {
            const res = await api.get(`/chat/${id}`);
            const sorted = res.data.messages.sort((a: ChatMessage & {timestamp: string}, b: ChatMessage & {timestamp: string}) => 
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
        if (!input.trim() && !selectedImage) return;
        
        let sessionId = currentSessionId;
        if (!sessionId) {
            try {
                const res = await api.post('/chat/start', { title: input.substring(0, 20) || 'New Upload' });
                setSessions([res.data, ...sessions]);
                setCurrentSessionId(res.data.id);
                sessionId = res.data.id;
            } catch (err) { console.error(err); return; }
        }

        const userMsg: ChatMessage = { 
            role: 'USER', 
            content: input + (selectedImage ? ' [Image Uploaded]' : ''),
            image: selectedImage
        };
        setMessages(prev => [...prev, userMsg]);
        const msgToSend = input;
        const imgToSend = selectedImage;

        setInput('');
        clearImage();
        setLoading(true);

        try {
            if (sessionId) {
                // Determine payload. Backend expects { message: string, image?: string, mimeType?: string }
                const payload: any = { message: msgToSend };
                if (imgToSend) {
                    const matches = imgToSend.match(/^data:(.+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        payload.mimeType = matches[1];
                        payload.image = matches[2]; // Raw base64
                    } else {
                        // Fallback if no prefix (unlikely with FileReader)
                        payload.image = imgToSend;
                    }
                }
                
                const res = await api.post(`/chat/${sessionId}/send`, payload);
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

    // Helper to parse message content and strip JSON if present
    const parseMessage = (content: string) => {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = content.match(jsonRegex);
        
        let displayContent = content;
        let actionData = null;

        if (match) {
            try {
                actionData = JSON.parse(match[1]);
                // Remove the JSON block from the display text
                displayContent = content.replace(jsonRegex, '').trim();
            } catch (e) {
                console.error("Failed to parse JSON in message", e);
            }
        }
        
        return { displayContent, actionData };
    };

    const handleAction = async (actionData: any, index: number) => {
        if (!actionData || !actionData.items) return;

        try {
            if (actionData.action === 'REDUCE_QUANTITY') {
                for (const item of actionData.items) {
                    await api.post(`/items/${item.id}/reduce`, { amount: item.quantity });
                }
            } else if (actionData.action === 'ADD_ITEMS') {
                // Use generic execute-action endpoint which calls AIService.executeProposal
                await api.post('/chat/execute-action', { proposal: JSON.stringify(actionData) });
            }
            
            // Mark as executed
            setExecutedIndices(prev => new Set(prev).add(index));

            // Refresh inventory via custom event
            window.dispatchEvent(new Event('inventory-updated'));
            
        } catch (err) {
            console.error("Failed to execute action", err);
            alert("Failed to execute action. Check console.");
        }
    };

    // Compact render for sidebar
    return (
        <div className="flex flex-col h-full font-body text-ink">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-ink/20 pb-2">
                <div className="flex items-center gap-2">
                    <img src={SatchyAvatar} alt="Satchy" className="w-13 h-13 rounded-full border border-gold object-cover" />
                    <h2 className="font-heading text-xl">Satchy</h2>
                </div>
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
                {messages.map((msg, idx) => {
                    const { displayContent, actionData } = parseMessage(msg.content);

                    return (
                        <div key={idx} className={`flex gap-2 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ASSISTANT' && (
                                <img src={SatchyAvatar} alt="Satchy" className="w-10 h-10 rounded-full border border-gold object-cover mt-1 flex-shrink-0" />
                            )}
                            <div className={`flex flex-col items-start max-w-[85%]`}>
                                {msg.image && (
                                    <img src={msg.image} alt="Uploaded" className="max-w-[200px] rounded mb-2 border border-gold/30 self-end" />
                                )}
                                <div className={`p-2 rounded text-sm whitespace-pre-wrap ${msg.role === 'USER' ? 'bg-leather text-parchment self-end' : 'bg-black/5 text-ink'}`}>
                                    {displayContent}
                                </div>
                                {actionData && (
                                    <div className="mt-2 text-xs bg-ink/5 p-2 rounded border border-ink/10 w-full">
                                        <p className="font-bold mb-1">
                                            {actionData.action === 'REDUCE_QUANTITY' ? 'Proposed Reduction:' : 'Proposed Addition:'}
                                        </p>
                                        <ul className="list-disc list-inside mb-2">
                                            {actionData.items.map((item: any, i: number) => (
                                                <li key={i}>
                                                    {item.name ? <span className="font-semibold">{item.name}</span> : <span>Item {item.id}</span>} 
                                                    <span className="opacity-70"> 
                                                        {actionData.action === 'REDUCE_QUANTITY' ? ` (-${item.quantity})` : ` (+${item.quantity})`}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button 
                                            onClick={() => handleAction(actionData, idx)}
                                            disabled={executedIndices.has(idx)}
                                            className={`w-full px-2 py-1 rounded transition-colors ${
                                                executedIndices.has(idx) 
                                                    ? 'bg-ink/20 text-ink/50 cursor-not-allowed' 
                                                    : 'bg-leather text-gold hover:bg-leather-light'
                                            }`}
                                        >
                                            {executedIndices.has(idx) ? 'Action Confirmed' : (actionData.action === 'REDUCE_QUANTITY' ? 'Confirm Reduce' : 'Confirm Add')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="text-xs italic opacity-50 ml-2">Satchy is typing...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-auto">
                {selectedImage && (
                    <div className="mx-2 mb-2 p-2 bg-ink/5 rounded flex justify-between items-center">
                        <span className="text-xs truncate max-w-[150px]">Image selected</span>
                        <button onClick={clearImage} className="text-rpg-red hover:bg-rpg-red/10 rounded p-1">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex gap-2 relative">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="p-2 text-leather hover:bg-leather/10 rounded transition-colors"
                         title="Upload Image"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
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
                        disabled={loading || (!input.trim() && !selectedImage)}
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
