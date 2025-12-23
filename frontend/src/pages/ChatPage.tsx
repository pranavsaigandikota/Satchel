import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

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
            const res = await api.post('/chat/start', { title: 'New Chat' });
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
           // Create session first if none selected? Or force "New Chat" click?
           // Let's force start new chat if logic is simple, or just alert.
           // Better: create one on fly.
           const res = await api.post('/chat/start', { title: input.substring(0,20) });
           setSessions([res.data, ...sessions]);
           setCurrentSessionId(res.data.id);
           // Then send message
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
            alert("Action executed! Inventory updated."); 
            // Ideally we also insert a system message or update UI to show "Accepted"
        } catch (err) {
            alert("Failed to execute action.");
            console.error(err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper to render message content with Action Cards
    const renderContent = (msg: ChatMessage) => {
        if (msg.role === 'USER') return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>;

        // Check for JSON Proposal code block
        const regex = /```json\s*(\{[\s\S]*?"action":\s*"REDUCE_QUANTITY"[\s\S]*?\})\s*```/;
        const match = msg.content.match(regex);

        if (match) {
            const textPart = msg.content.replace(match[0], '').trim();
            const jsonPart = match[1];
            
            let proposal = null;
            try {
                 proposal = JSON.parse(jsonPart);
            } catch(e) {}

            return (
                <div>
                     <div style={{ whiteSpace: 'pre-wrap' }}>{textPart}</div>
                     {proposal && (
                         <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid #7c3aed' }}>
                             <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#a78bfa' }}>Action Proposed</div>
                             <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                                 Reduce quantity for items:
                                 <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                    {proposal.items.map((it:any, idx:number) => (
                                        <li key={idx}>Item ID: {it.id} (Qty: {it.quantity})</li>
                                    ))}
                                 </ul>
                             </div>
                             <button 
                                onClick={() => handleAction(jsonPart)}
                                style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                             >
                                Confirm & Update Inventory
                             </button>
                         </div>
                     )}
                </div>
            );
        }

        return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>;
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 2rem 2rem 2rem', gap: '2rem' }}>
                
                {/* Sidebar */}
                <div style={{ 
                    width: sidebarOpen ? '300px' : '0px', 
                    transition: 'width 0.3s', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                     <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontWeight: 'bold' }}>History</span>
                         <button onClick={startNewChat} style={{ background: 'transparent', border: 'none', color: '#a78bfa', fontSize: '1.5rem', cursor: 'pointer' }}>+</button>
                     </div>
                     <div style={{ flex: 1, overflowY: 'auto' }}>
                         {sessions.map(s => (
                             <div 
                                key={s.id} 
                                onClick={() => setCurrentSessionId(s.id)}
                                style={{ 
                                    padding: '1rem', 
                                    cursor: 'pointer', 
                                    background: currentSessionId === s.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                             >
                                 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{s.title}</span>
                                 <button 
                                    onClick={(e) => deleteSession(s.id, e)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                                    title="Delete Chat"
                                 >
                                    🗑️
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                     <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                         <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: 'white', marginRight: '1rem', cursor: 'pointer' }}>
                            {sidebarOpen ? '◀' : '▶'}
                         </button>
                         <span style={{ fontWeight: 'bold' }}>{sessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}</span>
                     </div>
                     
                     <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         {messages.map((msg, idx) => (
                             <div key={idx} style={{ alignSelf: msg.role === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                 <div style={{ 
                                     background: msg.role === 'USER' ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                                     padding: '1rem', 
                                     borderRadius: '12px',
                                     borderBottomRightRadius: msg.role === 'USER' ? '2px' : '12px',
                                     borderBottomLeftRadius: msg.role === 'ASSISTANT' ? '2px' : '12px'
                                 }}>
                                     {renderContent(msg)}
                                 </div>
                             </div>
                         ))}
                         {loading && (
                             <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
                                 Typing...
                             </div>
                         )}
                         <div ref={messagesEndRef} />
                     </div>

                     <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                         <div style={{ display: 'flex', gap: '1rem' }}>
                             <input 
                                type="text" 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Ask about recipes, inventory..."
                                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                             />
                             <button 
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                             >
                                Send
                             </button>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
