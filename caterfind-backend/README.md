# CaterFind Backend

Spring Boot backend for the CaterFind catering management system.

## 🚀 Quick Start

### Prerequisites
- Java 21+
- MySQL 8.0+
- Maven 3.6+

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/CaterFind.git
   cd CaterFind/caterfind-backend
   ```

2. **Set up MySQL Database**
   ```sql
   CREATE DATABASE caterfind;
   ```

3. **Configure Credentials (IMPORTANT!)**

   Create a file named `application-local.properties` in `src/main/resources/`:

   ```properties
   # Database
   spring.datasource.url=jdbc:mysql://localhost:3306/caterfind?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD

   # Twilio (Get from https://console.twilio.com/)
   twilio.accountSid=YOUR_TWILIO_ACCOUNT_SID
   twilio.authToken=YOUR_TWILIO_AUTH_TOKEN
   twilio.phoneNumber=YOUR_TWILIO_PHONE_NUMBER

   # Gmail SMTP (Generate App Password at https://myaccount.google.com/apppasswords)
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-gmail-app-password
   ```

   **Note:** The `application-local.properties` file is automatically ignored by Git and will never be committed.

4. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

## 📁 Project Structure

```
caterfind-backend/
├── src/main/java/org/caterfind/
│   ├── config/          # Configuration classes (Twilio, etc.)
│   ├── controller/      # REST API controllers
│   ├── dto/             # Data Transfer Objects
│   ├── entity/          # JPA entities
│   ├── repository/      # JPA repositories
│   ├── service/         # Business logic services
│   └── Main.java        # Application entry point
├── src/main/resources/
│   ├── application.properties         # Template with placeholders
│   └── application-local.properties   # Your real credentials (gitignored)
└── pom.xml              # Maven dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login

### Dashboard
- `GET /dashboard/summary?catererId={id}` - Get dashboard stats

### Contacts
- `GET /contacts?catererId={id}` - Get all contacts
- `POST /contacts?catererId={id}` - Create contact
- `PUT /contacts/{id}` - Update contact
- `DELETE /contacts/{id}` - Delete contact

### Inventory
- `GET /inventory?catererId={id}` - Get all inventory items
- `GET /inventory/low-stock?catererId={id}` - Get low stock items
- `POST /inventory?catererId={id}` - Create item
- `PUT /inventory/{id}` - Update item
- `DELETE /inventory/{id}` - Delete item

### Messages
- `POST /messages/send?catererId={id}` - Send broadcast message
- `GET /messages/logs?catererId={id}` - Get message history

## 🔐 Security Notes

- **Never commit `application-local.properties`** - It contains your real credentials
- The main `application.properties` file has placeholder values safe for GitHub
- For production deployment, use environment variables or a secrets manager

## 🛠️ Technologies Used

- **Spring Boot 2.7.18** - Backend framework
- **Spring Data JPA** - Database ORM
- **MySQL** - Database
- **Twilio SDK** - SMS messaging
- **JavaMail** - Email messaging
- **Maven** - Build tool

## 📧 Messaging Features

The application supports both **Email** and **SMS** messaging:

- **Email**: Uses Gmail SMTP (requires App Password)
- **SMS**: Uses Twilio API (trial account works for verified numbers)

Each contact has a preferred contact method, and messages are automatically routed to the correct service.

## 👥 Team Setup

When a teammate clones this repository:

1. They create their own `application-local.properties` with their credentials
2. They never commit this file (it's in `.gitignore`)
3. They can use their own Twilio/Gmail accounts for testing

## 📝 License

This is a college project for educational purposes.
