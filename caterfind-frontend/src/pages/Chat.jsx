import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Circle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';

/**
 * Real-time Chat Component
 * WebSocket-based messaging for both clients and caterers
 */
const Chat = ({ user }) => {
    const location = useLocation();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    const {
        isConnected,
        conversations,
        messages,
        sendMessage,
        loadMessageHistory,
        startConversation
    } = useWebSocket(user?.userId, user?.role);

    // Handle navigation state to auto-open conversation
    useEffect(() => {
        if (location.state?.openConversationWith) {
            const targetId = location.state.openConversationWith;
            const targetName = location.state.catererName || location.state.clientName;
            
            // Clear location state immediately to prevent re-triggering
            window.history.replaceState({}, document.title);
            
            // Find existing conversation
            const existingConv = conversations.find(
                conv => conv.participantId === targetId || conv.participantId === String(targetId)
            );
            
            if (existingConv) {
                handleSelectConversation(existingConv);
            } else if (targetName) {
                // Create a temporary conversation for immediate display
                const participantRole = location.state.catererName ? 'CATERER' : 'CLIENT';
                const tempConversation = {
                    id: `temp-${targetId}`,
                    participantId: targetId,
                    participantName: targetName,
                    participantRole: participantRole,
                    lastMessage: null,
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0
                };
                setSelectedConversation(tempConversation);
                
                // Start new conversation in background
                startConversation(targetId, targetName, participantRole);
            }
        }
    }, [location.state]);

    // Update temporary conversation when real conversation is created
    useEffect(() => {
        if (selectedConversation && String(selectedConversation.id).startsWith('temp-')) {
            // Check if a real conversation now exists for this participant
            const realConv = conversations.find(
                conv => conv.participantId === selectedConversation.participantId
            );
            if (realConv && !String(realConv.id).startsWith('temp-')) {
                setSelectedConversation(realConv);
            }
        }
    }, [conversations, selectedConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedConversation]);

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        // Don't load history for temporary conversations
        if (!String(conversation.id).startsWith('temp-')) {
            loadMessageHistory(conversation.id);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageText.trim() && selectedConversation) {
            // If it's a temporary conversation (starts with 'temp-'), create real conversation first
            if (String(selectedConversation.id).startsWith('temp-')) {
                // For now, just send the message - the backend should handle conversation creation
                // In production, you'd want to get the real conversation ID from the backend first
                const realConversationId = selectedConversation.participantId;
                sendMessage(
                    realConversationId,
                    selectedConversation.participantId,
                    messageText
                );
            } else {
                sendMessage(
                    selectedConversation.id,
                    selectedConversation.participantId,
                    messageText
                );
            }
            setMessageText('');
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.participantName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle temporary conversations - look for messages by participantId instead of temp id
    const getMessagesForConversation = (conversation) => {
        if (!conversation) return [];
        
        // If temp conversation, use participantId to find messages
        if (String(conversation.id).startsWith('temp-')) {
            return messages[conversation.participantId] || [];
        }
        
        // Normal conversation
        return messages[conversation.id] || [];
    };

    const currentMessages = getMessagesForConversation(selectedConversation);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-background border border-border rounded-lg overflow-hidden">
            {/* Conversations List */}
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-border bg-card`}>
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Messages</h2>
                        <div className="flex items-center gap-2">
                            <Circle
                                size={10}
                                className={`${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
                            />
                            <span className="text-xs text-muted-foreground">
                                {isConnected ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <User className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No conversations yet</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`w-full p-4 border-b border-border hover:bg-secondary/50 transition-colors text-left ${
                                    selectedConversation?.id === conv.id ? 'bg-secondary' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                        {conv.participantName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {conv.participantName}
                                            </h3>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {formatTime(conv.lastMessageTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {conv.lastMessage || 'No messages yet'}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="md:hidden text-muted-foreground hover:text-foreground"
                            >
                                ←
                            </button>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {selectedConversation.participantName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground">
                                    {selectedConversation.participantName}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {selectedConversation.participantRole === 'CATERER' ? 'Caterer' : 'Client'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                            {currentMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                currentMessages.map((msg, idx) => {
                                    const isOwn = msg.senderId === user.userId;
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                                                    isOwn
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-card border border-border text-foreground'
                                                }`}
                                            >
                                                <p className="text-sm break-words">{msg.text}</p>
                                                <span
                                                    className={`text-xs mt-1 block ${
                                                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder={isConnected ? "Type a message..." : "Connecting... You can type anyway"}
                                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageText.trim()}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!isConnected ? "Message will be sent when connection is restored" : "Send message"}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            {!isConnected && (
                                <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                                    <Circle size={8} className="fill-yellow-500" />
                                    Connecting to server... Messages will be sent when online.
                                </p>
                            )}
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-background">
                        <div className="text-center">
                            <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No conversation selected
                            </h3>
                            <p className="text-muted-foreground">
                                Choose a conversation to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
