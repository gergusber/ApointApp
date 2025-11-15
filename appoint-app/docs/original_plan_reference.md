# Multi-Business Appointments Booking System - Project Plan

## Overview

A comprehensive appointments booking platform that allows multiple businesses to manage their services, appointments, and customer interactions. Users can discover businesses, book appointments, and manage their schedules, while business owners can manage services, availability, and appointments.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Validation**: Zod
- **State Management**: React Context + Server State via Server Components

### Backend
- **API**: Next.js API Routes (Route Handlers)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Clerk
- **File Storage**: TBD (Cloudinary/S3 for business images)

### DevOps
- **Deployment**: Vercel (or similar)
- **Database Hosting**: Supabase/Railway/Neon
- **Environment Management**: .env files with validation

---

## Database Schema Design

### Core Entities

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USER MANAGEMENT ====================

enum UserRole {
  USER          // Regular user who books appointments
  BUSINESS      // Business owner
  ADMIN         // Platform admin
}

model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique // Clerk authentication ID
  email         String    @unique
  firstName     String?
  lastName      String?
  phone         String?
  role          UserRole  @default(USER)
  avatar        String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  businesses    Business[]
  appointments  Appointment[]
  reviews       Review[]
  
  @@index([clerkId])
  @@index([email])
}

// ==================== BUSINESS MANAGEMENT ====================

enum BusinessStatus {
  DRAFT         // Being set up
  ACTIVE        // Live and accepting appointments
  PAUSED        // Temporarily not accepting appointments
  SUSPENDED     // Admin suspended
}

model Business {
  id            String          @id @default(cuid())
  slug          String          @unique // URL-friendly identifier
  name          String
  description   String?         @db.Text
  logo          String?
  coverImage    String?
  
  // Contact Information
  email         String
  phone         String
  website       String?
  
  // Address
  addressLine1  String
  addressLine2  String?
  city          String
  state         String
  zipCode       String
  country       String         @default("USA")
  latitude      Float?
  longitude     Float?
  
  // Business Settings
  status        BusinessStatus @default(DRAFT)
  timezone      String         @default("America/New_York")
  currency      String         @default("USD")
  
  // Booking Settings
  requireDeposit        Boolean  @default(false)
  depositPercentage     Float?   // 0-100
  cancellationPolicy    String?  @db.Text
  bookingBufferMinutes  Int      @default(0) // Min time before appointment can be booked
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  services      Service[]
  professionals Professional[]
  businessHours BusinessHours[]
  blockedDates  BlockedDate[]
  appointments  Appointment[]
  reviews       Review[]
  
  @@index([slug])
  @@index([ownerId])
  @@index([status])
}

// ==================== SERVICES ====================

enum ServiceStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

model Service {
  id            String        @id @default(cuid())
  name          String
  slug          String        // Unique within business
  description   String?       @db.Text
  image         String?
  
  // Pricing
  price         Float
  currency      String        @default("USD")
  depositAmount Float?        // Override business deposit
  
  // Duration
  durationMinutes Int
  bufferMinutes   Int         @default(0) // Time between appointments
  
  // Settings
  status        ServiceStatus @default(ACTIVE)
  maxAdvanceBookingDays Int?  // How far in advance can be booked
  minAdvanceBookingHours Int? // Minimum notice required
  
  // Display
  displayOrder  Int          @default(0)
  featured      Boolean      @default(false)
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  // Relations
  businessId    String
  business      Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  appointments  Appointment[]
  professionals ServiceProfessional[]
  
  @@unique([businessId, slug])
  @@index([businessId])
  @@index([status])
}

// ==================== PROFESSIONALS (Future Phase) ====================

model Professional {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String?
  phone         String?
  bio           String?   @db.Text
  avatar        String?
  
  // Settings
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  services      ServiceProfessional[]
  appointments  Appointment[]
  availability  ProfessionalAvailability[]
  
  @@index([businessId])
}

// Junction table for many-to-many relationship
model ServiceProfessional {
  id              String        @id @default(cuid())
  
  serviceId       String
  service         Service       @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  
  professionalId  String
  professional    Professional  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime      @default(now())
  
  @@unique([serviceId, professionalId])
  @@index([serviceId])
  @@index([professionalId])
}

