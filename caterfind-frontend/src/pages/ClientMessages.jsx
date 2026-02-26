import React, { useState } from 'react';
import { Search, MessageCircle, Send } from 'lucide-react';

const ClientMessages = ({ user }) => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageText, setMessageText] = useState('');

    // Mock data - replace with API calls
    const conversations = [
        {
            id: 1,
            catererName: 'Sharma Catering Services',
            lastMessage: 'Yes, we can accommodate 100 guests',
            timestamp: '10:30 AM',
            unread: 2,
            avatar: '🍽️'
        },
        {
            id: 2,
            catererName: 'Chennai Tiffin House',
            lastMessage: 'Trial session confirmed for March 20',
            timestamp: 'Yesterday',
            unread: 0,
            avatar: '🍛'
        },
        {
            id: 3,
            catererName: 'Royal Feast Caterers',
            lastMessage: 'Thank you for your inquiry',
            timestamp: '2 days ago',
            unread: 0,
            avatar: '👑'
        },
    ];

    const handleSendMessage = () => {
        if (messageText.trim()) {
            // TODO: Send message via API
            console.log('Sending:', messageText);
            setMessageText('');
        }
    };

    return (
        <div className="pb-20 -m-4 md:-m-6 h-[calc(100vh-8rem)]">
            <div className="flex h-full bg-background">
                {/* Conversations List */}
                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-border bg-card`}>
                    <div className="p-4 border-b border-border">
                        <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedChat(conv.id)}
                                className={`w-full p-4 border-b border-border hover:bg-secondary/50 transition-colors text-left ${
                                    selectedChat === conv.id ? 'bg-secondary' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                                        {conv.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {conv.catererName}
                                            </h3>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {conv.timestamp}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {conv.lastMessage}
                                            </p>
                                            {conv.unread > 0 && (
                                                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                                    {conv.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="md:hidden text-muted-foreground hover:text-foreground"
                                >
                                    ←
                                </button>
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                                    {conversations.find(c => c.id === selectedChat)?.avatar}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        {conversations.find(c => c.id === selectedChat)?.catererName}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">Active now</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                                <div className="flex justify-start">
                                    <div className="bg-card rounded-lg p-3 max-w-xs">
                                        <p className="text-sm text-foreground">
                                            Hello! I'm interested in your catering services for a wedding.
                                        </p>
                                        <span className="text-xs text-muted-foreground mt-1 block">
                                            9:45 AM
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <div className="bg-primary rounded-lg p-3 max-w-xs">
                                        <p className="text-sm text-primary-foreground">
                                            Yes, we can accommodate 100 guests
                                        </p>
                                        <span className="text-xs text-primary-foreground/70 mt-1 block">
                                            10:30 AM
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-border bg-card">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-background">
                            <div className="text-center">
                                <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
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
        </div>
    );
};

export default ClientMessages;
