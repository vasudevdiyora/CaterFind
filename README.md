# CaterFind - Catering Business Management System

## Project Overview

This is a **college project** implementing a **caterer-side only** management system for internal coordination and operations.

### ⚠️ Important Scope Clarification

This system is **NOT** a full catering platform. It is specifically designed for **caterer-side management only**.

**Implemented Features:**
- ✅ Contact Management (staff, suppliers, dealers)
- ✅ Broadcast Messaging (Email/SMS stubs)
- ✅ Inventory Tracking with Low-Stock Alerts
- ✅ Simple Dashboard with Statistics

**Intentionally Excluded Features (NOT BUGS):**
- ❌ Client Dashboard (clients can login but have no features)
- ❌ Online Booking System
- ❌ Pricing or Payment Processing
- ❌ Predefined Packages
- ❌ Event Management (client or caterer events)
- ❌ Real-time Chat (messaging is broadcast-only)
- ❌ WhatsApp Integration
- ❌ Analytics, Charts, or Graphs
- ❌ Calendar or Availability Management

---

## Technology Stack

### Backend
- **Framework:** Spring Boot 2.7.18
- **Language:** Java 17
- **ORM:** JPA / Hibernate
- **Database:** MySQL
- **Build Tool:** Maven

### Frontend
- **Framework:** React (Vite)
- **Language:** JavaScript (JSX)
- **Styling:** Plain CSS (NO UI libraries)
- **HTTP Client:** Fetch API

### Messaging
- **Email:** Stub implementation (logs to console)
- **SMS:** Stub implementation (logs to console)
- **Note:** No real API keys required

---

## Prerequisites

Before running this project, ensure you have:

1. **Java 17** installed
2. **Maven** installed
3. **MySQL** installed and running
4. **Node.js** (v16 or higher) and npm installed

---

## Setup Instructions

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE caterfind;
EXIT;
```

The database tables will be created automatically by Hibernate on first run.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd caterfind-backend

# Build the project
mvn clean install

# Run the Spring Boot application
mvn spring-boot:run
```

Backend will start on **http://localhost:8080**

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd caterfind-frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

Frontend will start on **http://localhost:5173**

---

## Default Login Credentials

### Caterer Account (Full Access)
- **Email:** admin@caterfind.com
- **Password:** admin123

### Client Account (No Dashboard - For Testing)
- **Email:** client@test.com
- **Password:** client123
- **Note:** Client login will show "Client dashboard not implemented" message (this is expected behavior)

---

## System Features

### 1. Login Page
- Email and password authentication
- Role-based routing:
  - **CATERER** → Dashboard (full access)
  - **CLIENT** → "Not implemented" message

### 2. Dashboard
- **Total Contacts** count
- **Low Stock Items** count
- **Total Messages Sent** count
- **NO charts, graphs, or analytics** (simple stat cards only)

### 3. Contact Management
- Add, Edit, Delete contacts
- Multi-select labels: Staff, Chef, Helper, Supplier, Dealer
- Preferred contact method: Email or SMS
- **Note:** These are internal contacts, NOT client event contacts

### 4. Messaging Module
- Select multiple contacts via checkboxes
- Compose and send broadcast messages
- Messages sent via preferred contact method (Email or SMS)
- View message history (audit log)
- **CRITICAL:** This is NOT a chat system - no threading, no replies, no inbox

### 5. Inventory Management
- Add, Edit, Delete inventory items
- Categories: Grain, Vegetable, Meat, Dairy, Masala, Oil, Other
- Automatic low-stock detection (quantity < minimum threshold)
- Optional dealer assignment from contacts
- **Note:** NO billing, invoicing, or purchase orders

### 6. My Business
- View-only business profile page
- Displays: Business name, phone, address
- **Note:** Editing not implemented in this version

---

## API Endpoints

### Authentication
- `POST /auth/login` - User login

### Dashboard
- `GET /dashboard/summary?catererId={id}` - Get dashboard stats

### Contacts
- `GET /contacts?catererId={id}` - List all contacts
- `POST /contacts?catererId={id}` - Create contact
- `PUT /contacts/{id}` - Update contact
- `DELETE /contacts/{id}` - Delete contact

### Inventory
- `GET /inventory?catererId={id}` - List all inventory
- `GET /inventory/low-stock?catererId={id}` - List low-stock items
- `POST /inventory?catererId={id}` - Create item
- `PUT /inventory/{id}` - Update item
- `DELETE /inventory/{id}` - Delete item