// ==================== AVAILABILITY ====================

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

model BusinessHours {
  id            String      @id @default(cuid())
  dayOfWeek     DayOfWeek
  openTime      String      // Format: "HH:MM" (24-hour)
  closeTime     String      // Format: "HH:MM" (24-hour)
  isClosed      Boolean     @default(false)
  
  businessId    String
  business      Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  @@unique([businessId, dayOfWeek])
  @@index([businessId])
}

model ProfessionalAvailability {
  id              String        @id @default(cuid())
  dayOfWeek       DayOfWeek
  startTime       String        // Format: "HH:MM" (24-hour)
  endTime         String        // Format: "HH:MM" (24-hour)
  isAvailable     Boolean       @default(true)
  
  professionalId  String
  professional    Professional  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  @@index([professionalId])
}

model BlockedDate {
  id            String    @id @default(cuid())
  startDate     DateTime
  endDate       DateTime
  reason        String?
  allDay        Boolean   @default(true)
  
  // If specific time blocked
  startTime     String?   // Format: "HH:MM"
  endTime       String?   // Format: "HH:MM"
  
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime  @default(now())
  
  @@index([businessId])
  @@index([startDate, endDate])
}

// ==================== APPOINTMENTS ====================

enum AppointmentStatus {
  PENDING         // Awaiting confirmation
  CONFIRMED       // Confirmed by business
  CANCELLED       // Cancelled by user or business
  COMPLETED       // Service completed
  NO_SHOW         // User didn't show up
  RESCHEDULED     // Moved to different time
}

enum PaymentStatus {
  PENDING         // No payment made
  DEPOSIT_PAID    // Partial payment (deposit)
  PAID            // Full payment received
  REFUNDED        // Payment refunded
}

model Appointment {
  id              String            @id @default(cuid())
  
  // Scheduling
  appointmentDate DateTime
  startTime       String            // Format: "HH:MM"
  endTime         String            // Format: "HH:MM"
  
  // Status
  status          AppointmentStatus @default(PENDING)
  paymentStatus   PaymentStatus     @default(PENDING)
  
  // Pricing
  servicePrice    Float             // Snapshot of price at booking
  depositAmount   Float?
  totalPaid       Float             @default(0)
  currency        String            @default("USD")
  
  // Notes
  customerNotes   String?           @db.Text
  internalNotes   String?           @db.Text
  cancellationReason String?        @db.Text
  
  // Metadata
  cancelledAt     DateTime?
  completedAt     DateTime?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  
  businessId      String
  business        Business          @relation(fields: [businessId], references: [id])
  
  serviceId       String
  service         Service           @relation(fields: [serviceId], references: [id])
  
  professionalId  String?
  professional    Professional?     @relation(fields: [professionalId], references: [id])
  
  payments        Payment[]
  rescheduleHistory AppointmentReschedule[]
  
  @@index([userId])
  @@index([businessId])
  @@index([serviceId])
  @@index([appointmentDate])
  @@index([status])
}

model AppointmentReschedule {
  id                String      @id @default(cuid())
  
  appointmentId     String
  appointment       Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  
  oldDate           DateTime
  oldStartTime      String
  newDate           DateTime
  newStartTime      String
  
  reason            String?     @db.Text
  rescheduledAt     DateTime    @default(now())
  
  @@index([appointmentId])
}

// ==================== PAYMENTS ====================

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  PAYPAL
  STRIPE
  CASH
  OTHER
}

enum PaymentType {
  DEPOSIT
  FULL_PAYMENT
  REFUND
}

model Payment {
  id              String        @id @default(cuid())
  
  amount          Float
  currency        String        @default("USD")
  paymentType     PaymentType
  paymentMethod   PaymentMethod
  
  // Payment Gateway Data
  stripePaymentId String?       @unique
  paymentIntentId String?
  
  status          String        // succeeded, pending, failed
  metadata        Json?         // Additional payment data
  
  createdAt       DateTime      @default(now())
  
  // Relations
  appointmentId   String
  appointment     Appointment   @relation(fields: [appointmentId], references: [id])
  
  @@index([appointmentId])
  @@index([stripePaymentId])
}

// ==================== REVIEWS & RATINGS ====================

