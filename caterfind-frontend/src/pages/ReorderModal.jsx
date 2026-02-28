import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Mail, Phone } from 'lucide-react';
import { messageAPI, contactAPI } from '../services/api';
// Styles are loaded via Table.css in parent component

const ReorderModal = ({ item, catererId, onClose, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);

    // Contact details state
    const [contactMethod, setContactMethod] = useState('SMS'); // Default
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactName, setContactName] = useState('');
    
    // New: All contacts and selected contact
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContactId, setSelectedContactId] = useState(null);

    // Initial item details
    const dealerContactId = item.dealerContactId || null;
    const manualDealerName = item.dealerName || 'Dealer';
    const manualDealerPhone = item.dealerPhone || '';

    useEffect(() => {
        const init = async () => {
            // Load all contacts
            try {
                const contacts = await contactAPI.getAll(catererId);
                setAllContacts(contacts || []);
            } catch (err) {
                console.error('Failed to load contacts:', err);
            }

            // 1. Calculate quantity
            const currentQty = parseInt(item.quantity) || 0;
            const minQty = parseInt(item.minThreshold) || 0;
            const suggestQty = Math.max(minQty - currentQty, 10);
            setQuantity(suggestQty);

            let method = 'SMS';
            let name = manualDealerName;
            let phone = manualDealerPhone;
            let email = '';
            let contactId = dealerContactId;

            // 2. If linked contact, fetch details to get preference
            if (dealerContactId) {
                try {
                    const contact = await contactAPI.getById(dealerContactId);
                    if (contact) {
                        method = contact.preferredContactMethod || 'SMS';
                        name = contact.name;
                        phone = contact.phone;
                        email = contact.email;
                        contactId = contact.id;
                    }
                } catch (err) {
                    // Error fetching contact details
                }
            }

            setContactMethod(method);
            setContactName(name);
            setContactPhone(phone);
            setContactEmail(email);
            setSelectedContactId(contactId);

            // 3. Pre-fill message
            const template = `Hi ${name}, please send ${suggestQty} ${item.unit} of ${item.itemName} to CaterFind Kitchen.`;
            setMessage(template);
        };

        init();
    }, [item, catererId, dealerContactId, manualDealerName, manualDealerPhone]);

    const handleQuantityChange = (e) => {
        const newQty = e.target.value;
        setQuantity(newQty);
        setMessage(`Hi ${contactName}, please send ${newQty} ${item.unit} of ${item.itemName} to CaterFind Kitchen.`);
    };

    const handleContactChange = async (e) => {
        const contactId = e.target.value;
        
        if (!contactId) {
            // Reset to manual/default
            setSelectedContactId(null);
            setContactName(manualDealerName);
            setContactPhone(manualDealerPhone);
            setContactEmail('');
            setContactMethod('SMS');
            return;
        }

        setSelectedContactId(contactId);
        
        try {
            const contact = await contactAPI.getById(contactId);
            if (contact) {
                setContactName(contact.name);
                setContactPhone(contact.phone || '');
                setContactEmail(contact.email || '');
                setContactMethod(contact.preferredContactMethod || 'SMS');
                setMessage(`Hi ${contact.name}, please send ${quantity} ${item.unit} of ${item.itemName} to CaterFind Kitchen.`);
            }
        } catch (err) {
            console.error('Error loading contact:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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
                dealerPhone: contactPhone, // Backend uses this for SMS
                dealerContactId: dealerContactId,
                messageText: message
            };

            // Note: If method is EMAIL, backend will look up email from contactId
            // If manual entry, it defaults to SMS (phone).

            const response = await messageAPI.sendReorder(catererId, reorderData);

            if (response.success) {
                alert(`Reorder sent successfully via ${contactMethod}!`);
                onSuccess();
                onClose();
            } else {
                alert('Failed: ' + response.message);
            }
        } catch (error) {
            alert('Failed to send reorder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isReady = (contactMethod === 'SMS' && contactPhone) ||
        (contactMethod === 'EMAIL' && contactEmail) ||
        (contactMethod === 'CALL' && contactPhone);

    return (
        <div className="modal-overlay">
            <div className="modal-content reorder-modal">
                <div className="modal-header">
                    <h2>
                        {contactMethod === 'EMAIL' ? <Mail size={24} /> : <MessageSquare size={24} />}
                        Reorder Item
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="item-summary" style={{
                        background: '#333',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '24px' }}>{item.categoryEmoji || '📦'}</span>
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.itemName}</div>
                            <div style={{ fontSize: '0.9em', color: '#aaa' }}>
                                Current Stock: <span style={{ color: '#ef4444' }}>{item.quantity} {item.unit}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Contact {contactMethod === 'EMAIL' ? '(Email)' : '(Phone/SMS)'}</label>
                        <select 
                            value={selectedContactId || ''}
                            onChange={handleContactChange}
                            className="form-input"
                            style={{ 
                                background: '#222', 
                                color: '#fff', 
                                border: '1px solid #444',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '14px'
                            }}
                        >
                            {allContacts.map(contact => (
                                <option key={contact.id} value={contact.id}>
                                    {contact.name} ({contact.phone || contact.email || 'No contact info'})
                                </option>
                            ))}
                        </select>
                        {dealerContactId && selectedContactId === dealerContactId && (
                            <div style={{ fontSize: '11px', color: '#f49d25', marginTop: '4px' }}>
                                * Using preferred method: {contactMethod}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Order Quantity ({item.unit})</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={handleQuantityChange}
                            className="form-input"
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Message Preview ({contactMethod})</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="form-textarea"
                            rows="4"
                            required
                        />
                    </div>

                    {!isReady && (
                        <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px' }}>
                            ⚠️ Cannot send: {contactMethod === 'EMAIL' ? 'Email address' : 'Phone number'} missing.
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading || !isReady}
                            style={{ background: '#f49d25', color: '#000' }}
                        >
                            {loading ? 'Sending...' : <><Send size={18} /> Send {contactMethod}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReorderModal;
