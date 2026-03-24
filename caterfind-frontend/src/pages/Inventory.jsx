import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Minus, Send, Package, X } from 'lucide-react';
import { inventoryAPI, contactAPI } from '../services/api';
import ReorderModal from './ReorderModal';
import Modal from '../components/Modal';
import { useDialog } from '../components/DialogProvider';
import '../styles/Table.css';
import '../styles/Contacts.css'; // Re-using filter pills

/**
 * Inventory Page Component (Dense Light Theme)
 */
function Inventory({ user }) {
    const { showConfirm } = useDialog();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [reorderingItem, setReorderingItem] = useState(null);
    const [contacts, setContacts] = useState([]); // For dealer selection
    const [formData, setFormData] = useState({
        itemName: '',
        category: 'GRAIN',
        quantity: '',
        unit: 'kg',
        minThreshold: '',
        dealerName: '',
        dealerContact: '',
        dealerContactId: ''
    });

    const categories = [
        { name: 'All', emoji: '🗂️' },
        { name: 'GRAIN', emoji: '🌾' },
        { name: 'VEGETABLE', emoji: '🥬' },
        { name: 'MEAT', emoji: '🍖' },
        { name: 'DAIRY', emoji: '🥛' },
        { name: 'OIL', emoji: '🫒' },
        { name: 'MASALA', emoji: '🌶️' },
        { name: 'SAUCE', emoji: '🍯' },
        { name: 'SWEET', emoji: '🍰' },
        { name: 'ESSENTIALS', emoji: '⭐' },
        { name: 'OTHER', emoji: '📦' }
    ];

    async function fetchItems() {
        try {
            const data = await inventoryAPI.getAll(user.userId);
            setItems(data);
        } catch {
            // Error fetching inventory
        }
    }

    async function fetchContacts() {
        try {
            const data = await contactAPI.getAll(user.userId);
            setContacts(data);
        } catch {
            // Error fetching contacts
        }
    }

    useEffect(() => {
        fetchItems();
        fetchContacts();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredItems(items);
        } else {
            setFilteredItems(items.filter(item => item.category === selectedCategory));
        }
    }, [selectedCategory, items]);

    const handleQuantityChange = async (itemId, delta) => {
        try {
            const item = items.find(i => i.id === itemId);
            const newQuantity = Math.max(0, item.quantity + delta);
            await inventoryAPI.update(itemId, { ...item, quantity: newQuantity });
            fetchItems();
        } catch {
            // Error updating quantity
        }
    };

    const handleDelete = async (id) => {
        const shouldDelete = await showConfirm('Are you sure you want to delete this item?', {
            title: 'Delete Inventory Item',
            confirmText: 'Delete'
        });

        if (!shouldDelete) return;

        try {
            await inventoryAPI.delete(id);
            fetchItems();
        } catch {
            // Error deleting item
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            minThreshold: item.minThreshold,
            dealerName: item.dealerName || '',
            dealerContact: item.dealerPhone || '', // Map backend dealerPhone to frontend dealerContact
            dealerContactId: item.dealerContactId || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Map frontend formData to backend DTO structure
            // dealerContact (frontend) -> dealerPhone (backend)
            const payload = {
                ...formData,
                dealerPhone: formData.dealerContact,
                dealerContactId: formData.dealerContactId ? parseInt(formData.dealerContactId) : null
            };

            if (editingItem) {
                await inventoryAPI.update(editingItem.id, payload);
            } else {
                await inventoryAPI.create(user.userId, payload);
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData({
                itemName: '',
                category: 'GRAIN',
                quantity: '',
                unit: 'kg',
                minThreshold: '',
                dealerName: '',
                dealerContact: '',
                dealerContactId: '' // Reset ID
            });
            fetchItems();
        } catch {
            // Error saving item
        }
    };

    const handleReorder = (item) => {
        setReorderingItem(item);
        setShowReorderModal(true);
    };

    const handleDealerSelect = (contactId) => {
        if (!contactId) {
            // Clear dealer fields if "Select Dealer" is chosen
            setFormData({
                ...formData,
                dealerName: '',
                dealerContact: '',
                dealerContactId: ''
            });
            return;
        }

        const selectedContact = contacts.find(c => c.id === parseInt(contactId));
        if (selectedContact) {
            setFormData({
                ...formData,
                dealerName: selectedContact.name,
                dealerContact: selectedContact.phone || selectedContact.email || '',
                dealerContactId: selectedContact.id
            });
        }
    };

    const getCategoryEmoji = (category) => {
        const cat = categories.find(c => c.name === category);
        return cat ? cat.emoji : '📦';
    };

    const isLowStock = (item) => {
        return item.quantity <= item.minThreshold;
    };

    return (
        <div className="page-shell space-y-6">
            <div className="contacts-header">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Package className="w-6 h-6" />
                        Inventory
                    </h1>
                    <button className="primary-button w-full sm:w-auto" onClick={() => {
                        setEditingItem(null);
                        setFormData({ itemName: '', category: 'GRAIN', quantity: '', unit: 'kg', minThreshold: '', dealerName: '', dealerContact: '', dealerContactId: '' });
                        setShowModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </button>
                </div>
            </div>

            {/* Category Filters */}
            <div className="filter-pills">
                {categories.map(cat => (
                    <button
                        key={cat.name}
                        className={`filter-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.name)}
                    >
                        <span className="pill-emoji">{cat.emoji}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Inventory Table */}
            <div className="md:hidden space-y-4">
                {filteredItems.map(item => (
                    <div key={item.id} className={`surface-card p-5 space-y-4 ${isLowStock(item) ? 'border-red-200' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{getCategoryEmoji(item.category)}</span>
                                <div>
                                    <p className="text-base font-semibold text-slate-900">{item.itemName}</p>
                                    <p className="text-sm text-slate-600">{item.category}</p>
                                </div>
                            </div>
                            <span className={`table-cell-badge ${isLowStock(item) ? 'danger' : 'success'}`}>
                                {isLowStock(item) ? 'Low Stock' : 'In Stock'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-slate-500">Quantity</p>
                                <div className="quantity-control mt-1">
                                    <button className="qty-btn" onClick={() => handleQuantityChange(item.id, -1)}><Minus size={14} /></button>
                                    <span className="qty-value">{item.quantity} {item.unit}</span>
                                    <button className="qty-btn" onClick={() => handleQuantityChange(item.id, 1)}><Plus size={14} /></button>
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-500">Dealer</p>
                                <p className="text-slate-800 mt-1">{item.dealerName || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {isLowStock(item) && (
                                <button className="secondary-button w-full" onClick={() => handleReorder(item)}>
                                    <Send size={14} className="mr-2" />
                                    Re-order
                                </button>
                            )}
                            <button className="secondary-button w-full" onClick={() => handleEdit(item)}>
                                <Pencil size={14} className="mr-2" />
                                Edit
                            </button>
                            <button className="secondary-button w-full" onClick={() => handleDelete(item.id)}>
                                <Trash2 size={14} className="mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="table-container hidden md:block">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Dealer</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} className={isLowStock(item) ? 'bg-red-50/50' : ''}>
                                <td>
                                    <div className="item-name-cell">
                                        <span className="item-emoji">{getCategoryEmoji(item.category)}</span>
                                        <span className="item-name">{item.itemName}</span>
                                    </div>
                                </td>
                                <td>{item.category}</td>
                                <td>
                                    <div className="quantity-control">
                                        <button className="qty-btn" onClick={() => handleQuantityChange(item.id, -1)}><Minus size={14} /></button>
                                        <span className="qty-value">{item.quantity} {item.unit}</span>
                                        <button className="qty-btn" onClick={() => handleQuantityChange(item.id, 1)}><Plus size={14} /></button>
                                    </div>
                                </td>
                                <td>
                                    <span className={`table-cell-badge ${isLowStock(item) ? 'danger' : 'success'}`}>
                                        {isLowStock(item) ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </td>
                                <td>{item.dealerName || 'N/A'}</td>
                                <td className="table-cell-actions">
                                    {isLowStock(item) && (
                                        <button className="reorder-button" onClick={() => handleReorder(item)}>
                                            <Send size={12} className="mr-1" />
                                            Re-order
                                        </button>
                                    )}
                                    <button className="table-icon-button" onClick={() => handleEdit(item)}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="table-icon-button danger" onClick={() => handleDelete(item.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Item' : 'Add New Item'} className="">
                <form className="item-form" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group md:col-span-2">
                                    <label>Item Name</label>
                                    <input type="text" className="form-input" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                        {categories.filter(c => c.name !== 'All').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" className="form-input" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select className="form-select" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="litre">litre</option>
                                        <option value="ml">ml</option>
                                        <option value="piece">piece</option>
                                        <option value="dozen">dozen</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Threshold</label>
                                    <input type="number" className="form-input" value={formData.minThreshold} onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })} required />
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label>Dealer / Supplier</label>
                                    <select className="form-select" value={formData.dealerContactId} onChange={(e) => handleDealerSelect(e.target.value)}>
                                        <option value="">Select a registered contact</option>
                                        {contacts.filter(c => c.labels.includes('Dealer') || c.labels.includes('Supplier')).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                 <div className="form-group">
                                    <label>Dealer Name (if not in contacts)</label>
                                    <input type="text" className="form-input" value={formData.dealerName} onChange={(e) => setFormData({ ...formData, dealerName: e.target.value })} disabled={!!formData.dealerContactId} />
                                </div>
                                <div className="form-group">
                                    <label>Dealer Contact (if not in contacts)</label>
                                    <input type="text" className="form-input" value={formData.dealerContact} onChange={(e) => setFormData({ ...formData, dealerContact: e.target.value })} disabled={!!formData.dealerContactId} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="submit-button">{editingItem ? 'Save Changes' : 'Create Item'}</button>
                            </div>
                </form>
            </Modal>

            {showReorderModal && (
                <ReorderModal
                    item={reorderingItem}
                    onClose={() => setShowReorderModal(false)}
                    user={user}
                    catererId={user.userId}
                />
            )}
        </div>
    );
}

export default Inventory;