model Review {
  id            String    @id @default(cuid())
  
  rating        Int       // 1-5 stars
  comment       String?   @db.Text
  
  // Response from business
  response      String?   @db.Text
  respondedAt   DateTime?
  
  isVerified    Boolean   @default(false) // User had actual appointment
  isPublished   Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  @@index([businessId])
  @@index([userId])
  @@index([rating])
}

// ==================== NEWS & UPDATES ====================

enum NewsStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model NewsPost {
  id            String      @id @default(cuid())
  slug          String      @unique
  
  title         String
  excerpt       String?     @db.Text
  content       String      @db.Text
  coverImage    String?
  
  status        NewsStatus  @default(DRAFT)
  featured      Boolean     @default(false)
  
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Tags for categorization
  tags          String[]
  
  @@index([status])
  @@index([publishedAt])
  @@index([slug])
}

// ==================== CATEGORIES (Optional for Directory) ====================

model Category {
  id            String    @id @default(cuid())
  name          String    @unique
  slug          String    @unique
  description   String?
  icon          String?   // Icon identifier
  
  displayOrder  Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Many-to-many with Business
  businesses    BusinessCategory[]
  
  @@index([slug])
}

model BusinessCategory {
  id          String    @id @default(cuid())
  
  businessId  String
  categoryId  String
  
  createdAt   DateTime  @default(now())
  
  @@unique([businessId, categoryId])
  @@index([businessId])
  @@index([categoryId])
}
```

---

## Project Structure

```
appointments-platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes (sign-in, sign-up)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (public)/                # Public routes
│   │   ├── directory/           # Business directory
│   │   │   ├── page.tsx
│   │   │   └── [slug]/          # Business landing page
│   │   │       └── page.tsx
│   │   ├── news/                # News section
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── page.tsx             # Homepage
│   ├── (dashboard)/             # Authenticated routes
│   │   ├── layout.tsx
│   │   ├── dashboard/           # User dashboard
│   │   │   ├── page.tsx
│   │   │   ├── appointments/
│   │   │   └── profile/
│   │   └── business/            # Business owner dashboard
│   │       ├── [businessId]/
│   │       │   ├── page.tsx
│   │       │   ├── services/
│   │       │   ├── appointments/
│   │       │   ├── availability/
│   │       │   ├── settings/
│   │       │   └── analytics/
│   │       └── new/             # Create new business
│   ├── api/                     # API routes
│   │   ├── businesses/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   ├── services/
│   │   ├── appointments/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   └── availability/    # Check available slots
│   │   ├── payments/
│   │   │   └── webhook/         # Stripe webhook
│   │   ├── reviews/
│   │   └── webhooks/
│   │       └── clerk/           # Clerk webhooks
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── booking/
│   │   ├── appointment-form.tsx
│   │   ├── calendar-picker.tsx
│   │   ├── time-slot-selector.tsx
│   │   └── booking-confirmation.tsx
│   ├── business/
│   │   ├── business-card.tsx
│   │   ├── business-header.tsx
│   │   ├── service-list.tsx
│   │   └── hours-display.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── appointment-list.tsx
│   │   └── calendar-view.tsx
│   ├── forms/
│   │   ├── business-form.tsx
│   │   ├── service-form.tsx
│   │   └── availability-form.tsx
│   └── layout/
│       ├── header.tsx
│       ├── footer.tsx
│       └── sidebar.tsx
├── lib/
│   ├── db/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── auth/
│   │   ├── clerk.ts             # Clerk helpers
│   │   └── permissions.ts       # Authorization logic
│   ├── validations/
│   │   ├── business.ts          # Zod schemas for business
│   │   ├── service.ts
│   │   ├── appointment.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── date.ts              # Date/time utilities
│   │   ├── currency.ts
│   │   └── slugify.ts
│   ├── services/
│   │   ├── appointment-service.ts
│   │   ├── availability-service.ts
│   │   ├── payment-service.ts
│   │   └── notification-service.ts
│   └── constants.ts
├── hooks/
│   ├── use-appointments.ts
│   ├── use-business.ts
│   └── use-availability.ts
├── types/
│   ├── api.ts
│   ├── business.ts
│   └── appointment.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   └── icons/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Feature Breakdown

### Phase 1: Core Foundation (MVP)

