import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Mail } from 'lucide-react';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { messageAPI, contactAPI } from '../services/api';
import { formatPhoneForDisplay, formatPhoneForBackend, formatPhoneForInput } from '../lib/utils';
// Styles are loaded via Table.css in parent component

const ReorderModal = ({ item, catererId, onClose, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isEditingMessage, setIsEditingMessage] = useState(false);

    // Contact details state
    const [contactMethod, setContactMethod] = useState('SMS'); // Default
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactName, setContactName] = useState('');
    
    // New: All contacts and selected contact
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContactId, setSelectedContactId] = useState('');

    // Initial item details
    const dealerContactId = item.dealerContactId || null;
    const manualDealerName = item.dealerName || 'Dealer';
    const manualDealerPhone = item.dealerPhone || '';
    const isManualMode = !selectedContactId;

    const filteredContacts = Array.isArray(allContacts)
        ? allContacts.filter(contact =>
            contact.labels?.includes('Dealer') || contact.labels?.includes('Supplier')
        )
        : [];

    const formatItemName = (name) => {
        const trimmed = (name || '').trim();
        if (!trimmed) {
            return 'Item';
        }
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    };

    const getDisplayName = (name) => (name || manualDealerName || 'Dealer').trim() || 'Dealer';

    const buildMessage = (name, qty, method) => {
        const safeName = getDisplayName(name);
        const itemName = formatItemName(item.itemName);

        if (method === 'EMAIL') {
            return [
                `Subject: Reorder Request - ${itemName}`,
                '',
                'Body:',
                `Hi ${safeName},`,
                '',
                `Please send ${qty} ${item.unit} of ${itemName} to CaterFind Kitchen.`,
                '',
                'Thank you,',
                'Royal Caterers'
            ].join('\n');
        }

        return `Hi ${safeName}, please send ${qty} ${item.unit} of ${itemName} to CaterFind Kitchen.`;
    };

    const getMethodLabel = (method) => {
        if (method === 'EMAIL') {
            return 'Email';
        }
        if (method === 'CALL') {
            return 'Call';
        }
        return 'SMS';
    };

    useEffect(() => {
        const init = async () => {
            // Load all contacts
            try {
                const contacts = await contactAPI.getAll(catererId);
                // Strip +91 from phone numbers for display in inputs
                const formattedContacts = contacts.map(c => ({
                    ...c,
                    phone: formatPhoneForInput(c.phone)
                }));
                setAllContacts(Array.isArray(formattedContacts) ? formattedContacts : []);
            } catch (_err) {
                console.error('Failed to load contacts:', _err);
                setAllContacts([]);
            }

            // 1. Calculate quantity
            const currentQty = parseInt(item.quantity) || 0;
            const minQty = parseInt(item.minThreshold) || 0;
            const suggestQty = Math.max(minQty - currentQty, 10);
            setQuantity(suggestQty);

            let method = 'SMS';
            let name = manualDealerName;
            let phone = formatPhoneForInput(manualDealerPhone);
            let email = '';
            let contactId = dealerContactId || '';

            // 2. If linked contact, fetch details to get preference
            if (dealerContactId) {
                try {
                    const contact = await contactAPI.getById(dealerContactId);
                    if (contact) {
                        method = contact.preferredContactMethod || 'SMS';
                        name = contact.name;
                        phone = formatPhoneForInput(contact.phone);
                        email = contact.email;
                        contactId = contact.id;
                    }
                } catch {
                    // Error fetching contact details
                }
            }

            setContactMethod(method);
            setContactName(name);
            setContactPhone(phone);
            setContactEmail(email);
            setSelectedContactId(contactId ? String(contactId) : '');

        };

        init();
    }, [item, catererId, dealerContactId, manualDealerName, manualDealerPhone]);

    useEffect(() => {
        setMessage(buildMessage(contactName, quantity, contactMethod));
    }, [contactName, quantity, contactMethod, item.itemName, item.unit, manualDealerName]);

    const handleQuantityChange = (e) => {
        const newQty = parseInt(e.target.value) || 0;
        setQuantity(newQty);
    };

    const handleManualNameChange = (e) => {
        const nextName = e.target.value;
        setContactName(nextName);
    };

    const handleManualPhoneOrEmailChange = (e) => {
        const value = e.target.value.trim();

        if (value.includes('@')) {
            setContactEmail(value);
            setContactPhone('');
            setContactMethod('EMAIL');
            return;
        }

        setContactPhone(value.replace(/\D/g, '').slice(0, 10));
        setContactEmail('');
        setContactMethod('SMS');
    };

    const handleContactChange = async (e) => {
        const contactId = e.target.value;

        if (!contactId) {
            // Reset to manual/default
            setSelectedContactId('');
            setContactName(manualDealerName);
            setContactPhone(formatPhoneForInput(manualDealerPhone));
            setContactEmail('');
            setContactMethod('SMS');
            return;
        }

        setSelectedContactId(contactId);

        try {
            const contact = await contactAPI.getById(contactId);
            if (contact) {
                setContactName(contact.name);
                setContactPhone(formatPhoneForInput(contact.phone));
                setContactEmail(contact.email || '');
                setContactMethod(contact.preferredContactMethod || 'SMS');
            }
        } catch (_err) {
            console.error('Error loading contact:', _err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isManualMode) {
            if (!contactName.trim()) {
                alert('Dealer Name is required.');
                return;
            }

            if (!contactPhone.trim() && !contactEmail.trim()) {
                alert('Phone or Email is required for manual entry.');
                return;
            }
        }

        // Validation based on method
        if (contactMethod === 'SMS' && !contactPhone) {
            alert('Cannot send SMS: No phone number available for this contact.');
            return;
        }
        if (contactMethod === 'CALL' && !contactPhone) {
            alert('Cannot call: No phone number available for this contact.');
            return;
        }
        if (contactMethod === 'EMAIL' && !contactEmail) {
            alert('Cannot send Email: No email address available for this contact.');
            return;
        }

        setLoading(true);
        try {
            const reorderData = {
                dealerName: contactName,
                dealerPhone: contactPhone ? formatPhoneForBackend(contactPhone) : null,
                dealerEmail: contactEmail || null,
                dealerContactId: selectedContactId ? parseInt(selectedContactId) : null,
                contactMethod: contactMethod,
                messageText: message
            };

            // Note: If method is EMAIL, backend will look up email from contactId
            // If manual entry, it defaults to SMS (phone).

            const response = await messageAPI.sendReorder(catererId, reorderData);

            if (response && response.success) {
                alert(`Reorder sent successfully via ${contactMethod}!`);
                onSuccess();
                onClose();
            } else {
                alert('Failed: ' + (response?.message || 'Unknown error'));
            }
        } catch {
            alert('Failed to send reorder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isReady = (isManualMode && contactName.trim() && (contactPhone.trim() || contactEmail.trim())) ||
        (contactMethod === 'SMS' && contactPhone) ||
        (contactMethod === 'EMAIL' && (contactEmail || contactPhone)) ||
        (contactMethod === 'CALL' && contactPhone);

    const previewName = getDisplayName(contactName);
    const previewItemName = formatItemName(item.itemName);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={
                <div className="reorder-modal-title">
                    <span className="reorder-modal-title-icon">
                        {contactMethod === 'EMAIL' ? <Mail size={20} /> : <MessageSquare size={20} />}
                    </span>
                    <span>Reorder Item</span>
                </div>
            }
            className="reorder-modal"
        >
            <form onSubmit={handleSubmit} className="item-form">
                    <div className="item-summary">
                        <span>{item.categoryEmoji || '📦'}</span>
                        <div>
                            <div className="item-name">{item.itemName}</div>
                            <div className="item-stock">Current Stock: <span className="stock-value">{item.quantity} {item.unit}</span></div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Dealer / Supplier (or enter manually)</label>
                        <Select
                            value={selectedContactId || ''}
                            onChange={handleContactChange}
                            options={[
                                { value: '', label: 'Select Dealer / Supplier (or enter manually)' },
                                ...(filteredContacts.length > 0 ?
                                    filteredContacts.map(contact => ({
                                        value: contact.id,
                                        label: `${contact.name} (${formatPhoneForDisplay(contact.phone) || contact.email || 'No contact info'})`
                                    }))
                                    :
                                    []
                                )
                            ]}
                            placeholder="Select dealer / supplier"
                        />

                        {/* Manual dealer inputs when no registered contact selected */}
                        {!selectedContactId && (
                            <div className="manual-contact-fields">
                                <input
                                    type="text"
                                    placeholder="Dealer Name *"
                                    value={contactName}
                                    onChange={handleManualNameChange}
                                    className="form-input"
                                />
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 text-sm font-semibold" style={{ display: contactPhone ? 'flex' : 'none' }}>+91</span>
                                    <input
                                        type="tel"
                                        placeholder="Phone (98765 43210) or email"
                                        value={contactPhone || contactEmail}
                                        onChange={handleManualPhoneOrEmailChange}
                                        style={{ paddingLeft: contactPhone ? '40px' : '8px' }}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Order Quantity ({item.unit}) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Only allow values >= 1
                                if (val === '' || Number(val) >= 1) {
                                    handleQuantityChange(e);
                                }
                            }}
                            className="form-input"
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="message-preview-header">
                            <label>Message Preview ({getMethodLabel(contactMethod)}) <span className="text-red-500">*</span></label>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setIsEditingMessage(prev => !prev)}
                            >
                                {isEditingMessage ? 'Show Preview' : 'Edit Message'}
                            </button>
                        </div>

                        {isEditingMessage ? (
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="form-textarea reorder-message-preview"
                                rows="8"
                                required
                            />
                        ) : (
                            <div className="preview-box" aria-live="polite">
                                <p><strong>Subject:</strong> Reorder Request - {previewItemName}</p>
                                <p className="preview-gap" />
                                <p><strong>Body:</strong></p>
                                <p>Hi {previewName},</p>
                                <p>Please send {quantity} {item.unit} of {previewItemName} to CaterFind Kitchen.</p>
                                <p className="preview-gap" />
                                <p>Thank you,<br />Royal Caterers</p>
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading || !isReady}
                        >
                            {loading ? 'Sending...' : <><Send size={18} /> Send {getMethodLabel(contactMethod)}</>}
                        </button>
                    </div>
                </form>
        </Modal>
    );
};

export default ReorderModal;
