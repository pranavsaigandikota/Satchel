import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Send, Bot, PenTool, Trash2, Paperclip, X } from 'lucide-react';
import SatchyAvatar from '../assets/Satchy.png';
import { ToastContainer, type ToastMessage } from './Toast';
import { Modal } from './Modal';

interface ChatSession {
    id: number;
    title: string;
    createdAt: string;
}

interface ChatMessage {
    role: 'USER' | 'ASSISTANT';
    content: string;
    image?: string | null;
    id?: number; // Add id for messages from the backend
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
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

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

    const handleDeleteClick = () => {
        if (!currentSessionId) return;
        setShowClearModal(true);
    };

    const deleteCurrentSession = async () => {
        if (!currentSessionId) return;
        // if (!confirm('Are you sure you want to burn this scroll?')) return; // Replaced by Modal
        
        try {
            await api.delete(`/chat/${currentSessionId}`);
            setSessions(prev => prev.filter(s => s.id !== currentSessionId));
            setCurrentSessionId(null);
            setMessages([]);
            setShowClearModal(false);
            addToast('Satchy was cleared successfully!', 'info');
        } catch (err) {
            console.error(err);
            addToast('Satchy failed to clear it :(', 'error');
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

    // parseMessage removed as it is unused


    const handleAction = async (proposal: any, index: number, msgId?: number) => {
        if (executedIndices.has(index)) return;

        try {
            await api.post('/chat/execute-action', { 
                proposal: JSON.stringify(proposal),
                messageId: msgId 
            });
            
            // Dispatch event to refresh inventory
            window.dispatchEvent(new Event('inventory-updated'));
            
            setExecutedIndices(prev => new Set(prev).add(index));
            addToast("Action executed successfully!", 'success');
        } catch (error) {
            console.error(error);
            addToast("Failed to execute action. Check console.", 'error');
        }
    };

    // Compact render for sidebar
    return (
        <div className="flex flex-col h-full font-body text-ink">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
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
                        <button onClick={handleDeleteClick} className="text-rpg-red hover:text-red-400 transition-colors p-1" title="Delete Chat">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    )}

                    <button onClick={startNewChat} title="New Chat" className="hover:text-gold transition-colors">
                        <PenTool className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center opacity-50 mt-4 flex flex-col items-center">
                        <Bot className="w-8 h-8 mb-2" />
                        <p className="text-sm">Wanna cook something? Throw a party? Just ask me and Ill help you!</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    // Extract action if present
                    let actionData = null;
                    const isAssistant = msg.role === 'ASSISTANT';
                    let displayContent = msg.content;
                    
                    // Check for JSON block
                    if (isAssistant && msg.content.includes('```json')) {
                        const start = msg.content.indexOf('```json');
                        const end = msg.content.lastIndexOf('```');
                        if (start !== -1 && end !== -1) {
                            try {
                                const jsonStr = msg.content.substring(start + 7, end);
                                actionData = JSON.parse(jsonStr);
                                // Hide the JSON block from display if desired, or keep it. 
                                // User asked for card, so usually we hide the block or keep it small.
                                // For now let's just keep full text but render card below.
                            } catch (e) {
                                // console.warn("Failed to parse JSON");
                            }
                        }
                    }

                    // Check if already executed in DB (persisted state)
                    // We look for "executed": true in the raw content or rely on local state as backup
                    const isPersistedExecuted = msg.content.includes('"executed": true');

                    return (
                        <div key={idx} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ASSISTANT' && (
                                <img src={SatchyAvatar} alt="Satchy" className="w-10 h-10 rounded-full border border-gold object-cover mt-1 flex-shrink-0" />
                            )}
                            
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'USER' 
                                    ? 'bg-leather text-parchment' 
                                    : 'bg-parchment border border-leather/20 text-ink shadow-sm'
                            }`}>
                                {/* ... Message Content ... */}
                                <div className="whitespace-pre-wrap font-body text-sm">
                                    {displayContent.split('```json')[0]} {/* Show text before JSON */}
                                </div>

                                {msg.image && (
                                     <div className="mt-2">
                                         <img src={`data:image/jpeg;base64,${msg.image}`} alt="Uploaded" className="max-w-full h-auto rounded border border-white/20" />
                                     </div>
                                )}

                                {actionData && (
                                    <div className="mt-3 bg-parchment-dark p-3 rounded border border-leather/20 text-sm">
                                        <p className="font-bold text-leather-dark mb-1">Proposed Action:</p>
                                        <ul className="list-disc pl-4 mb-2 space-y-1">
                                            {actionData.items?.map((item: any, i: number) => (
                                                <li key={i}>
                                                    {actionData.action === 'REDUCE_QUANTITY' ? (
                                                        <span>Reduce <b>{item.name}</b> by {item.quantity}</span>
                                                    ) : (
                                                        <span>Add <b>{item.name}</b> (+{item.quantity})</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                        <button 
                                            className={`w-full py-1.5 rounded font-heading text-xs transition-colors ${
                                                executedIndices.has(idx) || isPersistedExecuted
                                                    ? 'bg-ink/10 text-ink/50 cursor-not-allowed'
                                                    : 'bg-leather text-gold hover:bg-leather-light'
                                            }`}
                                            onClick={() => handleAction(actionData, idx, (msg as any).id)} // Pass msg.id if available
                                            disabled={executedIndices.has(idx) || isPersistedExecuted}
                                        >
                                            {executedIndices.has(idx) || isPersistedExecuted ? 'Action Confirmed' : (actionData.action === 'REDUCE_QUANTITY' ? 'Confirm Reduce' : 'Confirm Add')}
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
            <Modal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Erase Satchy's Memory?"
            >
                 <div>
                    <p className="mb-6 text-ink">
                        Are you sure you want to erase Satchy's memory? This history will be lost forever in the ashes.
                    </p>
                    <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => setShowClearModal(false)}
                            className="px-4 py-2 text-ink/70 hover:bg-ink/5 rounded"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={deleteCurrentSession}
                            className="px-4 py-2 bg-rpg-red text-white rounded hover:brightness-110 shadow-sm"
                         >
                            Wipe his Brain
                         </button>
                     </div>
                </div>
            </Modal>
        </div>
    );
};

export default ChatWidget;
