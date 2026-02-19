import React, { useState, useEffect } from 'react';
import { contactAPI } from '../services/api';
import '../styles/Contacts.css';

/**
 * Contacts Page Component (Loveable Design)
 * 
 * Displays internal contacts (staff, suppliers, dealers) with label filters
 */
function Contacts({ user }) {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        preferredContactMethod: 'EMAIL',
        labels: []
    });

    const labelFilters = [
        { id: 'All', label: 'All', emoji: '🔍', color: '#f59e0b' },
        { id: 'Staff', label: 'Staff', emoji: '👤', color: '#3b82f6' },
        { id: 'Supplier', label: 'Supplier', emoji: '📦', color: '#10b981' },
        { id: 'Chef', label: 'Chef', emoji: '👨‍🍳', color: '#f59e0b' },
        { id: 'Helper', label: 'Helper', emoji: '🤝', color: '#8b5cf6' },
        { id: 'Dealer', label: 'Dealer', emoji: '🏪', color: '#ec4899' }
    ];

    const availableLabels = ['Staff', 'Chef', 'Helper', 'Supplier', 'Dealer'];

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (selectedLabel === 'All') {
            setFilteredContacts(contacts);
        } else {
            setFilteredContacts(contacts.filter(contact =>
                contact.labels && contact.labels.includes(selectedLabel)
            ));
        }
    }, [selectedLabel, contacts]);

    const fetchContacts = async () => {
        try {
            const data = await contactAPI.getAll(user.userId);
            setContacts(data);
        } catch (error) {
            // Error fetching contacts
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await contactAPI.delete(id);
                fetchContacts();
            } catch (error) {
                // Error deleting contact
            }
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            preferredContactMethod: contact.preferredContactMethod,
            labels: contact.labels || []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await contactAPI.update(editingContact.id, formData);
            } else {
                await contactAPI.create(user.userId, formData);
            }
            setShowModal(false);
            setEditingContact(null);
            setFormData({
                name: '',
                phone: '',
                email: '',
                preferredContactMethod: 'EMAIL',
                labels: []
            });
            fetchContacts();
        } catch (error) {
            // Error saving contact
        }
    };

    const toggleLabel = (label) => {
        setFormData(prev => ({
            ...prev,
            labels: prev.labels.includes(label)
                ? prev.labels.filter(l => l !== label)
                : [...prev.labels, label]
        }));
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">👥 Contacts</h1>
                </div>
                <button className="add-button" onClick={() => setShowModal(true)}>
                    + Add Contact
                </button>
            </div>

            {/* Label Filters */}
            <div className="filter-pills">
                {labelFilters.map(filter => (
                    <button
                        key={filter.id}
                        className={`filter-pill ${selectedLabel === filter.id ? 'active' : ''}`}
                        style={{
                            backgroundColor: selectedLabel === filter.id ? filter.color : 'transparent',
                            borderColor: filter.color,
                            color: selectedLabel === filter.id ? '#000' : filter.color
                        }}
                        onClick={() => setSelectedLabel(filter.id)}
                    >
                        <span className="pill-emoji">{filter.emoji}</span>
                        <span className="pill-text">{filter.label}</span>
                    </button>
                ))}
            </div>

            {/* Contacts Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>CONTACT</th>
                            <th>PHONE</th>
                            <th>EMAIL</th>
                            <th>LABELS</th>
                            <th>PREFERRED METHOD</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContacts.map(contact => (
                            <tr key={contact.id}>
                                <td>
                                    <div className="contact-info">
                                        <div className="avatar-circle">
                                            {getInitials(contact.name)}
                                        </div>
                                        <div className="contact-details">
                                            <div className="contact-name">{contact.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="contact-method">
                                        📞 {contact.phone}
                                    </div>
                                </td>
                                <td>
                                    <div className="contact-method">
                                        📧 {contact.email}
                                    </div>
                                </td>
                                <td>
                                    <div className="label-container">
                                        {contact.labels && contact.labels.length > 0 ? (
                                            contact.labels.map(label => (
                                                <span key={label} className="label-tag">
                                                    {label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="no-labels">No labels</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className="preferred-method">
                                        {contact.preferredContactMethod === 'EMAIL' ? '📧 Email' :
                                            contact.preferredContactMethod === 'CALL' ? '📞 Call' : '📱 SMS'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="icon-btn edit"
                                            onClick={() => handleEdit(contact)}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="icon-btn delete"
                                            onClick={() => handleDelete(contact.id)}
                                            title="Delete"
                                        >
                                            🗑️
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
                        <h2 className="modal-title">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Phone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Preferred Contact Method</label>
                                <select
                                    className="form-input"
                                    value={formData.preferredContactMethod}
                                    onChange={e => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                                >
                                    <option value="EMAIL">📧 Email</option>
                                    <option value="SMS">📱 SMS</option>
                                    <option value="CALL">📞 Call</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label className="form-label">Labels</label>
                                <div className="checkbox-group">
                                    {availableLabels.map(label => (
                                        <label key={label} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.labels.includes(label)}
                                                onChange={() => toggleLabel(label)}
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingContact ? 'Update' : 'Add'} Contact
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Contacts;
