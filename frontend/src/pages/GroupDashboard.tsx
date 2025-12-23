import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

interface Group {
    id: number;
    groupName: string;
    joinCode: string;
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
        const name = prompt('Enter group name:');
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
                alert('Successfully joined group!');
            } catch (error) {
                console.error('Failed to join group', error);
                alert('Failed to join group. Check the code and try again.');
            }
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page-container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Your Inventory Groups</h1>
                    <button className="btn-primary" onClick={handleCreateGroup}>+ Create Group</button>
                </header>

                {/* Global Search */}
                <div className="glass" style={{ padding: '1rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Global Search (across all groups)..."
                        className="input-field"
                        style={{ width: '100%' }}
                        onChange={async (e) => {
                            const q = e.target.value;
                            if (q.length === 0) {
                                fetchGroups(); // Reset to all groups
                            } else {
                                try {
                                    // Search for items matching query
                                    const res = await api.get(`/items/search?q=${q}`);
                                    const foundItems = res.data;
                                    
                                    // Filter existing groups? Or fetch all groups then filter?
                                    // We'll filter the currently loaded groups list based on whether they contain found items.
                                    // But wait, the previous state might be filtered.
                                    // We need to fetch all groups first if we want accurate filtering, or cache 'allGroups'.
                                    // For simplicity: refetch all groups then filter.
                                    
                                    const allGroupsRes = await api.get('/groups');
                                    const allGroups = allGroupsRes.data;
                                    
                                    // Identify group IDs that have matching items
                                    const matchingGroupIds = new Set(foundItems.map((item: any) => item.inventoryGroup?.id));
                                    
                                    // Filter groups: either name matches OR it contains matching items
                                    const filtered = allGroups.filter((g: Group) => 
                                        g.groupName.toLowerCase().includes(q.toLowerCase()) || 
                                        matchingGroupIds.has(g.id)
                                    );
                                    
                                    setGroups(filtered);
                                } catch(err) {
                                    console.error(err);
                                }
                            }
                        }}
                    />
                </div>

                <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Join a Group</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Enter Join Code"
                            className="input-field"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                        />
                        <button className="btn-primary" onClick={handleJoinGroup}>Join</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {groups.map((group) => (
                        <div key={group.id} className="glass" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                            onClick={() => navigate(`/group/${group.id}`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{group.groupName}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent navigation
                                        if (confirm('Are you sure you want to delete this group?')) {
                                            api.delete(`/groups/${group.id}`)
                                                .then(() => fetchGroups())
                                                .catch(err => console.error(err));
                                        }
                                    }}
                                    style={{
                                        background: 'transparent', border: 'none', color: '#ef4444',
                                        cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px'
                                    }}
                                    title="Delete Group"
                                >
                                    🗑
                                </button>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '4px', display: 'inline-block' }}>
                                Code: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{group.joinCode}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GroupDashboard;