#### 1.1 Authentication & User Management
- [ ] Clerk integration for authentication
- [ ] User profile management
- [ ] Role-based access (USER, BUSINESS, ADMIN)
- [ ] User can upgrade to business account

#### 1.2 Business Management
- [ ] Create/edit business profile
- [ ] Business slug generation
- [ ] Upload logo and cover image
- [ ] Set business hours
- [ ] Manage blocked dates/times
- [ ] Business settings (timezone, currency, etc.)

#### 1.3 Service Management
- [ ] Create/edit services
- [ ] Set pricing and duration
- [ ] Service descriptions and images
- [ ] Activate/deactivate services

#### 1.4 Public Directory
- [ ] List all active businesses
- [ ] Business search and filtering
- [ ] Category filtering (optional)
- [ ] Business landing pages
- [ ] Display services on landing page

#### 1.5 Appointment Booking Flow
- [ ] Select business and service
- [ ] View available time slots
- [ ] Calendar interface
- [ ] Create appointment request
- [ ] Booking confirmation
- [ ] Email notifications

#### 1.6 User Dashboard
- [ ] View upcoming appointments
- [ ] View appointment history
- [ ] Appointment details

#### 1.7 Business Dashboard
- [ ] View appointment requests
- [ ] Confirm/reject appointments
- [ ] View calendar of bookings
- [ ] Basic analytics (total appointments, revenue)

---

### Phase 2: Enhanced Features

#### 2.1 Appointment Management
- [ ] Reschedule appointments
- [ ] Cancel appointments
- [ ] Cancellation policies
- [ ] Automated reminders (email/SMS)
- [ ] No-show tracking

#### 2.2 Payment Integration
- [ ] Stripe integration
- [ ] Deposit requests
- [ ] Full payment processing
- [ ] Payment confirmation
- [ ] Refund handling
- [ ] Payment history

#### 2.3 Reviews & Ratings
- [ ] Users can leave reviews
- [ ] Star ratings
- [ ] Business owner responses
- [ ] Display average ratings
- [ ] Verified reviews (from actual appointments)

#### 2.4 News Section
- [ ] Admin can create news posts
- [ ] Display news feed
- [ ] Featured posts
- [ ] News post details page
- [ ] Categories/tags

---

### Phase 3: Advanced Features

#### 3.1 Professional Management
- [ ] Add professionals to business
- [ ] Assign services to professionals
- [ ] Professional-specific availability
- [ ] Professional profiles
- [ ] Book with specific professional

#### 3.2 Advanced Availability
- [ ] Break times
- [ ] Special hours for holidays
- [ ] Override hours for specific dates
- [ ] Recurring blocked dates
- [ ] Professional time-off requests

#### 3.3 Enhanced Business Features
- [ ] Multiple locations per business
- [ ] Business categories
- [ ] Custom booking forms
- [ ] Service packages/bundles
- [ ] Membership/loyalty programs

#### 3.4 Communication
- [ ] In-app messaging
- [ ] SMS notifications
- [ ] Appointment reminders
- [ ] Follow-up messages

#### 3.5 Analytics & Reporting
- [ ] Revenue reports
- [ ] Booking trends
- [ ] Customer insights
- [ ] Service performance
- [ ] Export reports

---

## API Routes Structure

### Authentication & Users
```
POST   /api/users/register          # Create user account
GET    /api/users/me                # Get current user
PUT    /api/users/me                # Update user profile
POST   /api/users/upgrade-to-business # Upgrade to business account
```

### Businesses
```
POST   /api/businesses              # Create business
GET    /api/businesses              # List businesses (public directory)
GET    /api/businesses/[id]         # Get business details
PUT    /api/businesses/[id]         # Update business
DELETE /api/businesses/[id]         # Delete business
GET    /api/businesses/[id]/services # Get business services
GET    /api/businesses/slug/[slug]  # Get business by slug
```

### Services
```
POST   /api/services                # Create service
GET    /api/services                # List services
GET    /api/services/[id]           # Get service details
PUT    /api/services/[id]           # Update service
DELETE /api/services/[id]           # Delete service
```

