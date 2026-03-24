import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Send, ArrowLeft, MessageSquare, User } from 'lucide-react';
import { chatAPI } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import '../styles/Messages.css';

const ClientMessages = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const { lastMessage, isConnected } = useWebSocket(user?.userId);

    useEffect(() => {
        loadConversations();
    }, [user]);

    useEffect(() => {
        if (lastMessage) {
            const { senderId, recipientId } = lastMessage;
            const currentPartnerId = selectedConversation?.partner.id;

            // If the message belongs to the currently open conversation, add it
            if (
                (senderId === user.userId && recipientId === currentPartnerId) ||
                (senderId === currentPartnerId && recipientId === user.userId)
            ) {
                setMessages(prev => [...prev, lastMessage]);
            }
            
            // Refresh conversation list to show new last message
            loadConversations();
        }
    }, [lastMessage]);

    useEffect(() => {
        // If navigated with state to open a specific chat
        if (location.state?.openConversationWith) {
            const partnerId = location.state.openConversationWith;
            const existing = conversations.find(c => c.partner.id === partnerId);
            if (existing) {
                handleSelectConversation(existing);
            } else {
                // Create a temporary conversation object to start chatting
                const tempConversation = {
                    partner: {
                        id: partnerId,
                        name: location.state.clientName || 'New Chat',
                        avatar: '👤'
                    },
                    lastMessage: { content: 'Start a new conversation' }
                };
                setSelectedConversation(tempConversation);
                setMessages([]);
            }
            // Clear location state to prevent re-triggering
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, conversations, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await chatAPI.getConversations();
            setConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (partnerId) => {
        try {
            const data = await chatAPI.getMessages(partnerId);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load messages", error);
            setMessages([]);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.partner.id);
    };

    const handleSendMessage = async () => {
        if (messageText.trim() && selectedConversation) {
            const newMessage = {
                senderId: user.userId,
                recipientId: selectedConversation.partner.id,
                content: messageText.trim(),
                timestamp: new Date().toISOString(),
            };
            
            try {
                await chatAPI.sendMessage(newMessage);
                // The message will be added via WebSocket, but we can add it optimistically
                setMessages(prev => [...prev, newMessage]);
                setMessageText('');
                // Refresh conversations to update the last message
                loadConversations();
            } catch (error) {
                console.error("Failed to send message", error);
                alert("Could not send message. Please try again.");
            }
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="page-shell">
            <div className="messages-container">
                {/* Conversations List */}
                <div className={`conversations-sidebar ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-200">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="form-input w-full !pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? <p className="p-4 text-slate-500">Loading...</p> : conversations.map((conv) => (
                            <button
                                key={conv.partner.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`conversation-item ${selectedConversation?.partner.id === conv.partner.id ? 'active' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl flex-shrink-0">
                                    <User className="text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-slate-800 truncate">
                                            {conv.partner.name}
                                        </h3>
                                        <span className="text-xs text-slate-400 ml-2">
                                            {formatDate(conv.lastMessage?.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">
                                        {conv.lastMessage?.content}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`chat-area ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                    {selectedConversation ? (
                        <>
                            <div className="chat-header">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden icon-button"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xl">
                                    <User className="text-slate-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">
                                        {selectedConversation.partner.name}
                                    </h2>
                                    <p className={`text-xs ${isConnected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {isConnected ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`message-bubble-wrapper ${msg.senderId === user.userId ? 'sent' : 'received'}`}>
                                        <div className="message-bubble">
                                            <p>{msg.content}</p>
                                            <span className="message-timestamp">{formatDate(msg.timestamp)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-area">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="form-input flex-1"
                                    />
                                    <button onClick={handleSendMessage} className="primary-button !px-4">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                    Select a conversation
                                </h3>
                                <p className="text-slate-500">
                                    Choose a conversation from the left to start messaging.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientMessages;
