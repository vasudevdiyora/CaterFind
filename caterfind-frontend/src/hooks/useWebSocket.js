import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_ENDPOINT } from '../services/api';

/**
 * WebSocket Hook for Real-time Messaging
 * Manages STOMP over SockJS connection, message sending, and receiving
 */
const useWebSocket = (userId, userRole) => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState({});
    const [conversations, setConversations] = useState([]);
    const stompClient = useRef(null);
    const reconnectTimeout = useRef(null);

    const handleIncomingMessage = (data) => {
        switch (data.type) {
            case 'NEW_MESSAGE':
                handleNewMessage(data);
                break;
            case 'CONVERSATIONS_LIST':
                setConversations(data.conversations || []);
                break;
            case 'MESSAGE_HISTORY':
                setMessages(prev => ({
                    ...prev,
                    [data.conversationId]: data.messages || []
                }));
                break;
            case 'MESSAGE_SENT':
                console.log('Message sent confirmation');
                break;
            case 'CONVERSATION_STARTED':
                if (data.conversation) {
                    setConversations(prev => {
                        // Check if conversation already exists
                        const exists = prev.some(conv => 
                            conv.id === data.conversation.id || 
                            conv.participantId === data.conversation.participantId
                        );
                        if (exists) {
                            return prev; // Don't add duplicate
                        }
                        return [...prev, data.conversation];
                    });
                }
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    };

    const connect = useCallback(() => {
        try {
            // Create STOMP client with SockJS
            const client = new Client({
                webSocketFactory: () => new SockJS(WS_ENDPOINT),
                connectHeaders: {
                    userId: userId?.toString(),
                    role: userRole
                },
                debug: (str) => {
                    console.log('STOMP:', str);
                },
                reconnectDelay: 3000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            client.onConnect = () => {
                console.log('STOMP Connected');
                setIsConnected(true);

                // Subscribe to user-specific messages
                client.subscribe(`/user/queue/messages`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        handleIncomingMessage(data);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                });

                // Request conversation list
                client.publish({
                    destination: '/app/chat.conversations',
                    body: JSON.stringify({ userId: userId })
                });
            };

            client.onStompError = (frame) => {
                console.error('STOMP error:', frame.headers.message);
                setIsConnected(false);
            };

            client.onDisconnect = () => {
                console.log('STOMP disconnected');
                setIsConnected(false);
            };

            client.activate();
            stompClient.current = client;

        } catch (error) {
            console.error('Error creating STOMP client:', error);
        }
    }, [userId, userRole]);

    const handleNewMessage = (data) => {
        // Backend sends flat structure: { type, conversationId, senderId, text, timestamp, status }
        const conversationId = data.conversationId;
        const message = {
            id: data.id || Date.now(),
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp,
            status: data.status
        };
        
        setMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), message]
        }));
        
        // Update conversation list with new message
        setConversations(prev => 
            prev.map(conv => 
                conv.id === conversationId 
                    ? { ...conv, lastMessage: message.text, lastMessageTime: message.timestamp }
                    : conv
            )
        );
    };

    const sendMessage = useCallback((conversationId, recipientId, text) => {
        if (stompClient.current && stompClient.current.connected) {
            const message = {
                conversationId,
                senderId: userId,
                recipientId,
                text,
                timestamp: new Date().toISOString()
            };
            
            stompClient.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(message)
            });
            
            // Optimistically add message to local state
            const optimisticMessage = {
                id: Date.now(),
                senderId: userId,
                text,
                timestamp: new Date().toISOString(),
                status: 'sending'
            };
            
            setMessages(prev => ({
                ...prev,
                [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
            }));
        } else {
            console.error('STOMP client is not connected');
        }
    }, [userId]);

    const loadMessageHistory = useCallback((conversationId) => {
        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.publish({
                destination: '/app/chat.history',
                body: JSON.stringify({
                    conversationId,
                    userId
                })
            });
        }
    }, [userId]);

    const startConversation = useCallback((recipientId, recipientName, recipientRole) => {
        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.publish({
                destination: '/app/chat.start',
                body: JSON.stringify({
                    userId,
                    recipientId,
                    recipientName,
                    recipientRole
                })
            });
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            connect();
        }

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [userId, connect]);

    return {
        isConnected,
        conversations,
        messages,
        sendMessage,
        loadMessageHistory,
        startConversation
    };
};

export default useWebSocket;
