import React, { useState, useEffect } from 'react';
import { messageAPI, contactAPI } from '../services/api';
import '../styles/Messages.css';
import Modal from '../components/Modal';

/**
 * Messages Page Component (Premium Design)
 * 
 * Broadcast messaging interface with recipient selection cards
 * and toggleable message history.
 */
function Messages({ user }) {
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [labelFilter, setLabelFilter] = useState('All');
    const [messageText, setMessageText] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState('ENGLISH');
    const [messageLogs, setMessageLogs] = useState([]);
    const [sending, setSending] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchContacts();
        fetchMessageLogs();
    }, []);

    const fetchContacts = async () => {
        try {
            const data = await contactAPI.getAll(user.userId);
            setContacts(data);
        } catch {
            // Error fetching contacts
        }
    };

    const fetchMessageLogs = async () => {
        try {
            const data = await messageAPI.getLogs(user.userId);
            setMessageLogs(data);
        } catch {
            // Error fetching message logs
        }
    };

    const toggleContact = (contactId) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleSend = async () => {
        if (selectedContacts.length === 0) {
            alert('Please select at least one contact');
            return;
        }
        if (!messageText.trim()) {
            alert('Please enter a message');
            return;
        }

        setSending(true);
        try {
            const response = await messageAPI.send(user.userId, selectedContacts, messageText, sourceLanguage);
            alert(response.message);
            setSelectedContacts([]);
            setMessageText('');
            fetchMessageLogs();
        } catch {
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getPreferredMethodShort = (method) => {
        switch ((method || '').toUpperCase()) {
            case 'EMAIL':
                return 'EML';
            case 'CALL':
                return 'CALL';
            case 'SMS':
            default:
                return 'SMS';
        }
    };

    const getPreferredLanguageShort = (language) => {
        switch ((language || '').toUpperCase()) {
            case 'HINDI':
                return 'HI';
            case 'GUJARATI':
                return 'GU';
            case 'ENGLISH':
            default:
                return 'EN';
        }
    };

    const languageOptions = [
        { key: 'ENGLISH', code: 'EN', label: 'English' },
        { key: 'HINDI', code: 'HI', label: 'Hindi' },
        { key: 'GUJARATI', code: 'GU', label: 'Gujarati' }
    ];

    const availableLabels = ['All', 'Staff', 'Chef', 'Helper', 'Supplier', 'Dealer'];

    const normalizedSearch = recipientSearch.trim().toLowerCase();
    const filteredContacts = contacts.filter((contact) => {
        // Label filter
        if (labelFilter && labelFilter !== 'All') {
            if (!Array.isArray(contact.labels) || !contact.labels.includes(labelFilter)) return false;
        }

        if (!normalizedSearch) return true;

        const name = String(contact?.name || '').toLowerCase();
        const phone = String(contact?.phone || '').toLowerCase();
        const labels = Array.isArray(contact?.labels)
            ? contact.labels.join(' ').toLowerCase()
            : String(contact?.labels || '').toLowerCase();

        return name.includes(normalizedSearch) || phone.includes(normalizedSearch) || labels.includes(normalizedSearch);
    });

    const areAllFilteredSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedContacts.includes(c.id));

    const toggleSelectAllFiltered = () => {
        if (areAllFilteredSelected) {
            // deselect filtered contacts
            setSelectedContacts(prev => prev.filter(id => !filteredContacts.some(c => c.id === id)));
        } else {
            // select all filtered contacts (merge with existing selections)
            setSelectedContacts(prev => Array.from(new Set([...prev, ...filteredContacts.map(c => c.id)])));
        }
    };

    return (
        <div className="messages-page">
            {/* Header */}
            <div className="messages-page-header">
                <div className="header-content">
                    <h1 className="page-title">💬 Messaging</h1>
                    <p className="page-description">
                        Broadcast messaging system, NOT a chat. Select contacts and send a message to all of them. Messages are sent via their preferred method (Email or SMS).
                    </p>
                </div>
                <button
                    className="history-toggle-btn"
                    onClick={() => setShowHistory(!showHistory)}
                >
                    📜 {showHistory ? 'Hide' : 'View'} History
                </button>
            </div>

            {/* Main Content */}
            <div className="messages-main">
                {/* Message Template Section */}
                <div className="template-section">
                    <h2 className="section-title">✉️ Message Template</h2>
                    
                    {/* Language Selection */}
                    <div className="language-selector">
                        <div className="language-header">
                            <label className="language-label">
                                <span className="language-icon">🌐</span>
                                Message Language
                            </label>
                            <span className="language-hint">
                                Recipients will receive in their preferred language
                            </span>
                        </div>
                        
                        <div className="language-options">
                            {languageOptions.map((option) => (
                                <button
                                    type="button"
                                    key={option.key}
                                    className={`language-card ${sourceLanguage === option.key ? 'selected' : ''}`}
                                    onClick={() => setSourceLanguage(option.key)}
                                    title={option.label}
                                >
                                    <span className="language-code">{option.code}</span>
                                    <span className="language-check">{sourceLanguage === option.key ? '✓' : ''}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        className="message-textarea"
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        rows={6}
                    />
                    <button
                        className="send-button"
                        onClick={handleSend}
                        disabled={sending || selectedContacts.length === 0}
                    >
                        ✈️ {sending ? 'Sending...' : `Send to ${selectedContacts.length} Contact(s)`}
                    </button>
                </div>

                {/* Select Recipients Section */}
                <div className="recipients-section">
                    <h2 className="section-title">👥 Select Recipients</h2>
                    <p className="section-subtitle">
                        Select Contacts ({selectedContacts.length} selected)
                    </p>

                    <div className="recipient-search-wrap">
                        <input
                            type="text"
                            className="recipient-search-input"
                            placeholder="Search contacts by name, phone, or label..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                        />
                    </div>

                    {/* Label filter buttons and select-all for filtered contacts */}
                    <div
                        className="recipients-controls"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}
                    >
                        <div className="label-filter-buttons" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {availableLabels.map(lbl => (
                                <button
                                    key={lbl}
                                    type="button"
                                    className={`filter-pill ${labelFilter === lbl ? 'active' : ''}`}
                                    onClick={() => setLabelFilter(lbl)}
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: filteredContacts.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={areAllFilteredSelected}
                                    disabled={filteredContacts.length === 0}
                                    onChange={toggleSelectAllFiltered}
                                />
                                Select all ({filteredContacts.length})
                            </label>
                        </div>
                    </div>

                    <div className="recipients-grid">
                        {filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                className={`recipient-card ${selectedContacts.includes(contact.id) ? 'selected' : ''}`}
                                onClick={() => toggleContact(contact.id)}
                            >
                                <input
                                    type="checkbox"
                                    className="recipient-checkbox"
                                    checked={selectedContacts.includes(contact.id)}
                                    onChange={() => { }}
                                />
                                <div className="recipient-avatar">
                                    {getInitials(contact.name)}
                                </div>
                                <div className="recipient-info">
                                    <div className="recipient-name-row">
                                        <div className="recipient-name">{contact.name}</div>
                                        <div className="recipient-meta-badges">
                                            <span className="recipient-meta-pill">M:{getPreferredMethodShort(contact.preferredContactMethod)}</span>
                                            <span className="recipient-meta-pill">L:{getPreferredLanguageShort(contact.preferredLanguage)}</span>
                                        </div>
                                    </div>
                                    <div className="recipient-phone">{contact.phone}</div>
                                    {contact.labels && contact.labels.length > 0 && (
                                        <div className="recipient-labels">
                                            {contact.labels.map(label => (
                                                <span key={label} className="recipient-label">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filteredContacts.length === 0 && (
                            <div className="recipient-empty-state">
                                No contacts matched your search.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Message History Modal/Panel */}
            <Modal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                showHeader={false}
                className="!p-0 !max-w-[700px] overflow-hidden"
            >
                <div className="history-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="history-header">
                        <h2 className="history-title">📜 Message History</h2>
                        <button
                            className="history-close-btn"
                            onClick={() => setShowHistory(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="history-content">
                        {messageLogs.length === 0 ? (
                            <div className="history-empty">
                                <div className="empty-icon">💬</div>
                                <p className="empty-text">No messages sent yet</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {messageLogs.map(log => (
                                    <div key={log.id} className="history-item">
                                        <div className="history-item-header">
                                            <span className="history-recipient">{log.contactName}</span>
                                            <span className="history-time">
                                                {new Date(log.sentAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="history-message">{log.messageText}</p>
                                        <div className="history-item-footer">
                                            <span className="history-method">
                                                {log.contactMethod === 'EMAIL' ? '📧 EMAIL' :
                                                    log.contactMethod === 'CALL' ? '📞 CALL' : '📱 SMS'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Messages;
