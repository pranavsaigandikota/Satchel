import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Trash2, Edit2, Plus, X, Heart, Shield } from 'lucide-react';

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
    condition?: string;
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

    // Edit Item State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const fetchGroupDetails = useCallback(async () => {
        try {
            const response = await api.get(`/groups/${groupId}`);
            setGroupName(response.data.groupName);
        } catch (error) {
            console.error('Failed to fetch group details', error);
        }
    }, [groupId]);

    const fetchItems = useCallback(async () => {
        try {
            const response = await api.get(`/items/group/${groupId}`);
            setItems(response.data);
        } catch (error) {
            console.error('Failed to fetch items', error);
        }
    }, [groupId]);

    useEffect(() => {
        if (groupId) {
            fetchGroupDetails();
            fetchItems();
        }
    }, [groupId, fetchGroupDetails, fetchItems]);

    const handleDeleteItem = async (itemId: number) => {
        if (!window.confirm('Do you wish to delete this item?')) return;
        try {
            const el = document.getElementById(`item-${itemId}`);
            if(el) {
                el.style.transform = 'scale(0) rotate(20deg)';
                el.style.opacity = '0';
            }
            setTimeout(async () => {
                await api.delete(`/items/${itemId}`);
                fetchItems();
            }, 300);
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    const openEditModal = (item: Item) => {
        setEditingItem(item);
        setNewItemName(item.name);
        setNewItemCategory(item.category?.name || '');
        setNewItemQuantity(item.quantity);
        setNewItemType(item.type || 'Food');
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
                category: newItemCategory, 
                quantity: newItemQuantity,
                type: newItemType,
                expiryDate: newItemExpiry || null,
                condition: newItemCondition || null
            });
            setShowAddModal(false);
            resetForm();
            fetchItems();
        } catch (error) {
            console.error('Failed to add item', error);
        }
    };

    const resetForm = () => {
        setNewItemName('');
        setNewItemCategory('');
        setNewItemQuantity(1);
        setNewItemType('Food');
        setNewItemExpiry('');
        setNewItemCondition('NEW');
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.category && item.category.name.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || (item.category && item.category.name === categoryFilter);
        const matchesType = typeFilter === 'All' || (item.type && item.type === typeFilter);
        return matchesSearch && matchesCategory && matchesType;
    });

    const uniqueCategories = Array.from(new Set(items.map(i => i.category?.name).filter(Boolean)));

    return (
        <div className="font-body text-ink pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b-2 border-ink/10 pb-4">
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-leather hover:text-leather-dark transition-colors"
                     >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-heading">Dashboard</span>
                     </button>
                     <h2 className="font-heading text-3xl text-leather-dark drop-shadow-sm">{groupName || `Group ${groupId}`}</h2>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setEditMode(!editMode)} 
                        className={`px-3 py-1 rounded font-heading border transition-colors ${editMode ? 'bg-rpg-red text-parchment border-rpg-red shadow-inner' : 'bg-transparent text-leather border-leather/50 hover:bg-leather/10'}`}
                    >
                        {editMode ? 'Done' : 'Manage'}
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)} 
                        className="bg-leather text-gold px-4 py-2 rounded shadow border border-gold hover:bg-leather-light flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add Item
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-leather/5 p-4 rounded-lg border border-leather/20 flex flex-wrap gap-4 items-center shadow-inner">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full bg-parchment border-2 border-leather-light/30 rounded px-3 py-2 focus:outline-none focus:border-leather text-ink placeholder-leather/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="bg-parchment border border-leather/30 rounded px-3 py-2 text-ink focus:outline-none cursor-pointer hover:border-leather"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    className="bg-parchment border border-leather/30 rounded px-3 py-2 text-ink focus:outline-none cursor-pointer hover:border-leather"
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

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Add Card */}
                {editMode && (
                    <div 
                        onClick={() => setShowAddModal(true)}
                        className="aspect-square bg-leather/5 border-2 border-dashed border-leather/30 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-leather/10 hover:border-leather transition-colors"
                    >
                        <Plus className="w-12 h-12 text-leather/50 mb-2" />
                        <span className="font-heading text-leather/70">Add Item</span>
                    </div>
                )}

                {filteredItems.map(item => (
                    <div 
                        key={item.id}
                        id={`item-${item.id}`}
                        className="group relative bg-[#f0e6d2] p-4 rounded-sm shadow-md border-2 border-[#d4c5a9] hover:border-gold hover:shadow-[0_0_15px_rgba(218,165,32,0.6)] transition-all duration-300 flex flex-col justify-between aspect-square overflow-hidden"
                    >
                        {/* Type Icon Background Watermark ?? */}
                        <div className="absolute -bottom-4 -right-4 text-leather/5 transform rotate-[-20deg]">
                            {item.type === 'Food' ? <Heart size={100} /> : <Shield size={100} />}
                        </div>

                        <div>
                            <div className="flex justify-between items-start z-10 relative">
                                <h3 className="font-heading text-lg leading-tight text-leather-dark mb-1 line-clamp-2">{item.name}</h3>
                                <div className="text-xs font-mono font-bold text-ink/80 bg-leather/10 px-2 py-0.5 rounded border border-leather/10 shadow-sm">
                                    x{item.quantity}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 z-10 relative">
                                <span className="text-[10px] uppercase tracking-wider bg-leather-dark text-gold px-1.5 py-0.5 rounded shadow-sm">{item.category?.name}</span>
                                {item.expiryDate && <span className="text-[10px] uppercase tracking-wider bg-rpg-red text-white px-1.5 py-0.5 rounded shadow-sm">Exp: {item.expiryDate}</span>}
                            </div>
                        </div>

                        {/* Edit Actions Overlay */}
                        {editMode && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-3 z-20 animate-in fade-in">
                                <button onClick={() => openEditModal(item)} className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty Slots */}
                {!editMode && Array.from({ length: Math.max(0, 8 - filteredItems.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-transparent border-2 border-dashed border-[#d4c5a9] rounded opacity-30 flex items-center justify-center pointer-events-none">
                        <div className="w-4 h-4 rounded-full bg-[#d4c5a9]"></div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay Component */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-parchment w-full max-w-md p-6 rounded-lg shadow-2xl border-4 border-leather relative animate-in zoom-in-95 duration-200">
                         <div className="absolute -top-3 -left-3 w-8 h-8 bg-gold rounded-full border-2 border-leather shadow-md text-leather font-bold flex items-center justify-center font-heading">
                            {showAddModal ? '+' : '✎'}
                         </div>
                         <button 
                            onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                            className="absolute top-2 right-2 text-leather hover:text-rpg-red transition-colors"
                         >
                             <X className="w-6 h-6" />
                         </button>

                         <h2 className="font-heading text-2xl text-leather-dark mb-6 border-b-2 border-leather/10 pb-2">
                             {showAddModal ? 'Add New Item' : 'Edit Item'}
                         </h2>

                         <form onSubmit={showAddModal ? handleAddItem : handleUpdateItem} className="space-y-4">
                             <div>
                                 <label className="block text-sm font-bold text-leather-dark mb-1">Item Name</label>
                                 <input type="text" className="w-full bg-parchment-dark border border-leather/30 rounded px-3 py-2 focus:ring-2 focus:ring-gold focus:border-leather text-ink" value={newItemName} onChange={e => setNewItemName(e.target.value)} autoFocus required />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-leather-dark mb-1">Category</label>
                                     <input type="text" list="cat-suggestions" className="w-full bg-parchment-dark border border-leather/30 rounded px-3 py-2 text-ink" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} required />
                                     <datalist id="cat-suggestions">
                                         <option value="Dairy" /><option value="Weapons" /><option value="Potions" /><option value="Scrolls" />
                                     </datalist>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-bold text-leather-dark mb-1">Quantity</label>
                                    <input type="number" min="1" className="w-full bg-parchment-dark border border-leather/30 rounded px-3 py-2 text-ink" value={newItemQuantity} onChange={e => setNewItemQuantity(parseInt(e.target.value))} required />
                                 </div>
                             </div>

                             <div>
                                 <label className="block text-sm font-bold text-leather-dark mb-1">Type</label>
                                 <select className="w-full bg-parchment-dark border border-leather/30 rounded px-3 py-2 text-ink" value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                                     <option value="Food">Food</option>
                                     <option value="Medical">Medical</option>
                                     <option value="Electronics">Electronics</option>
                                     <option value="Supply">Supply</option>
                                 </select>
                             </div>

                             {(newItemType === 'Food' || newItemType === 'Medical') && (
                                 <div>
                                     <label className="block text-sm font-bold text-leather-dark mb-1">Expiry Date</label>
                                     <input type="date" className="w-full bg-parchment-dark border border-leather/30 rounded px-3 py-2 text-ink" value={newItemExpiry} onChange={e => setNewItemExpiry(e.target.value)} />
                                 </div>
                             )}

                             <div className="flex gap-4 mt-6 pt-4 border-t border-leather/10">
                                 <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="flex-1 px-4 py-2 border border-leather/50 text-leather rounded hover:bg-leather/10 transition-colors">Cancel</button>
                                 <button type="submit" className="flex-1 px-4 py-2 bg-leather text-gold font-bold rounded shadow-md hover:bg-leather-light transition-colors border border-gold">
                                     {showAddModal ? 'Add' : 'Update'}
                                 </button>
                             </div>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryDetails;
