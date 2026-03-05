import React, { useState, useEffect } from 'react';
import { messageAPI, contactAPI } from '../services/api';
import '../styles/Messages.css';

/**
 * Messages Page Component (Premium Design)
 * 
 * Broadcast messaging interface with recipient selection cards
 * and toggleable message history.
 */
function Messages({ user }) {
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
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
        } catch (error) {
            // Error fetching contacts
        }
    };

    const fetchMessageLogs = async () => {
        try {
            const data = await messageAPI.getLogs(user.userId);
            setMessageLogs(data);
        } catch (error) {
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
        } catch (error) {
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
                {/* Select Recipients Section */}
                <div className="recipients-section">
                    <h2 className="section-title">👥 Select Recipients</h2>
                    <p className="section-subtitle">
                        Select Contacts ({selectedContacts.length} selected)
                    </p>

                    <div className="recipients-grid">
                        {contacts.map(contact => (
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
                                    <div className="recipient-name">{contact.name}</div>
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
                    </div>
                </div>

                {/* Message Template Section */}
                <div className="template-section">
                    <h2 className="section-title">✉️ Message Template</h2>
                    
                    {/* Language Selection */}
                    <div className="language-selector">
                        <label className="language-label">📝 Message Language:</label>
                        <select 
                            className="language-dropdown"
                            value={sourceLanguage}
                            onChange={e => setSourceLanguage(e.target.value)}
                        >
                            <option value="ENGLISH">🇬🇧 English</option>
                            <option value="HINDI">🇮🇳 Hindi (हिंदी)</option>
                            <option value="GUJARATI">🇮🇳 Gujarati (ગુજરાતી)</option>
                        </select>
                        <span className="language-hint">
                            Recipients will receive in their preferred language
                        </span>
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
            </div>

            {/* Message History Modal/Panel */}
            {showHistory && (
                <div className="history-overlay" onClick={() => setShowHistory(false)}>
                    <div className="history-panel" onClick={e => e.stopPropagation()}>
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
                </div>
            )}
        </div>
    );
}

export default Messages;
