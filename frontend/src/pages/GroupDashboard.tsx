import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Scroll, Users, Search, PlusCircle, UserPlus, Trash2 } from 'lucide-react';
import { ToastContainer, type ToastMessage } from '../components/Toast';
import { Modal } from '../components/Modal';

interface AppUser {
    id: number;
    username: string;
}

interface Group {
    id: number;
    groupName: string;
    joinCode: string;
    members?: AppUser[]; 
}

const GroupDashboard = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
            addToast('Failed to fetch groups', 'error');
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
             addToast('Please enter a group name', 'error');
             return;
        }
        
        try {
            await api.post('/groups', { groupName: newGroupName });
            fetchGroups();
            addToast('Group created successfully!', 'success');
            setNewGroupName('');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create group', error);
            addToast('Failed to create group', 'error');
        }
    };

    const handleJoinGroup = async () => {
        if (joinCode) {
            try {
                await api.post('/groups/join', { joinCode: joinCode });
                setJoinCode('');
                fetchGroups();
                addToast('Successfully joined the group!', 'success');
            } catch (error) {
                console.error('Failed to join group', error);
                addToast('The join code was incorrect.', 'error');
            }
        }
    };

    return (
        <div className="font-body text-ink">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <header className="flex justify-between items-end mb-6 border-b-2 border-ink/10 pb-4">
                <div>
                    <h1 className="font-heading text-4xl text-leather-dark rpg-text-shadow">Dashboard</h1>
                    <p className="text-lg italic opacity-70">Select an inventory group to manage.</p>
                </div>
                <button 
                    className="bg-leather text-parchment font-heading px-4 py-2 rounded shadow border border-gold hover:bg-leather-light flex items-center gap-2 transition-transform active:scale-95"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <PlusCircle className="w-5 h-5 text-gold" />
                    New Group
                </button>
            </header>

            {/* Global Search */}
            <div className="mb-8 relative">
                <Search className="absolute left-3 top-3 text-leather-dark/50 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search groups, items, or members..."
                    className="w-full bg-parchment-dark border-2 border-leather-light/30 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-leather text-ink placeholder-leather-dark/40 shadow-inner"
                    onChange={async (e) => {
                         const q = e.target.value;
                         if (q.length === 0) {
                             fetchGroups(); 
                         } else {
                             try {
                                 const res = await api.get(`/items/search?q=${q}`);
                                 const foundItems = res.data;
                                 const allGroupsRes = await api.get('/groups');
                                 const allGroups = allGroupsRes.data;
                                 const matchingGroupIds = new Set(foundItems.map((item: any) => item.inventoryGroup?.id));
                                 const filtered = allGroups.filter((g: Group) => 
                                     g.groupName.toLowerCase().includes(q.toLowerCase()) || 
                                     matchingGroupIds.has(g.id)
                                 );
                                 setGroups(filtered);
                             } catch(err) { console.error(err); }
                         }
                    }}
                />
            </div>

            {/* Join Section */}
            <div className="mb-8 bg-leather/5 p-4 rounded border border-dashed border-leather/30 flex items-center gap-4">
                <div className="flex-1">
                    <h3 className="font-heading text-lg text-leather-dark flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Join Existing Group
                    </h3>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter Join Code"
                        className="bg-parchment border border-leather/30 px-3 py-1 rounded focus:outline-none text-ink w-40"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <button className="bg-leather-dark text-gold px-4 py-1 rounded font-heading text-sm hover:brightness-110" onClick={handleJoinGroup}>Join</button>
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => (
                    <div 
                        key={group.id} 
                        onClick={() => navigate(`/group/${group.id}`)}
                        className="group relative bg-parchment border-2 border-leather/20 p-4 rounded shadow-sm hover:shadow-lg hover:border-gold transition-all cursor-pointer overflow-hidden"
                    >
                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 w-8 h-8 bg-leather/10 rounded-bl-full group-hover:bg-gold/20 transition-colors"></div>

                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-heading text-xl text-leather-dark group-hover:text-leather transition-colors">{group.groupName}</h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGroupToDelete(group);
                                }}
                                className="text-rpg-red opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                title="Disband Group"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Members Display */}
                        <div className="flex items-center gap-2 mb-3 text-sm text-ink/70">
                            <Users className="w-4 h-4" />
                            <span>
                                {group.members && group.members.length > 0 
                                    ? group.members.map(m => m.username).join(', ') 
                                    : 'No members'}
                            </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-leather font-mono bg-leather/5 px-2 py-1 rounded inline-block border border-leather/10">
                            <Scroll className="w-3 h-3" />
                            Code: <span className="font-bold select-all">{group.joinCode}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                title="Create New Group"
            >
                <div>
                     <input 
                        type="text" 
                        placeholder="Enter group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-parchment border border-leather/30 rounded px-3 py-2 mb-4 focus:outline-none focus:border-leather"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                     />
                     <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-ink/70 hover:bg-ink/5 rounded"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={handleCreateGroup}
                            className="px-4 py-2 bg-leather text-gold rounded hover:bg-leather-light"
                         >
                            Create
                         </button>
                     </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!groupToDelete}
                onClose={() => setGroupToDelete(null)}
                title="Disband Group"
            >
                <div>
                    <p className="mb-6 text-ink">
                        Are you sure you want to delete <span className="font-bold text-leather-dark">{groupToDelete?.groupName}</span>? 
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => setGroupToDelete(null)}
                            className="px-4 py-2 text-ink/70 hover:bg-ink/5 rounded"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={() => {
                                if (groupToDelete) {
                                    api.delete(`/groups/${groupToDelete.id}`).then(() => {
                                        fetchGroups();
                                        addToast('Group disbanded successfully', 'success');
                                        setGroupToDelete(null);
                                    }).catch(() => {
                                        addToast('Failed to disband group', 'error');
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-rpg-red text-white rounded hover:brightness-110 shadow-sm"
                         >
                            Disband
                         </button>
                     </div>
                </div>
            </Modal>
        </div>
    );
};
export default GroupDashboard;
