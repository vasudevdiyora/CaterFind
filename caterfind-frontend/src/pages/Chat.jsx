import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, ArrowLeft, MessageSquare, Check, CheckCheck } from 'lucide-react';
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
    // conversations are provided by the websocket hook (wsConversations)
    const [selectedConversation, setSelectedConversation] = useState(null);
    // Messages are sourced from WebSocket state (`wsMessages`) only
    // const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingLoadConv, setPendingLoadConv] = useState(null);
    const messagesEndRef = useRef(null);


    

    // WebSocket hook - use full API (conversations/messages are provided by hook)
    const { isConnected, lastMessage, conversations: wsConversations, messages: wsMessages, loadMessageHistory, sendMessage: sendViaWS, startConversation, markConversationRead } = useWebSocket(user?.userId, user?.role);

    // Use websocket messages as single source of truth
    const currentMessages = wsMessages?.[selectedConversation?.id] || [];

    // Conversations are supplied by `wsConversations` from the hook; no local REST fallback
    useEffect(() => {
        // keep effect for potential side-effects when lastMessage arrives
    }, [lastMessage]);

    // Helper: scroll to bottom of messages list
    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // Load messages helper (can be called before websocket connection)
    async function loadMessages(conversationOrPartner) {
        try {
            const convId = conversationOrPartner?.id || conversationOrPartner;
            if (convId && !isConnected) {
                setPendingLoadConv(convId);
                return;
            }
            if (convId && loadMessageHistory) {
                await loadMessageHistory(convId);
            } else if (conversationOrPartner && conversationOrPartner.partner) {
                const partnerId = conversationOrPartner.partner.id;
                const found = (wsConversations || []).find(c => c.participantId === partnerId || c.participantId?.toString() === partnerId?.toString());
                if (found) await loadMessageHistory(found.id);
            }
            scrollToBottom();
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    }

    // Select a conversation and request history
    function handleSelectConversation(conv) {
        setSelectedConversation(conv);

        if (conv && conv.id) {
            loadMessages(conv.id);
            try { markConversationRead(conv.id); } catch (e) { console.error(e); }
        } else {
            console.error('Conversation ID missing!', conv);
        }
    }

    // Handle Navigation from other pages (e.g. "Message" button on request)
    useEffect(() => {
        if (location.state?.openConversationWith) {
            const targetId = location.state.openConversationWith;
            const targetName = location.state.clientName || location.state.catererName || 'User';

            // Try to find an existing conversation in websocket-provided list first
            const existingWs = (wsConversations || []).find(c => c.participantId === targetId || c.participantId?.toString() === targetId?.toString());

            const t = setTimeout(() => {
                if (existingWs) {
                    const conv = {
                        id: existingWs.id,
                        partner: { id: existingWs.participantId, name: existingWs.participantName },
                        lastMessage: { content: existingWs.lastMessage }
                    };
                    handleSelectConversation(conv);
                } else {
                    const tempConv = { partner: { id: targetId, name: targetName } };
                    setSelectedConversation(tempConv);
                    startConversation(targetId, targetName, 'CLIENT');
                }

                // Clear state
                navigate(location.pathname, { replace: true });
            }, 0);

            return () => clearTimeout(t);
        }
    }, [location.state, wsConversations, navigate]);

    // removed local `messages` state; scrolling handled by scrollToBottom

    // When websocket messages for the selected conversation update, mark them as read
    useEffect(() => {
        try {
            const convId = selectedConversation?.id;
            if (!convId) return;
            const msgs = wsMessages?.[convId] || [];
            if (!msgs || msgs.length === 0) return;
            const unread = msgs.filter(m => m && m.senderId !== user.userId && m.status !== 'read');
            if (unread.length > 0) {
                try { markConversationRead(convId); } catch (e) { console.error(e); }
            }
        } catch (err) {
            console.error('Error in mark-as-read effect', err);
        }
    }, [wsMessages, selectedConversation, markConversationRead, user.userId]);

    // When websocket becomes connected, trigger any pending history load
    useEffect(() => {
        if (isConnected && pendingLoadConv) {
            // WebSocket connected — loading pending conversation history
            const t = setTimeout(() => {
                if (pendingLoadConv.id) loadMessages(pendingLoadConv.id);
                else loadMessages(pendingLoadConv);
                setPendingLoadConv(null);
            }, 0);
            return () => clearTimeout(t);
        }
    }, [isConnected, pendingLoadConv]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversation) return;

        const convId = selectedConversation.id;
        const partnerId = selectedConversation.partner?.id;

        const tempId = Date.now();
        const newMessage = {
            id: tempId,
            senderId: user.userId,
            recipientId: partnerId,
            content: messageText.trim(),
            timestamp: new Date().toISOString(),
            status: 'sending'
        };

        // Clear input immediately; rely on server/websocket to update messages
        setMessageText('');

        try {
            // Prefer WebSocket send if available
            if (sendViaWS && convId) {
                sendViaWS(convId, partnerId, newMessage.content);
            } else if (sendViaWS && partnerId) {
                // If conversation does not have id, send a temporary placeholder by using
                // recipientId as the conversationId so the server can create the conversation.
                sendViaWS(partnerId, partnerId, newMessage.content);
            } else {
                // Fallback to REST
                await chatAPI.sendMessage({ recipientId: partnerId, content: newMessage.content });
            }

            // conversations will update via websocket; no explicit reload needed
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const mappedConversations = (wsConversations || []).map(c => ({
        id: c.id,
        partner: { id: c.participantId, name: c.participantName, role: c.participantRole },
        lastMessage: { content: c.lastMessage, timestamp: c.lastMessageTime, senderId: c.lastMessageSenderId || null },
        unreadCount: c.unreadCount || 0
    }));

    const filteredConversations = mappedConversations.filter(conv =>
        conv.partner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-7.5rem)]">
            {/* Page Header */}
            <div className="mb-4 sm:mb-6 flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">Chat with clients and caterers in real time.</p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                
                {/* Sidebar (Conversation List) */}
                <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-200 bg-slate-50/40`}>
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
                                className="w-full h-9 pl-9 pr-4 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition-all font-medium text-slate-700 placeholder:text-slate-400"
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
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={(e) => { e.stopPropagation(); handleSelectConversation(conv); }}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-white hover:shadow-sm transition-all border-b border-slate-100 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-white shadow-sm border-l-4 border-l-sky-500' : ''}`}
                                    style={{ zIndex: 9999 }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold flex-shrink-0">
                                        {conv.partner.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-semibold text-slate-700 truncate">{conv.partner.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{formatTime(conv.lastMessage?.timestamp)}</span>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                                                    )}
                                                </div>
                                        </div>
                                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
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
                            <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
                                <button 
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm">
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
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30">
                                {currentMessages.map((msg, index) => {
                                    const isMe = msg.senderId === user.userId;
                                    const key = msg.id || msg.clientMessageId || index;
                                    return (
                                        <div key={key} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] md:max-w-[65%] rounded-2xl px-4 sm:px-5 py-3 shadow-sm ${
                                                isMe 
                                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'opacity-80' : 'text-slate-400'}`}>
                                                    <span>{formatTime(msg.timestamp)}</span>
                                                    {isMe && (
                                                        msg.status === 'sending' ? <Check size={12} /> : (
                                                            msg.status === 'sent' ? <Check size={12} /> : (
                                                                msg.status === 'delivered' ? <CheckCheck size={12} /> : (
                                                                    // read
                                                                    <CheckCheck size={12} className="text-sky-500" />
                                                                )
                                                            )
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 sm:p-5 bg-white border-t border-slate-200">
                                <div className="flex gap-2 max-w-4xl mx-auto">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 h-11 px-4 bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim()}
                                        className="h-11 w-11 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
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