### Appointments
```
POST   /api/appointments            # Create appointment
GET    /api/appointments            # List appointments (filtered by user)
GET    /api/appointments/[id]       # Get appointment details
PUT    /api/appointments/[id]       # Update appointment
DELETE /api/appointments/[id]       # Cancel appointment
POST   /api/appointments/[id]/reschedule # Reschedule appointment
PUT    /api/appointments/[id]/confirm    # Confirm appointment (business)
GET    /api/appointments/availability    # Check available time slots
```

### Availability
```
GET    /api/availability/[businessId]    # Get business hours
POST   /api/availability/[businessId]    # Set business hours
GET    /api/availability/slots           # Get available time slots
POST   /api/blocked-dates                # Create blocked date
DELETE /api/blocked-dates/[id]           # Remove blocked date
```

### Payments
```
POST   /api/payments/create-intent       # Create Stripe payment intent
POST   /api/payments/confirm             # Confirm payment
POST   /api/payments/refund              # Process refund
POST   /api/payments/webhook             # Stripe webhook handler
```

### Reviews
```
POST   /api/reviews                      # Create review
GET    /api/reviews/[businessId]         # Get business reviews
PUT    /api/reviews/[id]                 # Update review
DELETE /api/reviews/[id]                 # Delete review
POST   /api/reviews/[id]/response        # Business response to review
```

### News
```
GET    /api/news                         # List news posts
GET    /api/news/[slug]                  # Get news post
POST   /api/news                         # Create news post (admin)
PUT    /api/news/[id]                    # Update news post (admin)
DELETE /api/news/[id]                    # Delete news post (admin)
```

---

## Key User Flows

### 1. New User Booking an Appointment

```
1. User visits directory → /directory
2. Browses businesses or searches
3. Clicks on business → /directory/[slug]
4. Views services and selects one
5. Clicks "Book Now"
6. Signs up/logs in (Clerk)
7. Selects date → Calendar component
8. Selects time slot → Available slots displayed
9. Enters notes/details
10. Reviews booking summary
11. Submits booking request
12. Receives confirmation email
13. Waits for business confirmation
```

### 2. Business Owner Managing Appointments

```
1. Business owner logs in
2. Navigates to dashboard → /business/[id]/appointments
3. Views pending appointment requests
4. Clicks on appointment
5. Reviews customer details
6. Confirms or rejects
7. If deposit required → Sends payment request
8. Customer pays deposit
9. Appointment confirmed
10. Receives notifications as appointment approaches
```

### 3. User Rescheduling Appointment

```
1. User logs in → /dashboard/appointments
2. Views upcoming appointments
3. Clicks on appointment
4. Clicks "Reschedule"
5. Selects new date/time
6. Submits reschedule request
7. Business receives notification
8. Business confirms new time
9. User receives confirmation
```

### 4. Business Setting Up Profile

```
1. User upgrades to business account
2. Creates business profile → /business/new
3. Fills in business details
4. Uploads logo/cover image
5. Sets business hours
6. Creates services
7. Sets pricing and duration
8. Configures deposit settings
9. Reviews and publishes
10. Business goes live in directory
```

---

## Validation Schemas (Zod Examples)

### Business Validation
```typescript
// lib/validations/business.ts
import { z } from 'zod';

export const businessSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  website: z.string().url().optional().or(z.literal('')),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  timezone: z.string(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']),
  requireDeposit: z.boolean(),
  depositPercentage: z.number().min(0).max(100).optional(),
});

export const businessSettingsSchema = z.object({
  requireDeposit: z.boolean(),
  depositPercentage: z.number().min(0).max(100).optional(),
  cancellationPolicy: z.string().max(1000).optional(),
  bookingBufferMinutes: z.number().min(0).max(1440),
});
```

### Service Validation
```typescript
// lib/validations/service.ts
import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  durationMinutes: z.number().min(15).max(480),
  bufferMinutes: z.number().min(0).max(120),
  depositAmount: z.number().positive().optional(),
  maxAdvanceBookingDays: z.number().min(1).max(365).optional(),
  minAdvanceBookingHours: z.number().min(1).max(168).optional(),
});
```

### Appointment Validation
```typescript
// lib/validations/appointment.ts
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  serviceId: z.string().cuid(),
  appointmentDate: z.date().min(new Date()),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  customerNotes: z.string().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newDate: z.date().min(new Date()),
  newStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  reason: z.string().max(500).optional(),
});
```

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/appointments"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (SendGrid, Resend, etc.)
EMAIL_FROM=noreply@appointments.com
SENDGRID_API_KEY=xxxxx

