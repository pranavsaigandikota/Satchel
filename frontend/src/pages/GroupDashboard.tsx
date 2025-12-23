import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Scroll, Users, Search, PlusCircle, UserPlus, Trash2 } from 'lucide-react';

interface AppUser {
    id: number;
    username: string;
}

interface Group {
    id: number;
    groupName: string;
    joinCode: string;
    members?: AppUser[]; // Add members to interface
}

const GroupDashboard = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [joinCode, setJoinCode] = useState('');

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async () => {
        const name = prompt('Name your new group:');
        if (name) {
            try {
                await api.post('/groups', { groupName: name });
                fetchGroups();
            } catch (error) {
                console.error('Failed to create group', error);
            }
        }
    };

    const handleJoinGroup = async () => {
        if (joinCode) {
            try {
                await api.post('/groups/join', { joinCode: joinCode });
                setJoinCode('');
                fetchGroups();
                alert('Successfully joined the group!');
            } catch (error) {
                console.error('Failed to join group', error);
                alert('The join code was incorrect.');
            }
        }
    };

    return (
        <div className="font-body text-ink">
            <header className="flex justify-between items-end mb-6 border-b-2 border-ink/10 pb-4">
                <div>
                    <h1 className="font-heading text-4xl text-leather-dark rpg-text-shadow">Dashboard</h1>
                    <p className="text-lg italic opacity-70">Select an inventory group to manage.</p>
                </div>
                <button 
                    className="bg-leather text-parchment font-heading px-4 py-2 rounded shadow border border-gold hover:bg-leather-light flex items-center gap-2 transition-transform active:scale-95"
                    onClick={handleCreateGroup}
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
                                    if (confirm('Delete this group? This cannot be undone.')) {
                                        api.delete(`/groups/${group.id}`).then(() => fetchGroups());
                                    }
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
        </div>
    );
};
export default GroupDashboard;
