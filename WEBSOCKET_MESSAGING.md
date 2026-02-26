# WebSocket Messaging System - Implementation Guide

## Overview
Real-time messaging system using WebSocket (STOMP protocol) for communication between clients and caterers.

## Backend Setup

### 1. Dependencies Added
The following dependency has been added to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### 2. To Load Dependencies
Run in the `caterfind-backend` directory:
```bash
mvn clean install
```

### 3. Files Created

#### Configuration
- **`WebSocketConfig.java`**: Configures WebSocket endpoints and message broker
  - Endpoint: `/ws/chat`
  - Uses STOMP protocol with SockJS fallback
  - Message prefixes: `/app` (client→server), `/topic` & `/queue` (server→client)

#### Controller
- **`ChatController.java`**: Handles WebSocket message routing
  - `@MessageMapping("/chat.send")` - Send messages
  - `@MessageMapping("/chat.conversations")` - Get conversation list
  - `@MessageMapping("/chat.history")` - Get message history
  - `@MessageMapping("/chat.start")` - Start new conversation

#### DTO
- **`ChatMessageDTO.java`**: Message data transfer object

### 4. WebSocket Endpoints

| Endpoint | Purpose | Request | Response |
|----------|---------|---------|----------|
| `/app/chat.send` | Send message | `{type, conversationId, senderId, recipientId, text}` | `NEW_MESSAGE` event to recipient |
| `/app/chat.conversations` | Get conversations | `{userId}` | `CONVERSATIONS_LIST` with array |
| `/app/chat.history` | Get message history | `{conversationId, userId}` | `MESSAGE_HISTORY` with messages |
| `/app/chat.start` | Start conversation | `{userId, recipientId, recipientName, recipientRole}` | `CONVERSATION_STARTED` event |

### 5. Message Types

#### Client → Server
- `SEND_MESSAGE`: Send a new message
- `GET_CONVERSATIONS`: Request user's conversations
- `GET_MESSAGE_HISTORY`: Request conversation messages
- `START_CONVERSATION`: Initiate new conversation

#### Server → Client
- `NEW_MESSAGE`: New message received
- `CONVERSATIONS_LIST`: List of user's conversations
- `MESSAGE_HISTORY`: Messages from a conversation
- `MESSAGE_SENT`: Confirmation of sent message
- `CONVERSATION_STARTED`: New conversation created

## Frontend Setup

### 1. Files Created

#### Hook
- **`useWebSocket.js`**: React hook managing WebSocket connection
  - Auto-reconnects on disconnect
  - Handles message state management
  - Provides methods: `sendMessage`, `loadMessageHistory`, `startConversation`

#### Component
- **`Chat.jsx`**: Main chat UI component
  - Split-panel layout (conversations | messages)
  - Real-time message updates
  - Online/offline status indicator
  - Auto-scroll to latest message

### 2. WebSocket Connection
The frontend connects to: `ws://localhost:8080/ws/chat?userId={userId}&role={role}`

Update this URL in `useWebSocket.js` if your backend runs on a different port.

### 3. Integration Points

#### From Client Requests Page
```javascript
// Navigate to messages with specific client
navigate('/owner/messages', { 
    state: { 
        openConversationWith: clientId,
        clientName: clientName 
    } 
});
```

#### From Caterer Detail Page
```javascript
// Navigate to messages with specific caterer
navigate('/client/messages', {
    state: {
        openConversationWith: catererId,
        catererName: catererName
    }
});
```

## Testing the System

### 1. Start Backend
```bash
cd caterfind-backend
mvn spring-boot:run
```

### 2. Start Frontend
```bash
cd caterfind-frontend
npm run dev
```

### 3. Test Flow
1. Login as Client
2. Browse caterers
3. Click on a caterer
4. Click "Message Caterer" button
5. Type and send a message

6. Login as Caterer (different browser/incognito)
7. Go to "Clients" section
8. Click "All Messages" button (top right)
9. See the conversation from the client
10. Reply to the message

### 4. Monitor WebSocket Connection
Open Browser DevTools → Network → WS (WebSocket) tab to see:
- Connection establishment
- Message frames being sent/received

## Database Schema (To Be Implemented)

### Conversations Table
```sql
CREATE TABLE conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant1_id BIGINT NOT NULL,
    participant2_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    FOREIGN KEY (participant1_id) REFERENCES users(id),
    FOREIGN KEY (participant2_id) REFERENCES users(id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

## Next Steps

### Backend
1. ✅ WebSocket configuration
2. ✅ Message routing
3. ⏳ Database persistence (currently in-memory)
4. ⏳ Message history pagination
5. ⏳ Typing indicators
6. ⏳ Read receipts
7. ⏳ File attachments

### Frontend
1. ✅ WebSocket connection management
2. ✅ Chat UI
3. ✅ Real-time messaging
4. ⏳ Message status indicators
5. ⏳ Typing indicators
6. ⏳ Image/file sharing
7. ⏳ Push notifications

## Troubleshooting

### WebSocket Connection Fails
- Check backend is running on port 8080
- Verify CORS settings in `WebSocketConfig`
- Check browser console for errors

### Messages Not Sending
- Verify WebSocket is connected (green dot in UI)
- Check browser Network tab for WebSocket frames
- Verify userId is being passed correctly

### Backend Compilation Errors
Run: `mvn clean install` to download WebSocket dependencies

## Production Considerations

1. **Security**: Add authentication to WebSocket connections
2. **Scalability**: Use Redis for message broker in multi-instance setup
3. **Persistence**: Implement database layer for messages
4. **Performance**: Add message pagination and lazy loading
5. **Monitoring**: Add logging for WebSocket connections and messages
