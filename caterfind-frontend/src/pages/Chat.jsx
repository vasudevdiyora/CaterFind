import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, ArrowLeft, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import { chatAPI } from '../services/api'; 
import '../styles/Messages.css';

/**
 * Real-time Chat Component
 * WebSocket + REST hybrid messaging for both clients and caterers
 */
const Chat = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // WebSocket hook
    const { isConnected, lastMessage } = useWebSocket(user?.userId);

    // Initial Load
    useEffect(() => {
        if (user?.userId) {
            loadConversations();
        }
    }, [user]);

    // Handle incoming WebSocket messages
    useEffect(() => {
        if (lastMessage) {
            const { senderId, recipientId, content, timestamp } = lastMessage;
            
            // 1. If we are in the active conversation, append the message
            const currentPartnerId = selectedConversation?.partner?.id;
            
            if (currentPartnerId && (
                (senderId === user.userId && recipientId === currentPartnerId) ||
                (senderId === currentPartnerId && recipientId === user.userId)
            )) {
                setMessages(prev => {
                    // Avoid duplicates if we optimistically added it
                    const exists = prev.some(m => m.timestamp === timestamp && m.content === content);
                    if (exists) return prev;
                    return [...prev, lastMessage];
                });
                scrollToBottom();
            }

            // 2. Always refresh conversation list to update "last message" snippet and unread counts
            loadConversations(); 
        }
    }, [lastMessage, selectedConversation, user.userId]);

    // Handle Navigation from other pages (e.g. "Message" button on request)
    useEffect(() => {
        if (location.state?.openConversationWith) {
            const targetId = location.state.openConversationWith;
            const targetName = location.state.clientName || location.state.catererName || 'User';
            
            // Check if conversation exists
            const existing = conversations.find(c => c.partner?.id === targetId);
            
            if (existing) {
                handleSelectConversation(existing);
            } else {
                // Create temporary conversation
                const tempConv = {
                    partner: { id: targetId, name: targetName },
                    messages: []
                };
                setSelectedConversation(tempConv);
                setMessages([]);
            }
            
            // Clear state
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, conversations, navigate]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const data = await chatAPI.getConversations();
            // Ensure data structure matches what we expect
            // API should return [{ partner: {id, name, ...}, lastMessage: {...} }]
            setConversations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load conversations", error);
        }
    };

    const loadMessages = async (partnerId) => {
        try {
            setLoading(true);
            const data = await chatAPI.getMessages(partnerId);
            setMessages(Array.isArray(data) ? data : []);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        if (conversation.partner?.id) {
            loadMessages(conversation.partner.id);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversation) return;

        const partnerId = selectedConversation.partner.id;
        const tempId = Date.now();
        
        const newMessage = {
            id: tempId,
            senderId: user.userId,
            recipientId: partnerId,
            content: messageText.trim(),
            timestamp: new Date().toISOString(),
            status: 'sent' // optimistic
        };

        // Optimistic update
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');

        try {
            // Send via API (REST) for persistence + WebSocket trigger logic on backend
            // OR use WebSocket directly if backend supports it. 
            // The previous logic used API for persistence.
            await chatAPI.sendMessage({
                recipientId: partnerId,
                content: newMessage.content
            });
            
            // If using pure WebSocket without REST persistence for sending:
            // sendMessage(partnerId, newMessage.content); 

            // Refresh conversations to show this as last message
            loadConversations();
        } catch (error) {
            console.error("Failed to send message", error);
            // Mark message as failed?
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.partner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Page Header */}
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
                <p className="text-slate-500 mt-1">Chat specific client or caterers.</p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                
                {/* Sidebar (Conversation List) */}
                <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-100 bg-slate-50/50`}>
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                {isConnected ? 'Live' : 'Offline'}
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <MessageSquare className="mx-auto mb-2 opacity-50" size={32} />
                                <p className="text-sm">No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv, index) => (
                                <button
                                    key={conv.partner?.id || index}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-white hover:shadow-sm transition-all border-b border-slate-100 ${selectedConversation?.partner?.id === conv.partner?.id ? 'bg-white shadow-sm border-l-4 border-l-primary' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0">
                                        {conv.partner.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-semibold text-slate-700 truncate">{conv.partner.name}</span>
                                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                {formatTime(conv.lastMessage?.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">
                                            {conv.lastMessage?.senderId === user.userId && 'You: '}
                                            {conv.lastMessage?.content || 'Started a conversation'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`${!selectedConversation ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-slate-50/30`}>
                    {!selectedConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare size={40} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600">Select a conversation</h3>
                            <p className="max-w-xs text-center mt-2 text-slate-400">Choose a contact from the sidebar to start messaging instantly.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
                                <button 
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                                    {selectedConversation.partner?.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">{selectedConversation.partner?.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        {isConnected ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> : <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                                        {isConnected ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === user.userId;
                                    return (
                                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-5 py-3 shadow-sm ${
                                                isMe 
                                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'opacity-80' : 'text-slate-400'}`}>
                                                    <span>{formatTime(msg.timestamp)}</span>
                                                    {isMe && (
                                                        msg.status === 'sent' ? <Check size={12} /> : <CheckCheck size={12} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-slate-200">
                                <div className="flex gap-2 max-w-4xl mx-auto">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim()}
                                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
