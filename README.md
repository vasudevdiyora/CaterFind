# CaterFind

CaterFind is a multi-role platform built with Spring Boot and React to connect caterers and clients, manage operations, and support admin-level control over communication and moderation workflows.

This README documents the current implemented system behavior and architecture.

## Project Overview

CaterFind provides:
- Caterer-side operational tools (contacts, inventory, messaging, meeting lifecycle)
- Client-side discovery and request workflows
- Admin-side governance (dashboard, moderation, and platform settings)

Core platform communication is broadcast-based for operational messaging, with runtime channel controls and fail-safe fallbacks.

## Technology Stack

### Backend
- Java 17
- Spring Boot
- Spring Data JPA / Hibernate
- Maven

### Frontend
- React (Vite)
- JavaScript (JSX)
- CSS

### Data
- Relational database (MySQL configuration included)

## User Roles

- Admin
  - Dashboard monitoring
  - Caterer and client management
  - Moderation and platform settings management
- Caterer
  - Contact and inventory management
  - Broadcast communication
  - Meeting/trial request handling
- Client
  - Browse caterers
  - Create and track meeting requests

## Admin Settings System (DB-driven)

Platform settings are persisted in the `platform_settings` table and loaded dynamically at runtime.

- Storage: `PlatformSetting` entity/table
- Management: `AdminService` (`getSettings`, `saveSettings`)
- Runtime access: `SettingsService`

Implemented boolean toggles include:
- `smsEnabled`
- `callEnabled`
- `translationEnabled`
- `emailNotifications`
- `smsNotifications`

These settings are read during request execution, so behavior changes apply without application restart.

## Feature Toggles & Runtime Control

`SettingsService` reads toggle values from `PlatformSettingRepository` at runtime.

Examples:
- `translationEnabled`
  - `true`: translate outbound message by contact language
  - `false`: use original message
- `smsEnabled`
  - `true`: SMS path can be used
  - `false`: SMS path is skipped and fallback applies
- `callEnabled`
  - `true`: voice call path can be used
  - `false`: call path is skipped and fallback applies

Design principle:
- Toggle checks happen inside messaging/translation/calling services.
- No static feature behavior is hardcoded.

## Smart Messaging System

CaterFind messaging is a broadcast workflow, not a threaded chat system.

- Message mode: one outbound message to many contacts
- Supported channels:
  - `EMAIL`
  - `SMS` (Twilio)
  - `CALL` (Twilio or Exotel)
- Every successful outbound message is logged in the `messages` table (`Message` entity)

Important:
- Contact messaging is broadcast-oriented and does not implement reply-thread inbox semantics.

## Messaging Flow Architecture

For each selected contact, the backend pipeline in `MessageService` performs:

1. Detect source and target language
- Source language comes from request (default ENGLISH)
- Target language comes from contact preferred language

2. Translate message (if enabled)
- `TranslationService.translate(...)` is invoked when `translationEnabled=true`
- On disabled/failure, original message is used

3. Resolve preferred contact method
- Uses contact preference: `EMAIL`, `SMS`, or `CALL`

4. Apply runtime feature checks
- SMS path checks `smsEnabled`
- Call path checks `callEnabled`
- Email is always available as the base delivery channel

5. Execute delivery with fallback
- Preferred channel is attempted first
- If unavailable or failed, email fallback is attempted

6. Persist audit log
- Save message record in `messages` table with method/status metadata

## Fallback Strategy

Fallback logic is a critical runtime behavior in `MessageService`:

- If SMS is disabled, fallback to EMAIL
- If CALL is disabled, fallback to EMAIL
- If preferred method fails, fallback to EMAIL
- Email is treated as the guaranteed delivery channel (if available)
- EMAIL acts as the final delivery fallback when recipient email is available

Data safety guarantee:
- Contact preferences are NEVER modified or overwritten in the database
- All fallback decisions are runtime-only and non-persistent

