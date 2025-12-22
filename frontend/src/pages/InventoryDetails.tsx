import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

interface Category {
    id: number;
    name: string;
}

interface Item {
    id: number;
    name: string;
    category: Category;
    quantity: number;
    expiryDate: string;
    type?: string;
}

const InventoryDetails = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [editMode, setEditMode] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [groupName, setGroupName] = useState('');

    // Add Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);
    const [newItemType, setNewItemType] = useState('Food');
    const [newItemExpiry, setNewItemExpiry] = useState('');
    const [newItemCondition, setNewItemCondition] = useState('NEW');

    const fetchGroupDetails = async () => {
        try {
            const response = await api.get(`/groups/${groupId}`);
            setGroupName(response.data.groupName);
        } catch (error) {
            console.error('Failed to fetch group details', error);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await api.get(`/items/group/${groupId}`);
            setItems(response.data);
        } catch (error) {
            console.error('Failed to fetch items', error);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchGroupDetails();
            fetchItems();
        }
    }, [groupId]);

    const handleDeleteItem = async (itemId: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/items/${itemId}`);
            fetchItems();
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    // Edit Item State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const openEditModal = (item: Item) => {
        setEditingItem(item);
        setNewItemName(item.name);
        setNewItemCategory(item.category.name);
        setNewItemQuantity(item.quantity);
        setNewItemType('Food'); // Default, or infer from item if available
        setShowEditModal(true);
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingItem) return;
            await api.put(`/items/${editingItem.id}`, {
                name: newItemName,
                category: newItemCategory,
                quantity: newItemQuantity,
                type: newItemType,
                expiryDate: newItemExpiry || null,
                condition: newItemCondition || null
            });
            setShowEditModal(false);
            setEditingItem(null);
            fetchItems();
        } catch (error) {
            console.error('Failed to update item', error);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemCategory) return;

        try {
            await api.post(`/items/group/${groupId}`, {
                name: newItemName,
                category: newItemCategory, // Backend handles creating this if new (hybrid)
                quantity: newItemQuantity,
                type: newItemType,
                expiryDate: newItemExpiry || null,
                condition: newItemCondition || null
            });
            setShowAddModal(false);
            setNewItemName('');
            setNewItemCategory('');
            setNewItemQuantity(1);
            setNewItemType('Food');
            setNewItemExpiry('');
            setNewItemCondition('NEW');
            fetchItems(); // Refresh list
        } catch (error) {
            console.error('Failed to add item', error);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.category.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category.name === categoryFilter;
        // const matchesType = typeFilter === 'All' || item.type === typeFilter; 
        // Note: Backend might need to return 'type' explicitly. If missing, this might filter out everything except 'All'.
        // Checking if type matches or if filter is All. 
        const matchesType = typeFilter === 'All' || (item.type && item.type === typeFilter);

        return matchesSearch && matchesCategory && matchesType;
    });

    // Extract unique categories for filter
    const uniqueCategories = Array.from(new Set(items.map(i => i.category.name)));

    return (
        <div>
            <Navbar />
            <div className="page-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                        ← Back
                    </button>
                    <h1 style={{ margin: 0 }}>{groupName || `Group ${groupId}`} Inventory</h1>
                    <div style={{ flex: 1 }}></div>
                    <button
                        className="btn-primary"
                        style={{ background: editMode ? '#ef4444' : '' }}
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? 'Done Editing' : 'Edit Inventory'}
                    </button>
                </div>

                <div className="glass" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="input-field"
                        style={{ flex: 2, minWidth: '200px' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="input-field"
                        style={{ flex: 1, minWidth: '150px' }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        className="input-field"
                        style={{ flex: 1, minWidth: '150px' }}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Food">Food</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Medical">Medical</option>
                        <option value="Pantry">Pantry</option>
                        <option value="Supply">Supply</option>
                    </select>
                </div>

                {/* Items Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {editMode && (
                        <div className="glass" style={{
                            padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            border: '2px dashed var(--primary)', cursor: 'pointer', opacity: 0.8, minHeight: '150px'
                        }} onClick={() => setShowAddModal(true)}>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', color: 'var(--primary)', display: 'block' }}>+</span>
                                <span style={{ color: 'var(--primary)' }}>Add Item</span>
                            </div>
                        </div>
                    )}

                    {filteredItems.map(item => (
                        <div key={item.id} className="glass" style={{ padding: '1.5rem', position: 'relative' }}>
                            {editMode && (
                                <button style={{
                                    position: 'absolute', top: '-10px', right: '-10px',
                                    background: '#ef4444', border: '2px solid #0f172a', borderRadius: '50%',
                                    width: '28px', height: '28px', color: 'white', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }} onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                }}>×</button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
                                </div>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    {item.category.name}
                                </span>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                <p>Quantity: {item.quantity}</p>
                                {item.expiryDate && <p>Expires: {item.expiryDate}</p>}
                            </div>
                            {editMode && (
                                <button onClick={() => openEditModal(item)} style={{
                                    marginTop: '1rem', width: '100%', padding: '0.5rem',
                                    background: '#3b82f6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer'
                                }}>Edit</button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Item Modal */}
                {showAddModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="glass" style={{ padding: '2rem', width: '400px', background: '#1e293b', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Add New Item</h2>
                            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#94a3b8' }}>Item Type</label>
                                    <select
                                        className="input-field"
                                        value={newItemType}
                                        onChange={(e) => setNewItemType(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Food">Food</option>
                                        <option value="Medical">Medical</option>
                                        <option value="Pantry">Pantry</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Supply">Supply</option>
                                    </select>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Item Name"
                                    className="input-field"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    placeholder="Category (e.g., Dairy, Tylenol...)"
                                    className="input-field"
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value)}
                                    list="category-suggestions"
                                />
                                <datalist id="category-suggestions">
                                    <option value="Dairy" />
                                    <option value="Painkillers" />
                                    <option value="Cables" />
                                    <option value="Cleaning" />
                                </datalist>
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    className="input-field"
                                    value={newItemQuantity}
                                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                                    min="1"
                                />

                                {/* Conditional Fields */}
                                {(newItemType === 'Food' || newItemType === 'Medical' || newItemType === 'Pantry') && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#94a3b8' }}>Expiry Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={newItemExpiry}
                                            onChange={(e) => setNewItemExpiry(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                )}

                                {(newItemType === 'Electronics' || newItemType === 'Supply') && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#94a3b8' }}>Condition</label>
                                        <select
                                            className="input-field"
                                            value={newItemCondition}
                                            onChange={(e) => setNewItemCondition(e.target.value)}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="NEW">New</option>
                                            <option value="GOOD">Good</option>
                                            <option value="FAIR">Fair</option>
                                            <option value="POOR">Poor</option>
                                            <option value="BROKEN">Broken</option>
                                        </select>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} style={{
                                        flex: 1, background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8',
                                        padding: '10px', borderRadius: '8px', cursor: 'pointer'
                                    }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Item Modal */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass" style={{ padding: '2rem', width: '400px', background: '#1e293b', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Edit Item</h2>
                        <form onSubmit={handleUpdateItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#94a3b8' }}>Item Type</label>
                                <select
                                    className="input-field"
                                    value={newItemType}
                                    onChange={(e) => setNewItemType(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="Food">Food</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Pantry">Pantry</option>
                                    <option value="Supply">Supply</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Item Name"
                                className="input-field"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Category"
                                className="input-field"
                                value={newItemCategory}
                                onChange={(e) => setNewItemCategory(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                className="input-field"
                                value={newItemQuantity}
                                onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                                min="1"
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={{
                                    flex: 1, background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8',
                                    padding: '10px', borderRadius: '8px', cursor: 'pointer'
                                }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryDetails;
