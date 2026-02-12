import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Minus, Send } from 'lucide-react';
import { inventoryAPI, contactAPI } from '../services/api';
import ReorderModal from './ReorderModal';
import '../styles/Table.css';

/**
 * Inventory Page Component (Loveable Design)
 * 
 * Displays inventory items with category filters and quantity controls
 */
function Inventory({ user }) {
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
        { name: 'All', emoji: '🔍', color: '#f59e0b' },
        { name: 'GRAIN', emoji: '🌾', color: '#10b981' },
        { name: 'VEGETABLE', emoji: '🥬', color: '#22c55e' },
        { name: 'MEAT', emoji: '🍖', color: '#ef4444' },
        { name: 'DAIRY', emoji: '🥛', color: '#3b82f6' },
        { name: 'OIL', emoji: '🫒', color: '#f59e0b' },
        { name: 'MASALA', emoji: '🌶️', color: '#dc2626' },
        { name: 'SAUCE', emoji: '🍯', color: '#f97316' },
        { name: 'SWEET', emoji: '🍰', color: '#ec4899' },
        { name: 'ESSENTIALS', emoji: '⭐', color: '#8b5cf6' },
        { name: 'OTHER', emoji: '📦', color: '#64748b' }
    ];

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

    const fetchItems = async () => {
        try {
            const data = await inventoryAPI.getAll(user.userId);
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        }
    };

    const fetchContacts = async () => {
        try {
            const data = await contactAPI.getAll(user.userId);
            console.log('Fetched contacts:', data); // Debug log
            setContacts(data);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        }
    };

    const handleQuantityChange = async (itemId, delta) => {
        try {
            const item = items.find(i => i.id === itemId);
            const newQuantity = Math.max(0, item.quantity + delta);
            await inventoryAPI.update(itemId, { ...item, quantity: newQuantity });
            fetchItems();
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await inventoryAPI.delete(id);
                fetchItems();
            } catch (error) {
                console.error('Failed to delete item:', error);
            }
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
        } catch (error) {
            console.error('Failed to save item:', error);
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
        <div className="page-container">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">📦 Inventory</h1>
                </div>
                <button className="add-button" onClick={() => setShowModal(true)}>
                    + Add Item
                </button>
            </div>

            {/* Category Filters */}
            <div className="filter-pills">
                {categories.map(cat => (
                    <button
                        key={cat.name}
                        className={`filter-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                        style={{
                            backgroundColor: selectedCategory === cat.name ? cat.color : 'transparent',
                            borderColor: cat.color,
                            color: selectedCategory === cat.name ? '#000' : cat.color
                        }}
                        onClick={() => setSelectedCategory(cat.name)}
                    >
                        <span className="pill-emoji">{cat.emoji}</span>
                        <span className="pill-text">{cat.name === 'All' ? 'All' : cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}</span>
                    </button>
                ))}
            </div>

            {/* Inventory Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ITEM</th>
                            <th>QUANTITY</th>
                            <th>DEALER</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div className="item-cell">
                                        <div className="item-name">{item.itemName}</div>
                                        <div className="item-category">{getCategoryEmoji(item.category)} {item.category.charAt(0) + item.category.slice(1).toLowerCase()}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="quantity-control">
                                        <button
                                            className="qty-btn"
                                            onClick={() => handleQuantityChange(item.id, -1)}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className={`qty-value ${isLowStock(item) ? 'low' : ''}`}>
                                            {item.quantity} {item.unit}
                                        </span>
                                        <button
                                            className="qty-btn"
                                            onClick={() => handleQuantityChange(item.id, 1)}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div className="qty-min">Min: {item.minThreshold} {item.unit}</div>
                                </td>
                                <td>
                                    <div className="dealer-cell">
                                        <div className="dealer-name">{item.dealerName}</div>
                                        <div className="dealer-contact">📞 {item.dealerPhone || item.dealerContact}</div>
                                    </div>
                                </td>
                                <td>
                                    {isLowStock(item) ? (
                                        <div className="status-group">
                                            <span className="status-badge low-stock">⚠ Low Stock</span>
                                            <button
                                                className="reorder-btn"
                                                onClick={() => handleReorder(item)}
                                            >
                                                <Send size={16} /> Reorder
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="status-badge ok">OK</span>
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="icon-btn edit"
                                            onClick={() => handleEdit(item)}
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className="icon-btn delete"
                                            onClick={() => handleDelete(item.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <label className="form-label">Item Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.itemName}
                                    onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.filter(c => c.name !== 'All').map(cat => (
                                        <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row-group">
                                <div className="form-row">
                                    <label className="form-label">Quantity</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Unit</label>
                                    <select
                                        className="form-input"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="liters">liters</option>
                                        <option value="pieces">pieces</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <label className="form-label">Minimum Threshold</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.minThreshold}
                                    onChange={e => setFormData({ ...formData, minThreshold: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Dealer Selection Section */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    Dealer / Supplier Information ({contacts.filter(c => c.labels && (c.labels.includes('Dealer') || c.labels.includes('Supplier'))).length} available)
                                </h3>
                                <div className="form-row">
                                    <label className="form-label">Select from Existing Contacts</label>
                                    <select
                                        className="form-input"
                                        onChange={e => {
                                            console.log('Selected contact ID:', e.target.value);
                                            handleDealerSelect(e.target.value);
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="">-- Select Dealer (Optional) --</option>
                                        {contacts.filter(c => c.labels && (c.labels.includes('Dealer') || c.labels.includes('Supplier'))).length === 0 && (
                                            <option disabled>No dealers/suppliers found. Add contacts with 'Dealer' or 'Supplier' label.</option>
                                        )}
                                        {contacts
                                            .filter(contact => contact.labels && (contact.labels.includes('Dealer') || contact.labels.includes('Supplier')))
                                            .map(contact => (
                                                <option key={contact.id} value={contact.id}>
                                                    {contact.name} ({contact.labels.join(', ')}) - {contact.phone || contact.email}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="form-hint">Or enter dealer details manually below</p>
                                </div>
                            </div>

                            <div className="form-row">
                                <label className="form-label">Dealer Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.dealerName}
                                    onChange={e => setFormData({ ...formData, dealerName: e.target.value })}
                                    placeholder="Enter dealer name or select from above"
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Dealer Contact</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.dealerContact}
                                    onChange={e => setFormData({ ...formData, dealerContact: e.target.value })}
                                    placeholder="Phone or email"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Update' : 'Add'} Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Reorder Modal */}
            {showReorderModal && reorderingItem && (
                <ReorderModal
                    item={reorderingItem}
                    catererId={user.userId}
                    onClose={() => {
                        setShowReorderModal(false);
                        setReorderingItem(null);
                    }}
                    onSuccess={() => {
                        // Optional: Refresh items/logs if needed
                        console.log('Reorder sent');
                    }}
                />
            )}
        </div>
    );
}

export default Inventory;
