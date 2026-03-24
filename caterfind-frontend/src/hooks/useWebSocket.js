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
    const [lastMessage, setLastMessage] = useState(null);
    const [lastNotification, setLastNotification] = useState(null);
    const [conversations, setConversations] = useState([]);
    const stompClient = useRef(null);
    const reconnectTimeout = useRef(null);
    // Cache of messageIds we've already acked (DELIVERED or READ) to avoid duplicates
    const ackedMessageIds = useRef(new Set());

    

    function handleNewMessage(data) {
        // Backend sends flat structure: { type, conversationId, senderId, text, timestamp, status }
        const conversationId = data.conversationId;
        // Normalize incoming message
        const incoming = {
            id: data.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            recipientId: data.recipientId,
            text: data.text,
            content: data.text,
            timestamp: (data.timestamp && typeof data.timestamp === 'string') ? data.timestamp : (data.timestamp ? data.timestamp.toString() : new Date().toISOString()),
            status: data.status || 'sent',
            clientMessageId: data.clientMessageId || null
        };

        setLastMessage(incoming);

        // Merge/reconcile into conversation messages (robust upsert using id and clientMessageId)
        setMessages(prev => {
            const convMsgs = Array.isArray(prev[conversationId]) ? [...prev[conversationId]] : [];

            // Build lookup
            const byId = new Map();
            const byClient = new Map();
            convMsgs.forEach(m => {
                if (m && m.id != null) byId.set(m.id, m);
                if (m && m.clientMessageId) byClient.set(m.clientMessageId, m);
            });

            // If incoming matches existing by id, update it
            if (incoming.id != null && byId.has(incoming.id)) {
                const idx = convMsgs.findIndex(x => x && x.id === incoming.id);
                if (idx !== -1) convMsgs[idx] = { ...convMsgs[idx], ...incoming };
            } else if (incoming.clientMessageId && byClient.has(incoming.clientMessageId)) {
                // Replace optimistic by clientMessageId
                const idx = convMsgs.findIndex(x => x && x.clientMessageId === incoming.clientMessageId);
                if (idx !== -1) convMsgs[idx] = { ...convMsgs[idx], ...incoming };
                else convMsgs.push(incoming);
            } else {
                // New message, ensure not duplicated by id
                if (!convMsgs.some(m => m && m.id === incoming.id)) convMsgs.push(incoming);
            }

            // Final dedupe by id then clientMessageId
            const seenIds = new Set();
            const seenClient = new Set();
            const deduped = [];
            convMsgs.forEach(m => {
                if (!m) return;
                if (m.id != null) {
                    if (seenIds.has(m.id)) return;
                    seenIds.add(m.id);
                    deduped.push(m);
                    return;
                }
                if (m.clientMessageId) {
                    if (seenClient.has(m.clientMessageId)) return;
                    seenClient.add(m.clientMessageId);
                    deduped.push(m);
                    return;
                }
                deduped.push(m);
            });

            deduped.sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0));

            return {
                ...prev,
                [conversationId]: deduped
            };
        });
        
        // Update conversation list with new message: update preview, unread count and move to front
        setConversations(prev => {
            const existing = Array.isArray(prev) ? [...prev] : [];

            let found = false;
            const updated = existing.map(conv => {
                if (conv.id === conversationId) {
                    found = true;
                    // If the incoming message is from another user, increment unread
                    const isFromOther = incoming.senderId !== userId;
                    const prevUnread = conv.unreadCount || 0;
                    return {
                        ...conv,
                        lastMessage: incoming.content || incoming.text,
                        lastMessageTime: incoming.timestamp,
                        lastMessageSenderId: incoming.senderId || conv.lastMessageSenderId,
                        unreadCount: isFromOther ? prevUnread + 1 : prevUnread
                    };
                }
                return conv;
            });

            // If conversation wasn't present, create a lightweight entry at the front
            if (!found) {
                const newConv = {
                    id: conversationId,
                    participantId: incoming.senderId === userId ? incoming.recipientId : incoming.senderId,
                    participantName: incoming.senderName || 'User',
                    lastMessage: incoming.content || incoming.text,
                    lastMessageTime: incoming.timestamp,
                    lastMessageSenderId: incoming.senderId,
                    unreadCount: incoming.senderId !== userId ? 1 : 0
                };
                return [newConv, ...updated];
            }

            // Move the updated conversation to the front so newest appears first
            const moved = [];
            let movedConv = null;
            updated.forEach(conv => {
                if (conv.id === conversationId) movedConv = conv;
                else moved.push(conv);
            });
            if (movedConv) return [movedConv, ...moved];
            return updated;
        });

        // Acknowledge delivery back to server (so sender can see double tick)
        try {
            if (incoming.id != null && incoming.senderId !== userId && stompClient.current && stompClient.current.connected) {
                if (!ackedMessageIds.current.has(incoming.id)) {
                    const ack = { type: 'DELIVERED', messageId: incoming.id, conversationId: incoming.conversationId, userId };
                    stompClient.current.publish({ destination: '/app/chat.ack', body: JSON.stringify(ack) });
                    ackedMessageIds.current.add(incoming.id);
                } else {
                    // already acked
                }
            }
        } catch {
            // console.error('Failed to send DELIVERED ack');
        }
    }

    const handleIncomingMessage = (data) => {
        switch (data.type) {
            case 'NEW_MESSAGE': {
                handleNewMessage(data);
                break;
            }
            case 'CONVERSATIONS_LIST': {
                const convs = data.conversations || [];

                // Only update conversation list here. History should be loaded lazily
                // when the user clicks a conversation to avoid race conditions.
                setConversations(convs);
                break;
            }
            case 'MESSAGE_HISTORY': {
                try {
                    const convId = data.conversationId;
                    const incoming = (data.messages || []).map(m => ({
                        id: m.id,
                        senderId: m.senderId,
                        recipientId: m.recipientId,
                        content: m.text,
                        text: m.text,
                        timestamp: (m.timestamp && typeof m.timestamp === 'string') ? m.timestamp : (m.timestamp ? m.timestamp.toString() : new Date().toISOString()),
                        status: m.status || 'sent',
                        clientMessageId: m.clientMessageId || null
                    }));

                    setMessages(prev => {
                        const existing = Array.isArray(prev[convId]) ? [...prev[convId]] : [];

                        // Build quick lookup maps for existing messages
                        const byId = new Map();
                        const byClientId = new Map();
                        existing.forEach(m => {
                            if (m && m.id != null) byId.set(m.id, m);
                            if (m && m.clientMessageId) byClientId.set(m.clientMessageId, m);
                        });

                        // Start from existing to avoid overwriting newer realtime messages
                        const merged = [...existing.filter(m => !(m && m.status === 'sending'))];

                        // Integrate incoming server messages
                        incoming.forEach(s => {
                            // Prefer matching by server id first
                            if (s.id != null && byId.has(s.id)) {
                                // update the existing server message entry with authoritative server data
                                const idx = merged.findIndex(x => x && x.id === s.id);
                                if (idx !== -1) merged[idx] = { ...merged[idx], ...s };
                                else merged.push(s);
                                byId.set(s.id, s);
                                if (s.clientMessageId) byClientId.set(s.clientMessageId, s);
                                return;
                            }

                            // Otherwise, match optimistic message by clientMessageId
                            if (s.clientMessageId && byClientId.has(s.clientMessageId)) {
                                const opt = byClientId.get(s.clientMessageId);
                                const idx = merged.findIndex(x => x && x.clientMessageId === s.clientMessageId);
                                if (idx !== -1) merged[idx] = { ...opt, ...s };
                                else merged.push(s);
                                if (s.id != null) byId.set(s.id, s);
                                byClientId.set(s.clientMessageId, s);
                                return;
                            }

                            // New server message - add
                            merged.push(s);
                            if (s.id != null) byId.set(s.id, s);
                            if (s.clientMessageId) byClientId.set(s.clientMessageId, s);
                        });

                        // Re-attach any optimistic messages that weren't reconciled (status === 'sending')
                        const optimistic = existing.filter(x => x && x.status === 'sending' && !(x.clientMessageId && byClientId.has(x.clientMessageId)));
                        optimistic.forEach(o => merged.push(o));

                        // Final dedupe pass by id then clientMessageId
                        const seenIds = new Set();
                        const seenClient = new Set();
                        const deduped = [];
                        merged.forEach(m => {
                            if (!m) return;
                            if (m.id != null) {
                                if (seenIds.has(m.id)) return;
                                seenIds.add(m.id);
                                deduped.push(m);
                                return;
                            }
                            if (m.clientMessageId) {
                                if (seenClient.has(m.clientMessageId)) return;
                                seenClient.add(m.clientMessageId);
                                deduped.push(m);
                                return;
                            }
                            // fallback: push
                            deduped.push(m);
                        });

                        // Sort by timestamp ascending (safe parse)
                        deduped.sort((a, b) => {
                            const ta = Date.parse(a.timestamp) || 0;
                            const tb = Date.parse(b.timestamp) || 0;
                            return ta - tb;
                        });

                        return {
                            ...prev,
                            [convId]: deduped
                        };
                    });
                    // Do not auto-send DELIVERED for history; delivery should be triggered
                    // when the client actually receives messages in real-time or when the
                    // user views the conversation. Sending here caused premature status updates.
                } catch (err) {
                    console.error('Error applying MESSAGE_HISTORY payload:', err);
                }
                break;
            }
            case 'MESSAGE_STATUS_UPDATE': {
                try {
                    const mId = data.id;
                    const convId = data.conversationId;
                    if (!mId || !convId) break;
                    setMessages(prev => {
                        const arr = Array.isArray(prev[convId]) ? [...prev[convId]] : [];
                        const idx = arr.findIndex(x => x && x.id === mId);
                        if (idx !== -1) {
                            arr[idx] = { ...arr[idx], status: data.status || arr[idx].status, deliveredAt: data.deliveredAt || arr[idx].deliveredAt, readAt: data.readAt || arr[idx].readAt };
                        }
                        return { ...prev, [convId]: arr };
                    });
                } catch (err) {
                    console.error('Error updating message status', err);
                }
                break;
            }
            case 'MESSAGE_SENT': {
                break;
            }
            case 'CONVERSATION_STARTED': {
                if (data.conversation) {
                    setConversations(prev => {
                        // If conversation exists, replace it with the updated object
                        const idx = prev.findIndex(conv => conv.id === data.conversation.id || conv.participantId === data.conversation.participantId);
                        if (idx !== -1) {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], ...data.conversation };

                            return copy;
                        }

                        return [...prev, data.conversation];
                    });
                }
                break;
            }
            default:
                
        }
    }

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const connect = useCallback(() => {
        // Prevent creating multiple concurrent clients
        if (stompClient.current && stompClient.current.connected) {
            
            return;
        }
        try {
            // Create STOMP client with SockJS
            const client = new Client({
                webSocketFactory: () => new SockJS(WS_ENDPOINT),
                connectHeaders: {
                    userId: userId?.toString(),
                    role: userRole
                },
                        debug: () => {},
                reconnectDelay: 3000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            client.onConnect = () => {
                
                // If a pending deactivate timeout exists (from a recent unmount), cancel it
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
                setIsConnected(true);

                // Subscribe to user-specific messages
                    client.subscribe(`/user/queue/messages`, (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            handleIncomingMessage(data);
                        } catch {
                                // console.error('Error parsing message:');
                        }
                    });

                // Subscribe to user-specific notifications (server sends to /user/queue/notifications)
                client.subscribe(`/user/queue/notifications`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        // Simple notification handling: expose the notification for UI and log
                        setLastNotification(data);
                    } catch {
                            // console.error('Error parsing notification:');
                    }
                });

                // Request conversation list
                client.publish({
                    destination: '/app/chat.conversations',
                    body: JSON.stringify({ userId: userId })
                });
                
            };

            client.onStompError = () => {
                // STOMP error received; keep minimal runtime behavior in production
                setIsConnected(false);
            };

            client.onDisconnect = () => {
                 // console.log('STOMP disconnected');
                setIsConnected(false);
            };

            client.onWebSocketClose = () => {
                // STOMP websocket closed
            };

            client.activate();
            stompClient.current = client;

        } catch (error) {
            console.error('Error creating STOMP client:', error);
        }
    }, [userId, userRole]);

    

    const sendMessage = useCallback((conversationId, recipientId, text) => {
        if (stompClient.current && stompClient.current.connected) {
            const clientMessageId = Date.now().toString();
            const message = {
                conversationId,
                senderId: userId,
                recipientId,
                text,
                timestamp: new Date().toISOString(),
                clientMessageId
            };
                    // console.log('[WS DEBUG] publishing /app/chat.send ->', message);
            stompClient.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(message)
            });
            
            // Optimistically add message to local state
            const optimisticMessage = {
                id: Date.now(),
                clientMessageId: clientMessageId,
                conversationId: conversationId,
                senderId: userId,
                text,
                content: text,
                timestamp: new Date().toISOString(),
                status: 'sending'
            };
            
            setMessages(prev => ({
                ...prev,
                [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
            }));
        } else {
                    // console.error('STOMP client is not connected');
        }
    }, [userId]);

    const loadMessageHistory = useCallback((conversationId) => {
                // console.log('Requesting history for:', conversationId);
        if (stompClient.current && stompClient.current.connected) {
            const body = { conversationId, userId };
                    // console.log('[WS DEBUG] publishing /app/chat.history ->', body);
            stompClient.current.publish({
                destination: '/app/chat.history',
                body: JSON.stringify(body)
            });
            // After requesting history, also request server to mark messages as delivered when history arrives
        } else {
                    // console.warn('Cannot request history, STOMP client not connected');
        }
    }, [userId]);

    /**
     * Mark all messages in a conversation as READ (send read ack for each message id)
     */
    const markConversationRead = useCallback((conversationId) => {
        try {
            const convMsgs = stompClient.current && messages ? (messages[conversationId] || []) : [];
            if (!convMsgs || convMsgs.length === 0) return;
            const toRead = convMsgs.filter(m => m && m.senderId !== userId && m.status !== 'read');
            toRead.forEach(m => {
                        try {
                            if (m.id != null && stompClient.current && stompClient.current.connected && !ackedMessageIds.current.has(m.id)) {
                                const ack = { type: 'READ', messageId: m.id, conversationId, userId };
                                stompClient.current.publish({ destination: '/app/chat.ack', body: JSON.stringify(ack) });
                                ackedMessageIds.current.add(m.id);
                            }
                        } catch (e) {
                            console.error('Failed to send READ ack for', m.id, e);
                        }
            });
            // Clear unread count locally immediately so UI updates without refresh
            try {
                setConversations(prev => (Array.isArray(prev) ? prev.map(conv => conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv) : prev));
            } catch (e) {
                console.error('Failed to clear unread count locally', e);
            }
        } catch (err) {
            console.error('markConversationRead error', err);
        }
    }, [messages, userId]);

    const startConversation = useCallback((recipientId, recipientName, recipientRole) => {
        if (stompClient.current && stompClient.current.connected) {
            const body = { userId, recipientId, recipientName, recipientRole };
                    // console.log('[WS DEBUG] publishing /app/chat.start ->', body);
            stompClient.current.publish({
                destination: '/app/chat.start',
                body: JSON.stringify(body)
            });
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            connect();
        }

        return () => {
            // WebSocket cleanup
            try {
                if (stompClient.current) {
                    stompClient.current.deactivate();
                }
            } catch (e) {
                console.error('useWebSocket: error during cleanup', e);
            }
        };
    }, [userId]);

    return {
        isConnected,
        conversations,
        messages,
        lastMessage,
        lastNotification,
        sendMessage,
        loadMessageHistory,
        startConversation,
        markConversationRead
    };
};

export default useWebSocket;