# SMS (Twilio, optional)
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# File Upload (Cloudinary, S3, etc.)
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
```

---

## Development Roadmap

### Week 1-2: Setup & Foundation
- [ ] Initialize Next.js project
- [ ] Configure Tailwind, shadcn/ui
- [ ] Setup Prisma with PostgreSQL
- [ ] Configure Clerk authentication
- [ ] Create database schema
- [ ] Run initial migration
- [ ] Setup project structure

### Week 3-4: Core Business Features
- [ ] User profile pages
- [ ] Business creation flow
- [ ] Service management
- [ ] Business hours configuration
- [ ] File upload for images

### Week 5-6: Directory & Landing Pages
- [ ] Public directory page
- [ ] Business landing pages
- [ ] Service display
- [ ] Search and filtering
- [ ] Category system (optional)

### Week 7-8: Appointment Booking
- [ ] Calendar component
- [ ] Availability calculation
- [ ] Time slot selection
- [ ] Booking form
- [ ] Booking confirmation
- [ ] Email notifications

### Week 9-10: Dashboard & Management
- [ ] User dashboard
- [ ] Business dashboard
- [ ] Appointment list views
- [ ] Confirm/reject appointments
- [ ] Calendar views
- [ ] Blocked dates management

### Week 11-12: Payments & Testing
- [ ] Stripe integration
- [ ] Deposit payment flow
- [ ] Full payment processing
- [ ] Webhook handling
- [ ] E2E testing
- [ ] Bug fixes

### Week 13-14: Polish & Launch
- [ ] Reviews system
- [ ] News section
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Final testing
- [ ] Documentation
- [ ] MVP Launch

---

## Technical Considerations

### Performance
- Use Next.js Server Components for better performance
- Implement proper caching strategies
- Optimize database queries with Prisma
- Use indexes for frequently queried fields
- Lazy load images and components

### Security
- Implement RBAC (Role-Based Access Control)
- Sanitize user inputs
- Use Clerk's built-in security features
- Protect API routes with middleware
- Validate all data with Zod
- Use HTTPS in production
- Implement rate limiting

### Scalability
- Design database with proper indexes
- Use connection pooling for Prisma
- Implement caching (Redis) for availability checks
- Consider CDN for static assets
- Plan for horizontal scaling

### Testing Strategy
- Unit tests for business logic
- Integration tests for API routes
- E2E tests for critical flows
- Test edge cases in availability logic
- Test payment flows thoroughly

### Monitoring & Logging
- Implement error tracking (Sentry)
- Log important business events
- Monitor API performance
- Track user analytics
- Monitor payment success rates

---

## Questions to Resolve

1. **Payment Flow**: Should deposit be required immediately or after business confirms?
2. **Timezone Handling**: How to handle users in different timezones booking appointments?
3. **Cancellation Policy**: Should there be a deadline for free cancellations?
4. **Refund Policy**: Full refund? Partial? Depends on timing?
5. **Professional Assignment**: In Phase 1, who handles the appointment if no professional assigned?
6. **Waitlist**: Should we implement a waitlist for fully booked slots?
7. **Recurring Appointments**: Should we support recurring/repeat bookings?
8. **Email Service**: Which email provider (SendGrid, Resend, AWS SES)?
9. **SMS Notifications**: Required or optional feature?
10. **Multi-language**: Support for multiple languages in directory?

---ok lets I recommend designing your API routes from the start to be mobile-ready and Option 2: tRPC , lets have a version apis aswell  and Add API documentation.  can we modify our plan?we will use hooks to call the api, so whe can leverage from tanstank query cache, and from the frontend we will use the mutations and query for gets, each one will have its own logic for back 

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Initialize project with chosen tech stack
4. Create database and run migrations
5. Start with Phase 1 features
6. Regular progress reviews

---

## Notes

- This is a living document and will be updated as the project evolves
- Priority features are in Phase 1 (MVP)
- Phase 2 and 3 can be adjusted based on user feedback
- Consider user testing after Phase 1 completion
- Budget for potential third-party service costs (Stripe, email, SMS, storage)