## Translation System (OpenAI-based)

`TranslationService` provides per-contact language translation for outbound messages.

Behavior:
- If `translationEnabled=false`, original message is returned
- If source and target languages are the same, original message is returned
- If OpenAI call fails, original message is returned (fail-safe)

Supported language enum values in current code:
- ENGLISH
- HINDI
- GUJARATI

## Multi Provider Calling System

Voice calls are abstracted by `VoiceCallService` and selected by configuration:

- `app.calling.provider=twilio` -> `TwilioCallService`
- `app.calling.provider=exotel` -> `ExotelCallService`

Both providers honor `callEnabled` runtime toggle through `SettingsService`.

## External Integrations

The current implementation uses real integrations:

- Twilio
  - SMS via `SmsService`
  - Calls via `TwilioCallService`
- Exotel
  - Calls via `ExotelCallService`
- OpenAI
  - Translation via `TranslationService`
- SMTP Email
  - Email delivery via `EmailService` and Spring Mail

## Admin Panel Features

Implemented admin capabilities include:
- Dashboard stats and recent activity
- Caterer management (including status updates/approvals)
- Client overview
- Moderation report management
- Platform settings management persisted in DB

Moderation actions supported by service logic:
- Resolve
- Remove
- Dismiss (mapped to resolved state)

## Database Tables (Current)

Key tables in current system include:
- `users`
- `catering_profile`
- `contacts`
- `contact_labels`
- `contact_label_mapping`
- `inventory_items`
- `messages`
- `platform_settings`
- `moderation_reports`
- `chat_conversations`
- `meeting_requests`

## Project Structure

### Backend (`caterfind-backend`)

```text
src/main/java/org/caterfind/
├── controller/
├── dto/
├── entity/
├── repository/
├── service/
│   ├── AdminService.java
│   ├── MessageService.java
│   ├── SettingsService.java
│   ├── TranslationService.java
│   ├── VoiceCallService.java
│   ├── TwilioCallService.java
│   ├── ExotelCallService.java
│   ├── SmsService.java
│   └── EmailService.java
└── Main.java
```

### Frontend (`caterfind-frontend`)

```text
src/
├── components/
├── hooks/
├── lib/
├── pages/
├── services/
└── styles/
```

## Configuration Notes

Important runtime config examples:
- `app.calling.provider=twilio|exotel`
- Twilio credentials for SMS/call
- Exotel credentials for call provider mode
- OpenAI API key/model/url for translation
- SMTP credentials for email channel

## Production Notes

The messaging subsystem is designed with resilience and fail-safe behavior:
- Channel gates (`smsEnabled`, `callEnabled`, `translationEnabled`) are runtime-controlled
- Delivery failures degrade gracefully to email fallback
- Translation failures never block message delivery
- Outbound communication remains auditable through DB logs
- User/contact preference data is preserved during failure handling

Operational recommendation:
- Keep feature flags managed via Admin Settings to control live behavior without restarts.

## Quick Start

### Backend

```bash
cd caterfind-backend
mvn clean install
mvn spring-boot:run
```

### Frontend

```bash
cd caterfind-frontend
npm install
npm run dev
```

## Environment Variables (Reference)

Use `caterfind-backend/.env.example` as the baseline. Common values:

- Database: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Exotel: `EXOTEL_SID`, `EXOTEL_TOKEN`, `EXOTEL_API_KEY`, `EXOTEL_SUBDOMAIN`, `EXOTEL_CALLER_ID`
- OpenAI: `OPENAI_API_KEY`, `OPENAI_API_URL`, `OPENAI_MODEL`
- SMTP: `MAIL_USERNAME`, `MAIL_PASSWORD`
- Security: `JWT_SECRET`

## Summary

CaterFind currently implements a DB-driven, runtime-configurable communication architecture with translation, multi-provider calling, intelligent fallback, and admin governance capabilities ready for production-level extension and scaling.
  