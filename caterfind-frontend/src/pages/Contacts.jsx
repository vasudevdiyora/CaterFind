import React, { useState, useEffect, useMemo } from 'react';
import { contactAPI } from '../services/api';
import { formatPhoneForDisplay, formatPhoneForBackend, formatPhoneForInput } from '../lib/utils';
import '../styles/Contacts.css';
import '../styles/Table.css'; // For modal and other shared styles
import { Plus, Search, User, Phone, Mail, MessageSquare, Languages, Pencil, Trash2, X, Users } from 'lucide-react';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { useDialog } from '../components/DialogProvider';

/**
 * Contacts Page Component (Dense Light Theme)
 * Displays internal contacts (staff, suppliers, dealers) with label filters
 */
function Contacts({ user }) {
    const { showConfirm } = useDialog();
    const [contacts, setContacts] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        preferredContactMethod: 'EMAIL',
        preferredLanguage: 'ENGLISH',
        labels: []
    });
    const [error, setError] = useState(null);

    const labelFilters = [
        { id: 'All', label: 'All Contacts' },
        { id: 'Staff', label: 'Staff' },
        { id: 'Supplier', label: 'Suppliers' },
        { id: 'Chef', label: 'Chefs' },
        { id: 'Helper', label: 'Helpers' },
        { id: 'Dealer', label: 'Dealers' }
    ];

    const availableLabels = ['Staff', 'Chef', 'Helper', 'Supplier', 'Dealer'];

    const fetchContacts = async () => {
        try {
            const data = await contactAPI.getAll(user.userId);
            setContacts(data);
        } catch {
            // Error fetching contacts
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchContacts();
    }, []);

    const filteredContacts = useMemo(() => {
        let result = contacts;

        if (selectedLabel !== 'All') {
            result = result.filter(contact =>
                contact.labels && contact.labels.includes(selectedLabel)
            );
        }

        if (searchTerm) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.phone.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return result;
    }, [selectedLabel, searchTerm, contacts]);

    const handleAdd = () => {
        setEditingContact(null);
        setError(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            preferredContactMethod: 'EMAIL',
            preferredLanguage: 'ENGLISH',
            labels: []
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const shouldDelete = await showConfirm('Are you sure you want to delete this contact?', {
            title: 'Delete Contact',
            confirmText: 'Delete'
        });

        if (!shouldDelete) return;

        try {
            await contactAPI.delete(id);
            fetchContacts();
        } catch {
            // Error deleting contact
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            phone: formatPhoneForInput(contact.phone),
            email: contact.email,
            preferredContactMethod: contact.preferredContactMethod,
            preferredLanguage: contact.preferredLanguage || 'ENGLISH',
            labels: contact.labels || []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        // Validate required fields
        if (!formData.name || !formData.name.trim()) {
            setError('Contact name is required');
            return;
        }
        
        if (!formData.phone || !formData.phone.trim()) {
            setError('Phone number is required');
            return;
        }
        
        try {
            const payload = { 
                ...formData, 
                userId: user.userId,
                phone: formData.phone ? formatPhoneForBackend(formData.phone) : ''
            };
            if (editingContact) {
                await contactAPI.update(editingContact.id, payload);
            } else {
                await contactAPI.create(user.userId, payload);
            }
            setShowModal(false);
            setFormData({
                name: '',
                phone: '',
                email: '',
                preferredContactMethod: 'EMAIL',
                preferredLanguage: 'ENGLISH',
                labels: []
            });
            fetchContacts();
        } catch (err) {
            const errorMessage = err?.message || 'Failed to save contact. Please try again.';
            console.error('[Contacts] Error saving contact:', err);
            setError(errorMessage);
        }
    };

    const toggleLabel = (label) => {
        // Only allow one label per contact
        setFormData(prev => ({
            ...prev,
            labels: prev.labels.includes(label) ? [] : [label]
        }));
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="page-shell space-y-6">
            <div className="contacts-header">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="w-6 h-6" />
                        Contacts
                    </h1>
                    <button className="primary-button w-full sm:w-auto" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                    </button>
                </div>
                <div className="mt-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            className="h-9 pl-10 pr-4 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-sky-200 focus:border-sky-300 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-pills">
                    {labelFilters.map(filter => (
                        <button
                            key={filter.id}
                            className={`filter-pill ${selectedLabel === filter.id ? 'active' : ''}`}
                            onClick={() => setSelectedLabel(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="md:hidden space-y-4">
                {filteredContacts.map(contact => (
                    <div key={contact.id} className="surface-card p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="avatar-circle">{getInitials(contact.name)}</div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{contact.name}</p>
                                    <p className="text-sm text-slate-600 truncate">{contact.preferredContactMethod} • {contact.preferredLanguage}</p>
                                </div>
                            </div>
                            <div className="table-cell-actions">
                                <button className="table-icon-button" onClick={() => handleEdit(contact)}><Pencil size={16} /></button>
                                <button className="table-icon-button danger" onClick={() => handleDelete(contact.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <a href={`tel:${formatPhoneForBackend(contact.phone)}`} className="text-slate-700 hover:text-sky-600">{formatPhoneForDisplay(contact.phone)}</a>
                            <a href={`mailto:${contact.email}`} className="text-slate-700 hover:text-sky-600 truncate">{contact.email}</a>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {contact.labels && contact.labels.length > 0 ? (
                                contact.labels.map(label => <span key={label} className="label-tag">{label}</span>)
                            ) : <span className="text-slate-400 text-sm italic">No labels</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="table-container hidden md:block">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Contact</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Labels</th>
                            <th>Preferred Method</th>
                            <th>Language</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContacts.map(contact => (
                            <tr key={contact.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar-circle">
                                            {getInitials(contact.name)}
                                        </div>
                                        <span className="font-semibold text-slate-800">{contact.name}</span>
                                    </div>
                                </td>
                                <td><a href={`tel:${formatPhoneForBackend(contact.phone)}`} className="text-slate-600 hover:text-sky-600">{formatPhoneForDisplay(contact.phone)}</a></td>
                                <td><a href={`mailto:${contact.email}`} className="text-slate-600 hover:text-sky-600">{contact.email}</a></td>
                                <td>
                                    <div className="flex flex-wrap gap-1.5">
                                        {contact.labels && contact.labels.length > 0 ? (
                                            contact.labels.map(label => (
                                                <span key={label} className="label-tag">
                                                    {label}
                                                </span>
                                            ))
                                        ) : <span className="text-slate-400 text-sm italic">No labels</span>}
                                    </div>
                                </td>
                                <td>{contact.preferredContactMethod}</td>
                                <td>{contact.preferredLanguage}</td>
                                <td className="table-cell-actions">
                                    <button className="table-icon-button" onClick={() => handleEdit(contact)}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="table-icon-button danger" onClick={() => handleDelete(contact.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingContact ? 'Edit Contact' : 'Add New Contact'} className="">
                <form className="item-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label htmlFor="name"><User className="inline-icon" /> Name <span className="text-red-500">*</span></label>
                                    <input id="name" type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone"><Phone className="inline-icon" /> Phone <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 text-sm font-semibold" style={{ display: formData.phone ? 'flex' : 'none' }}>+91</span>
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="form-input"
                                            style={{ paddingLeft: formData.phone ? '40px' : '12px' }}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                            placeholder="98765 43210"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email"><Mail className="inline-icon" /> Email <span className="text-red-500">*</span></label>
                                    <input id="email" type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="preferredContactMethod"><MessageSquare className="inline-icon" /> Preferred Contact Method</label>
                                    <Select
                                        value={formData.preferredContactMethod}
                                        onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                                        options={[
                                            { value: 'SMS', label: 'SMS' },
                                            { value: 'EMAIL', label: 'Email' },
                                            { value: 'CALL', label: 'Call' }
                                        ]}
                                        placeholder="Select contact method"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="preferredLanguage"><Languages className="inline-icon" /> Preferred Language</label>
                                    <Select
                                        value={formData.preferredLanguage}
                                        onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                        options={[
                                            { value: 'ENGLISH', label: 'English' },
                                            { value: 'HINDI', label: 'Hindi' },
                                            { value: 'GUJARATI', label: 'Gujarati' }
                                        ]}
                                        placeholder="Select language"
                                    />
                                </div>
                            </div>

                            <div className="form-group mt-4">
                                <label>Labels</label>
                                <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                                    {availableLabels.map(label => (
                                        <div key={label} className={`label-checkbox ${formData.labels.includes(label) ? 'selected' : ''}`} onClick={() => toggleLabel(label)}>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="submit-button">{editingContact ? 'Save Changes' : 'Create Contact'}</button>
                            </div>
                </form>
            </Modal>
        </div>
    );
}

export default Contacts;