### Messages
- `POST /messages/send?catererId={id}` - Send broadcast message
- `GET /messages/logs?catererId={id}` - View message history

---

## Database Schema

### Tables
1. **users** - User authentication (CATERER/CLIENT roles)
2. **catering_profile** - Caterer business information
3. **contacts** - Caterer's contacts (staff, suppliers, etc.)
4. **contact_labels** - Predefined labels (Staff, Chef, Helper, Supplier, Dealer)
5. **contact_label_mapping** - Many-to-many relationship between contacts and labels
6. **inventory_items** - Inventory tracking with low-stock detection
7. **messages** - Message audit log (broadcast messaging)

---

## Project Structure

### Backend (`caterfind-backend/`)
```
src/main/java/org/caterfind/
├── Main.java                    # Spring Boot entry point
├── entity/                      # JPA entities
│   ├── User.java
│   ├── CateringProfile.java
│   ├── Contact.java
│   ├── ContactLabel.java
│   ├── InventoryItem.java
│   └── Message.java
├── repository/                  # JPA repositories
├── service/                     # Business logic
│   ├── AuthService.java
│   ├── DashboardService.java
│   ├── ContactService.java
│   ├── InventoryService.java
│   ├── MessageService.java
│   ├── EmailService.java        # Stub (logs to console)
│   └── SmsService.java          # Stub (logs to console)
├── controller/                  # REST controllers
└── dto/                         # Data Transfer Objects
```

### Frontend (`caterfind-frontend/`)
```
src/
├── App.jsx                      # Main app with routing
├── components/
│   └── Sidebar.jsx              # Navigation sidebar
├── pages/
│   ├── Login.jsx                # Login page
│   ├── Dashboard.jsx            # Dashboard with stats
│   ├── Contacts.jsx             # Contact management
│   ├── Inventory.jsx            # Inventory management
│   ├── Messages.jsx             # Broadcast messaging
│   └── MyBusiness.jsx           # Business profile
├── services/
│   └── api.js                   # API service layer
└── styles/                      # Plain CSS files
```

---

## Why Features Are Missing

This is a **partial submission** for a college project. The scope is intentionally limited to **caterer-side management only**.

### Client Dashboard
- **Why missing:** Out of scope for this phase
- **Future:** Could be implemented in next phase

### Booking & Payments
- **Why missing:** Requires complex business logic, payment gateway integration
- **Future:** Would need Stripe/Razorpay integration

### Real-time Chat
- **Why missing:** Requires WebSocket infrastructure
- **Current:** Simple broadcast messaging is sufficient for internal coordination

### Analytics & Charts
- **Why missing:** Out of scope for MVP
- **Current:** Simple stat counts are sufficient

---

## Testing the System

### 1. Test Login
- Login as caterer: `admin@caterfind.com` / `admin123`
- Verify dashboard loads with sidebar

### 2. Test Contact Management
- Add a contact with name, phone, email
- Select labels (e.g., "Staff", "Chef")
- Set preferred contact method
- Edit and delete contact

### 3. Test Messaging
- Go to Messages page
- Select 2+ contacts via checkboxes
- Type a message
- Click Send
- Check backend console for stub email/SMS logs

### 4. Test Inventory
- Add an inventory item (e.g., "Rice", category "Grain", quantity 5, threshold 10)
- Verify it shows as "Low Stock" in table
- Check dashboard shows updated low-stock count

### 5. Test Client Login Rejection
- Logout
- Login as client: `client@test.com` / `client123`
- Verify "Client dashboard not implemented" message appears

---

## Notes for Evaluators

1. **Passwords are plain text** - This is intentional for college project simplicity. In production, use BCrypt.

2. **No JWT tokens** - Simple session-based auth for simplicity. In production, use JWT.

3. **Email/SMS are stubs** - They log to console instead of sending real messages. No API keys needed.

4. **Client dashboard is intentionally missing** - This is NOT a bug. The project scope is caterer-side only.

5. **Messaging is NOT a chat** - It's broadcast-only. No threading, no replies, no inbox.

6. **All code is extensively commented** - Every class, method, and component has comments explaining purpose and design decisions.

---

## Future Enhancements (Out of Scope)

If this project were to be extended:
- Client dashboard with event requests
- Online booking system
- Payment gateway integration
- Real-time chat with WebSockets
- Analytics dashboard with charts
- Mobile app (React Native)
- Email/SMS integration with real APIs

---

## License

This is a college project for educational purposes.

---

## Contact

For questions about this project, contact the development team.