# Multi-Business Appointments Platform - Updated Project Plan
**Based on Strategic Decisions & Requirements**

---

## 🎯 Core Business Model

### Revenue Streams
1. **Monthly Subscription** - Businesses pay monthly fee for appointment management features
2. **Booking Fee** - 1% fee charged to users on each confirmed booking
3. **Free Tier** - Businesses get landing page only (no appointment features)

### Target Market
- **Primary**: Small businesses in Argentina (salons, consultants, service providers)
- **Geographic**: Argentina initially (single timezone: Argentina Standard Time)
- **Business Size**: Both solopreneurs and multi-staff businesses

---

## 📋 Key Decisions Summary

| Decision Area | Choice |
|--------------|--------|
| **Confirmation Model** | Manual approval by business (configurable per service) |
| **Payment Flow** | Business confirms → Sends payment link → User pays → Booking confirmed |
| **Payment Processor** | MercadoPago only (Argentina focus) |
| **Deposit Timing** | After business approval |
| **Guest Booking** | No - Login required |
| **Timezone** | Argentina time only (for now) |
| **Professional Management** | Basic in MVP, enhanced later |
| **Multi-Location** | One business, multiple locations, services per location |
| **Cancellation Policy** | Free 24-48h before, 100% refund if 4+ hours before |
| **Verification** | Manual face-to-face initially, document upload later |
| **News Section** | Keep in Phase 1 (important) |

---

## 🗄️ Updated Database Schema

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
  phone         String    // Required for Argentina market
  role          UserRole  @default(USER)
  avatar        String?
  
  // Argentina specific
  documentType  String?   // DNI, CUIT, etc.
  documentNumber String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  businesses    Business[]
  appointments  Appointment[]
  reviews       Review[]
  messages      Message[]
  notifications UserNotification[]
  
  @@index([clerkId])
  @@index([email])
  @@index([phone])
}

// ==================== BUSINESS MANAGEMENT ====================

enum BusinessStatus {
  DRAFT         // Being set up (free tier)
  PENDING       // Awaiting admin verification
  ACTIVE        // Verified and accepting appointments (paid)
  PAUSED        // Temporarily not accepting appointments
  SUSPENDED     // Admin suspended
}

enum VerificationStatus {
  UNVERIFIED
  PENDING       // Documents submitted
  VERIFIED      // Admin approved
  REJECTED      // Verification failed
}

model Business {
  id            String              @id @default(cuid())
  slug          String              @unique // URL-friendly identifier
  name          String
  description   String?             @db.Text
  logo          String?
  coverImage    String?
  
  // Contact Information
  email         String
  phone         String
  website       String?
  
  // Argentina Specific
  cuit          String?             // Tax ID
  businessType  String?             // Tipo de empresa
  
  // Status & Verification
  status        BusinessStatus      @default(DRAFT)
  verification  VerificationStatus  @default(UNVERIFIED)
  verifiedAt    DateTime?
  verificationNotes String?         @db.Text
  
  // Subscription
  subscriptionStatus String?        // active, past_due, canceled
  subscriptionStartDate DateTime?
  subscriptionEndDate DateTime?
  trialEndsAt   DateTime?
  
  // Settings
  timezone      String              @default("America/Argentina/Buenos_Aires")
  currency      String              @default("ARS")
  
  // Booking Settings
  requireDeposit        Boolean     @default(false)
  depositPercentage     Float?      // 0-100
  defaultDepositAmount  Float?      // Fixed amount in ARS
  cancellationHours     Int         @default(24) // Hours before free cancellation
  refundPercentage      Float       @default(100) // If cancelled 4+ hours before
  bookingApprovalHours  Int         @default(2) // Time to approve/reject
  minAdvanceBookingHours Int        @default(2) // Minimum notice for bookings
  
  // Policies
  cancellationPolicy    String?     @db.Text
  termsAndConditions    String?     @db.Text
  
  // SEO
  metaTitle       String?
  metaDescription String?           @db.Text
  keywords        String[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  locations     Location[]
  categories    BusinessCategory[]
  appointments  Appointment[]
  reviews       Review[]
  messages      Message[]
  mercadoPagoAccount MercadoPagoAccount?
  
  @@index([slug])
  @@index([ownerId])
  @@index([status])
  @@index([verification])
}

// ==================== LOCATIONS ====================
// One business can have multiple physical locations

model Location {
  id            String    @id @default(cuid())
  name          String    // e.g., "Sucursal Centro", "Consultorio Norte"
  
  // Address
  addressLine1  String
  addressLine2  String?
  city          String
  province      String    // Argentina provinces
  zipCode       String
  country       String    @default("Argentina")
  latitude      Float?
  longitude     Float?
  
  // Contact (optional, can inherit from business)
  phone         String?
  email         String?
  
  // Settings
  isActive      Boolean   @default(true)
  isPrimary     Boolean   @default(false) // One location as main
  
  // Display
  displayOrder  Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  services      Service[]
  businessHours BusinessHours[]
  blockedDates  BlockedDate[]
  professionals Professional[]
  
  @@index([businessId])
  @@index([isActive])
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
  slug          String        // Unique within location
  description   String?       @db.Text
  image         String?
  
  // Pricing (in ARS)
  price         Float
  currency      String        @default("ARS")
  depositAmount Float?        // Override business deposit
  depositPercentage Float?    // Or use percentage
  
  // Duration
  durationMinutes Int
  bufferMinutes   Int         @default(0) // Time between appointments
  
  // Booking Settings
  requiresApproval Boolean    @default(true) // Can be auto-confirm per service
  minAdvanceBookingHours Int? // Override business setting
  maxAdvanceBookingDays Int?  // How far in advance
  allowSameDayBooking Boolean @default(false)
  
  // Settings
  status        ServiceStatus @default(ACTIVE)
  
  // Display
  displayOrder  Int          @default(0)
  featured      Boolean      @default(false)
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  // Relations
  locationId    String
  location      Location     @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  appointments  Appointment[]
  professionals ServiceProfessional[]
  
  @@unique([locationId, slug])
  @@index([locationId])
  @@index([status])
  @@index([featured])
}

// ==================== PROFESSIONALS ====================
// Professionals can work at multiple locations on different days

model Professional {
  id            String    @id @default(cuid())
  firstName     String
  lastName      String
  email         String?
  phone         String?
  bio           String?   @db.Text
  avatar        String?
  specialty     String?
  
  // Settings
  isActive      Boolean   @default(true)
  canManageOwnSchedule Boolean @default(true)
  canAcceptBookings Boolean @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Which locations they work at
  locations     ProfessionalLocation[]
  services      ServiceProfessional[]
  appointments  Appointment[]
  availability  ProfessionalAvailability[]
  
  @@index([businessId])
  @@index([isActive])
}

// Junction: Professional works at Location on specific days
model ProfessionalLocation {
  id              String        @id @default(cuid())
  
  professionalId  String
  professional    Professional  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  locationId      String
  location        Location      @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  // Which days they work at this location
  daysOfWeek      DayOfWeek[]   // Can work Monday at Location A, Tuesday at Location B
  
  createdAt       DateTime      @default(now())
  
  @@unique([professionalId, locationId])
  @@index([professionalId])
  @@index([locationId])
}

// Junction: Professional offers Service
model ServiceProfessional {
  id              String        @id @default(cuid())
  
  serviceId       String
  service         Service       @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  
  professionalId  String
  professional    Professional  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  // Can override service price for this professional
  customPrice     Float?
  
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
  
  locationId    String
  location      Location    @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  @@unique([locationId, dayOfWeek])
  @@index([locationId])
}

model ProfessionalAvailability {
  id              String        @id @default(cuid())
  dayOfWeek       DayOfWeek
  startTime       String        // Format: "HH:MM" (24-hour)
  endTime         String        // Format: "HH:MM" (24-hour)
  isAvailable     Boolean       @default(true)
  
  // Optional: Specific to a location
  locationId      String?
  
  professionalId  String
  professional    Professional  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  @@index([professionalId])
  @@index([locationId])
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
  
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime  @default(now())
  
  @@index([locationId])
  @@index([startDate, endDate])
}

// ==================== APPOINTMENTS ====================

enum AppointmentStatus {
  PENDING         // Awaiting business confirmation
  PAYMENT_PENDING // Business approved, waiting for payment
  CONFIRMED       // Paid and confirmed
  CANCELLED       // Cancelled by user or business
  COMPLETED       // Service completed
  NO_SHOW         // User didn't show up
  REJECTED        // Business rejected the request
  EXPIRED         // Business didn't respond in time
}

enum PaymentStatus {
  PENDING         // No payment made
  PROCESSING      // Payment in progress
  PAID            // Full payment received
  REFUNDED        // Payment refunded
  PARTIALLY_REFUNDED // Partial refund
  FAILED          // Payment failed
}

model Appointment {
  id              String            @id @default(cuid())
  
  // Scheduling
  appointmentDate DateTime
  startTime       String            // Format: "HH:MM"
  endTime         String            // Format: "HH:MM"
  timezone        String            @default("America/Argentina/Buenos_Aires")
  
  // Status
  status          AppointmentStatus @default(PENDING)
  paymentStatus   PaymentStatus     @default(PENDING)
  
  // Pricing (snapshot at booking time)
  servicePrice    Float             // Original service price
  depositAmount   Float?            // Deposit required
  totalAmount     Float             // Total to pay
  platformFee     Float             @default(0) // 1% booking fee
  totalPaid       Float             @default(0)
  currency        String            @default("ARS")
  
  // Approval tracking
  approvalDeadline DateTime?        // Business must respond by this time
  approvedAt       DateTime?
  rejectedAt       DateTime?
  confirmedAt      DateTime?        // Payment confirmed
  
  // Notes
  customerNotes   String?           @db.Text
  internalNotes   String?           @db.Text // Only visible to business
  rejectionReason String?           @db.Text
  cancellationReason String?        @db.Text
  
  // Metadata
  cancelledAt     DateTime?
  completedAt     DateTime?
  noShowAt        DateTime?
  
  // Conflict detection
  hasConflict     Boolean           @default(false)
  conflictNotes   String?           @db.Text
  
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
  notifications   AppointmentNotification[]
  
  @@index([userId])
  @@index([businessId])
  @@index([serviceId])
  @@index([professionalId])
  @@index([appointmentDate])
  @@index([status])
  @@index([paymentStatus])
  @@index([approvalDeadline])
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
  initiatedBy       String      // userId or "business"
  approvedBy        String?     // If requires approval
  
  rescheduledAt     DateTime    @default(now())
  
  @@index([appointmentId])
}

// ==================== PAYMENTS (MERCADOPAGO) ====================

model MercadoPagoAccount {
  id              String    @id @default(cuid())
  
  businessId      String    @unique
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // MercadoPago credentials
  accessToken     String    @db.Text // Encrypted
  publicKey       String?
  userId          String?   // MercadoPago user ID
  
  // Account info
  email           String?
  nickname        String?
  
  isActive        Boolean   @default(true)
  verifiedAt      DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([businessId])
}

enum PaymentMethod {
  MERCADOPAGO
  CREDIT_CARD
  DEBIT_CARD
  CASH          // For in-person
  TRANSFER      // Bank transfer
  OTHER
}

enum PaymentType {
  DEPOSIT
  FULL_PAYMENT
  REFUND
  PLATFORM_FEE
}

model Payment {
  id              String        @id @default(cuid())
  
  amount          Float
  currency        String        @default("ARS")
  paymentType     PaymentType
  paymentMethod   PaymentMethod @default(MERCADOPAGO)
  
  // MercadoPago Data
  mercadoPagoId   String?       @unique // Payment ID from MP
  preferenceId    String?       // Preference ID for payment link
  merchantOrderId String?
  paymentLink     String?       @db.Text // Link sent to user
  
  status          String        // approved, pending, rejected, refunded
  statusDetail    String?
  metadata        Json?         // Additional payment data
  
  // Fees
  platformFee     Float         @default(0)
  processingFee   Float         @default(0)
  netAmount       Float         // Amount after fees
  
  paidAt          DateTime?
  refundedAt      DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  appointmentId   String
  appointment     Appointment   @relation(fields: [appointmentId], references: [id])
  
  @@index([appointmentId])
  @@index([mercadoPagoId])
  @@index([status])
  @@index([createdAt])
}

// ==================== REVIEWS & RATINGS ====================

model Review {
  id            String    @id @default(cuid())
  
  rating        Int       // 1-5 stars
  comment       String?   @db.Text
  
  // Response from business
  response      String?   @db.Text
  respondedAt   DateTime?
  
  // Verification
  isVerified    Boolean   @default(false) // User had actual appointment
  appointmentId String?   // Link to verified appointment
  
  isPublished   Boolean   @default(true)
  isFeatured    Boolean   @default(false)
  
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
  @@index([isPublished])
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
  
  // SEO
  metaTitle     String?
  metaDescription String?   @db.Text
  
  publishedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Tags for categorization
  tags          String[]
  
  // Author (admin)
  authorId      String
  
  @@index([status])
  @@index([publishedAt])
  @@index([slug])
  @@index([featured])
}

// ==================== CATEGORIES ====================

model Category {
  id            String    @id @default(cuid())
  name          String    @unique
  slug          String    @unique
  description   String?
  icon          String?   // Icon identifier for UI
  image         String?   // Category image
  
  displayOrder  Int       @default(0)
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  businesses    BusinessCategory[]
  
  @@index([slug])
  @@index([isActive])
}

model BusinessCategory {
  id          String    @id @default(cuid())
  
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime  @default(now())
  
  @@unique([businessId, categoryId])
  @@index([businessId])
  @@index([categoryId])
}

// ==================== NOTIFICATIONS ====================

enum NotificationType {
  APPOINTMENT_REQUEST      // New booking request
  APPOINTMENT_CONFIRMED    // Business confirmed
  APPOINTMENT_REJECTED     // Business rejected
  PAYMENT_REQUIRED         // Payment link sent
  PAYMENT_RECEIVED         // Payment successful
  APPOINTMENT_REMINDER     // 24h/1h reminder
  APPOINTMENT_CANCELLED    // Cancellation notification
  APPOINTMENT_RESCHEDULED  // Reschedule notification
  MESSAGE_RECEIVED         // New message
  REVIEW_RECEIVED          // New review
  SUBSCRIPTION_EXPIRING    // Subscription ending soon
  VERIFICATION_APPROVED    // Business verified
  VERIFICATION_REJECTED    // Business verification failed
}

model AppointmentNotification {
  id            String            @id @default(cuid())
  type          NotificationType
  title         String
  message       String            @db.Text
  
  // Notification sent via
  sentViaEmail  Boolean           @default(false)
  sentViaSMS    Boolean           @default(false)
  sentInApp     Boolean           @default(true)
  
  sentAt        DateTime          @default(now())
  
  appointmentId String
  appointment   Appointment       @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  
  @@index([appointmentId])
  @@index([sentAt])
}

model UserNotification {
  id            String            @id @default(cuid())
  type          NotificationType
  title         String
  message       String            @db.Text
  
  isRead        Boolean           @default(false)
  readAt        DateTime?
  
  // Optional link/action
  actionUrl     String?
  actionLabel   String?
  
  createdAt     DateTime          @default(now())
  
  userId        String
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

// ==================== MESSAGING ====================

model Message {
  id            String    @id @default(cuid())
  
  content       String    @db.Text
  isRead        Boolean   @default(false)
  readAt        DateTime?
  
  // Sender
  senderId      String
  sender        User      @relation(fields: [senderId], references: [id])
  
  // Receiver (business)
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Optional: Related to appointment
  appointmentId String?
  
  createdAt     DateTime  @default(now())
  
  @@index([senderId])
  @@index([businessId])
  @@index([appointmentId])
  @@index([createdAt])
}

// ==================== ANALYTICS (Future) ====================

model BusinessAnalytics {
  id                String    @id @default(cuid())
  
  businessId        String
  date              DateTime  @db.Date
  
  // Metrics
  totalBookings     Int       @default(0)
  confirmedBookings Int       @default(0)
  cancelledBookings Int       @default(0)
  revenue           Float     @default(0)
  platformFees      Float     @default(0)
  
  // Service popularity
  topServiceId      String?
  topServiceBookings Int      @default(0)
  
  createdAt         DateTime  @default(now())
  
  @@unique([businessId, date])
  @@index([businessId])
  @@index([date])
}
```

---

## 🎨 Updated Project Structure

```
appointments-platform/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Homepage with categories
│   │   ├── directorio/                     # Directory (Spanish)
│   │   │   ├── page.tsx                   # All businesses grid
│   │   │   ├── [categoria]/page.tsx       # Filter by category
│   │   │   └── [slug]/                    # Business landing page
│   │   │       ├── page.tsx
│   │   │       └── reservar/              # Booking flow
│   │   │           └── [serviceId]/page.tsx
│   │   └── noticias/                      # News section (Spanish)
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── panel/                         # User dashboard (Spanish)
│   │   │   ├── page.tsx
│   │   │   ├── citas/                     # My appointments
│   │   │   ├── perfil/                    # Profile
│   │   │   └── notificaciones/
│   │   └── negocio/                       # Business dashboard
│   │       ├── [businessId]/
│   │       │   ├── page.tsx               # Overview
│   │       │   ├── citas/                 # Appointments management
│   │       │   │   ├── page.tsx
│   │       │   │   └── [id]/page.tsx
│   │       │   ├── servicios/             # Services
│   │       │   ├── ubicaciones/           # Locations
│   │       │   ├── profesionales/         # Professionals
│   │       │   ├── disponibilidad/        # Availability
│   │       │   ├── analiticas/            # Analytics
│   │       │   ├── pagos/                 # Payment settings
│   │       │   ├── configuracion/         # Settings
│   │       │   └── mensajes/              # Messages
│   │       └── nuevo/                     # Create business
│   ├── (admin)/
│   │   └── admin/
│   │       ├── negocios/                  # Verify businesses
│   │       ├── noticias/                  # Manage news
│   │       └── analiticas/                # Platform analytics
│   ├── api/
│   │   ├── auth/
│   │   │   └── webhook/route.ts           # Clerk webhook
│   │   ├── businesses/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── slug/[slug]/route.ts
│   │   ├── locations/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── services/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── professionals/
│   │   ├── appointments/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── approve/route.ts
│   │   │   │   ├── reject/route.ts
│   │   │   │   └── reschedule/route.ts
│   │   │   └── availability/route.ts
│   │   ├── payments/
│   │   │   ├── create-preference/route.ts
│   │   │   ├── webhook/route.ts           # MercadoPago webhook
│   │   │   └── refund/route.ts
│   │   ├── notifications/
│   │   ├── messages/
│   │   ├── reviews/
│   │   ├── news/
│   │   └── categories/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                                # shadcn/ui components
│   ├── booking/
│   │   ├── booking-calendar.tsx
│   │   ├── time-slot-picker.tsx
│   │   ├── booking-form.tsx
│   │   ├── booking-summary.tsx
│   │   └── payment-status.tsx
│   ├── business/
│   │   ├── business-card.tsx
│   │   ├── business-hero.tsx
│   │   ├── location-selector.tsx
│   │   ├── service-card.tsx
│   │   ├── reviews-section.tsx
│   │   └── business-info.tsx
│   ├── dashboard/
│   │   ├── stats-overview.tsx
│   │   ├── appointment-calendar.tsx
│   │   ├── appointment-table.tsx
│   │   ├── pending-approvals.tsx
│   │   └── revenue-chart.tsx
│   ├── forms/
│   │   ├── business-form.tsx
│   │   ├── location-form.tsx
│   │   ├── service-form.tsx
│   │   ├── professional-form.tsx
│   │   └── availability-form.tsx
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   └── mobile-nav.tsx
│   └── notifications/
│       ├── notification-bell.tsx
│       └── notification-list.tsx
├── lib/
│   ├── db/
│   │   └── prisma.ts
│   ├── auth/
│   │   ├── clerk.ts
│   │   └── permissions.ts
│   ├── mercadopago/
│   │   ├── client.ts                      # MercadoPago SDK
│   │   ├── preferences.ts
│   │   └── webhooks.ts
│   ├── validations/
│   │   ├── business.ts
│   │   ├── location.ts
│   │   ├── service.ts
│   │   ├── appointment.ts
│   │   ├── professional.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── date.ts                        # Argentina timezone handling
│   │   ├── currency.ts                    # ARS formatting
│   │   ├── slugify.ts
│   │   └── validators.ts
│   ├── services/
│   │   ├── appointment-service.ts
│   │   ├── availability-service.ts
│   │   ├── payment-service.ts
│   │   ├── notification-service.ts
│   │   └── conflict-detector.ts
│   ├── email/
│   │   ├── templates/
│   │   │   ├── appointment-request.tsx
│   │   │   ├── appointment-confirmed.tsx
│   │   │   ├── payment-link.tsx
│   │   │   └── reminder.tsx
│   │   └── sender.ts
│   └── constants.ts
├── hooks/
│   ├── use-appointments.ts
│   ├── use-business.ts
│   ├── use-availability.ts
│   ├── use-notifications.ts
│   └── use-mercadopago.ts
├── types/
│   ├── api.ts
│   ├── business.ts
│   ├── appointment.ts
│   └── mercadopago.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   ├── icons/
│   └── placeholders/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 📱 Updated User Flows

### Flow 1: User Books Appointment

```
1. User browses directory → /directorio
2. Filters by category (e.g., "Peluquerías")
3. Clicks on business → /directorio/salon-centro
4. Views locations and services
5. Selects service → "Corte de Pelo"
6. Clicks "Reservar" (must be logged in)
7. Selects date from calendar
8. Selects available time slot
9. Adds notes (optional)
10. Reviews summary (price + 1% platform fee)
11. Submits booking request
12. Receives confirmation: "Esperando aprobación del negocio"
13. Business has 2 hours to approve/reject
14. ✅ Business approves → User receives email with payment link
15. User pays via MercadoPago
16. Payment confirmed → Booking locked
17. Receives appointment confirmation email
18. Gets reminders 24h and 1h before
```

### Flow 2: Business Approves Appointment

```
1. Business receives email notification: "Nueva solicitud de cita"
2. Logs in to dashboard → /negocio/[id]/citas
3. Sees pending request with countdown (2h to respond)
4. Reviews:
   - Customer info (name, phone)
   - Service requested
   - Date/time
   - Any conflicts with existing bookings
5. Checks availability
6. Decision:
   
   ✅ APPROVE:
   - Clicks "Aprobar"
   - System generates MercadoPago payment link
   - Email sent to customer with link
   - Status: PAYMENT_PENDING
   - Waits for payment
   - Once paid → Status: CONFIRMED
   
   ❌ REJECT:
   - Clicks "Rechazar"
   - Provides reason
   - Customer notified
   - Slot freed
```

### Flow 3: User Cancels Appointment

```
1. User goes to → /panel/citas
2. Finds upcoming appointment
3. Clicks "Cancelar"
4. System checks:
   - More than 48 hours? → 100% refund
   - 4-48 hours? → 100% refund
   - Less than 4 hours? → No refund
5. Confirms cancellation
6. If eligible for refund:
   - Business receives refund request
   - Business approves (automatic if policy allows)
   - MercadoPago processes refund
7. Both parties receive confirmation
8. Slot becomes available again
```

### Flow 4: Business Setup (First Time)

```
1. User signs up → /sign-up
2. Completes profile
3. Navigates to → /negocio/nuevo
4. Fills business form:
   - Name, description
   - CUIT (tax ID)
   - Contact info
   - Upload logo
5. Creates first location:
   - Address in Argentina
   - Phone
   - Business hours per day
6. Adds services:
   - Name, description, price (ARS)
   - Duration
   - Requires approval? (Yes/No)
   - Upload service image
7. Connects MercadoPago:
   - OAuth flow to link account
   - Verifies credentials
8. Sets cancellation policy
9. Submits for verification
10. Status: PENDING
11. Admin reviews and approves
12. Business receives approval email
13. Can now start trial period
14. After trial → Subscribe to activate appointments
```

---

## 🔄 Key Business Logic

### Approval Deadline System

```typescript
// When appointment is created
const approvalDeadline = new Date(
  createdAt.getTime() + (bookingApprovalHours * 60 * 60 * 1000)
);

// Background job checks expired requests
// If deadline passed and status still PENDING:
- Set status to EXPIRED
- Notify user
- Free up time slot
```

### Conflict Detection

```typescript
// When checking availability or approving
function detectConflict(appointmentData) {
  const conflicts = await prisma.appointment.findMany({
    where: {
      serviceId: appointmentData.serviceId,
      appointmentDate: appointmentData.appointmentDate,
      status: { in: ['CONFIRMED', 'PAYMENT_PENDING'] },
      OR: [
        {
          startTime: { lte: appointmentData.startTime },
          endTime: { gt: appointmentData.startTime }
        },
        {
          startTime: { lt: appointmentData.endTime },
          endTime: { gte: appointmentData.endTime }
        }
      ]
    }
  });
  
  if (conflicts.length > 0) {
    // Mark appointment as hasConflict
    // Notify business owner
    // Allow manual resolution
  }
}
```

### Refund Calculation

```typescript
function calculateRefund(appointment) {
  const now = new Date();
  const appointmentDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.startTime}`
  );
  
  const hoursUntilAppointment = 
    (appointmentDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilAppointment >= appointment.business.cancellationHours) {
    return {
      refundPercentage: 100,
      refundAmount: appointment.totalPaid
    };
  }
  
  if (hoursUntilAppointment >= 4) {
    return {
      refundPercentage: appointment.business.refundPercentage,
      refundAmount: appointment.totalPaid * (appointment.business.refundPercentage / 100)
    };
  }
  
  return {
    refundPercentage: 0,
    refundAmount: 0
  };
}
```

---

## 💳 MercadoPago Integration

### Setup Flow

```typescript
// lib/mercadopago/client.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function createPaymentPreference(appointment) {
  const client = new MercadoPagoConfig({
    accessToken: business.mercadoPagoAccount.accessToken
  });
  
  const preference = new Preference(client);
  
  const result = await preference.create({
    body: {
      items: [
        {
          id: appointment.id,
          title: `${appointment.service.name} - ${appointment.business.name}`,
          quantity: 1,
          unit_price: appointment.totalAmount,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: appointment.user.email,
        phone: {
          number: appointment.user.phone
        },
        name: appointment.user.firstName,
        surname: appointment.user.lastName
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pago/exito?appointment=${appointment.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pago/fallo`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/pago/pendiente`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      metadata: {
        appointment_id: appointment.id,
        user_id: appointment.userId,
        business_id: appointment.businessId
      }
    }
  });
  
  return result;
}
```

### Webhook Handler

```typescript
// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verify webhook signature (MercadoPago security)
    // ...
    
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Get payment details from MercadoPago
      const mpPayment = await getPaymentDetails(paymentId);
      
      if (mpPayment.status === 'approved') {
        const appointmentId = mpPayment.metadata.appointment_id;
        
        // Update appointment
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            confirmedAt: new Date(),
            totalPaid: mpPayment.transaction_amount
          }
        });
        
        // Create payment record
        await prisma.payment.create({
          data: {
            appointmentId,
            mercadoPagoId: paymentId,
            amount: mpPayment.transaction_amount,
            platformFee: mpPayment.transaction_amount * 0.01,
            netAmount: mpPayment.transaction_amount * 0.99,
            status: 'approved',
            paymentType: 'FULL_PAYMENT',
            paymentMethod: 'MERCADOPAGO',
            paidAt: new Date()
          }
        });
        
        // Send confirmation notifications
        await sendAppointmentConfirmationEmail(appointmentId);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

---

## 📧 Notification System

### Email Templates (Spanish/Argentina)

```typescript
// lib/email/templates/appointment-request.tsx
export function AppointmentRequestEmail({ appointment, business }) {
  return (
    <div>
      <h1>Nueva solicitud de cita</h1>
      <p>Hola {business.name},</p>
      <p>Tienes una nueva solicitud de cita:</p>
      
      <div>
        <strong>Cliente:</strong> {appointment.user.firstName} {appointment.user.lastName}<br/>
        <strong>Teléfono:</strong> {appointment.user.phone}<br/>
        <strong>Email:</strong> {appointment.user.email}<br/>
        <strong>Servicio:</strong> {appointment.service.name}<br/>
        <strong>Fecha:</strong> {formatDate(appointment.appointmentDate)}<br/>
        <strong>Hora:</strong> {appointment.startTime}<br/>
        <strong>Notas:</strong> {appointment.customerNotes || 'Sin notas'}
      </div>
      
      <p>⏰ Tienes 2 horas para aprobar o rechazar esta cita.</p>
      
      <a href="{dashboardLink}">Ver en el panel</a>
    </div>
  );
}
```

### In-App Notifications

```typescript
// lib/services/notification-service.ts
export async function notifyAppointmentRequest(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: { include: { owner: true } }, user: true, service: true }
  });
  
  // Email to business
  await sendEmail({
    to: appointment.business.email,
    template: 'appointment-request',
    data: appointment
  });
  
  // In-app notification
  await prisma.userNotification.create({
    data: {
      userId: appointment.business.ownerId,
      type: 'APPOINTMENT_REQUEST',
      title: 'Nueva solicitud de cita',
      message: `${appointment.user.firstName} solicitó ${appointment.service.name} para ${formatDate(appointment.appointmentDate)}`,
      actionUrl: `/negocio/${appointment.businessId}/citas/${appointmentId}`,
      actionLabel: 'Ver detalles'
    }
  });
}
```

---

## 🚀 Development Phases - Updated

### Phase 1: MVP (Weeks 1-8)

#### Week 1-2: Foundation
- [x] Project setup (Next.js 15, Tailwind, Prisma)
- [x] Clerk authentication
- [x] Database schema and migrations
- [ ] Basic UI components (shadcn/ui)
- [ ] Argentina timezone utilities
- [ ] ARS currency formatting

#### Week 3-4: Business & Locations
- [ ] Business registration flow
- [ ] Location management
- [ ] Service creation
- [ ] Business hours configuration
- [ ] Image upload (Cloudinary)
- [ ] Slug generation

#### Week 5-6: Public Directory & Pages
- [ ] Homepage with categories
- [ ] Directory listing page
- [ ] Category filtering
- [ ] Business landing pages
- [ ] Service display
- [ ] SEO optimization
- [ ] Reviews display (read-only for now)

#### Week 7-8: Booking System
- [ ] Availability calculation
- [ ] Calendar component
- [ ] Time slot selection
- [ ] Booking form
- [ ] Approval/rejection flow
- [ ] Conflict detection
- [ ] Email notifications

### Phase 2: Payments & Management (Weeks 9-12)

#### Week 9-10: MercadoPago Integration
- [ ] MercadoPago account connection
- [ ] Payment preference creation
- [ ] Payment link generation
- [ ] Webhook handling
- [ ] Payment confirmation
- [ ] Refund processing

#### Week 11-12: Dashboards
- [ ] User dashboard
  - [ ] My appointments
  - [ ] Payment history
  - [ ] Profile management
- [ ] Business dashboard
  - [ ] Pending approvals
  - [ ] Calendar view
  - [ ] Appointment management
  - [ ] Basic analytics

### Phase 3: Enhanced Features (Weeks 13-16)

#### Week 13: Professional Management
- [ ] Add professionals
- [ ] Assign to services
- [ ] Location-day assignments
- [ ] Professional availability
- [ ] Professional dashboard (basic)

#### Week 14: Messaging & Notifications
- [ ] In-app messaging system
- [ ] Real-time notifications
- [ ] Notification preferences
- [ ] Email templates
- [ ] Reminder system (24h, 1h)

#### Week 15: Reviews & News
- [ ] Review submission
- [ ] Business responses
- [ ] Review moderation
- [ ] News post management (admin)
- [ ] News display

#### Week 16: Admin & Polish
- [ ] Admin verification flow
- [ ] Business approval
- [ ] Platform analytics
- [ ] Performance optimization
- [ ] Testing
- [ ] Bug fixes

---

## 🔐 Environment Variables - Updated

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/appointments_ar"

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Clerk Authentication (Argentina)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/ingresar
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/registrarse
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/panel
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/panel

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx

# Email (Resend recommended for Argentina)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@tucita.com.ar

# File Upload (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Optional: SMS (future)
# TWILIO_ACCOUNT_SID=xxxxx
# TWILIO_AUTH_TOKEN=xxxxx
# TWILIO_PHONE_NUMBER=+54xxxxx

# Encryption (for storing MercadoPago tokens)
ENCRYPTION_KEY=xxxxx

# Timezone
TZ=America/Argentina/Buenos_Aires

# Platform Settings
PLATFORM_FEE_PERCENTAGE=1
DEFAULT_APPROVAL_HOURS=2
DEFAULT_CANCELLATION_HOURS=24
DEFAULT_REFUND_HOURS=4
```

---

## 📊 Key Validations - Updated

### Appointment Validation

```typescript
// lib/validations/appointment.ts
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  serviceId: z.string().cuid(),
  appointmentDate: z.date().min(new Date(), {
    message: "La fecha no puede ser en el pasado"
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  customerNotes: z.string().max(500).optional(),
}).refine(async (data) => {
  // Check minimum advance booking
  const service = await getService(data.serviceId);
  const minHours = service.minAdvanceBookingHours || 
                   service.location.business.minAdvanceBookingHours;
  
  const appointmentDateTime = new Date(
    `${data.appointmentDate}T${data.startTime}`
  );
  const hoursUntil = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
  
  return hoursUntil >= minHours;
}, {
  message: "Debes reservar con mayor anticipación"
});
```

---

## 🎯 Critical Features Checklist

### Must Have (MVP - Phase 1)
- [x] User authentication (Clerk)
- [ ] Business registration
- [ ] Multi-location support
- [ ] Service management
- [ ] Public directory
- [ ] Business landing pages
- [ ] Booking request flow
- [ ] Manual approval system
- [ ] Email notifications
- [ ] Conflict detection
- [ ] Basic availability

### Must Have (Payments - Phase 2)
- [ ] MercadoPago integration
- [ ] Payment link generation
- [ ] Webhook processing
- [ ] Payment confirmation
- [ ] Refund system
- [ ] Business dashboard
- [ ] User dashboard
- [ ] Appointment calendar

### Should Have (Phase 3)
- [ ] Professional management
- [ ] In-app messaging
- [ ] Review system
- [ ] News section
- [ ] Advanced analytics
- [ ] Reminder notifications
- [ ] Reschedule flow

### Nice to Have (Post-Launch)
- [ ] SMS notifications
- [ ] Mobile app
- [ ] Multi-language
- [ ] Advanced reporting
- [ ] Loyalty programs
- [ ] Recurring appointments

---

## 🇦🇷 Argentina-Specific Considerations

### Currency & Payments
- All prices in **ARS (Pesos Argentinos)**
- MercadoPago is the dominant payment processor
- Consider inflation - allow easy price updates
- Display prices clearly: "$1.500" or "AR$ 1.500"

### Localization
- Spanish language throughout
- Argentina Spanish conventions ("vos" vs "tú")
- Date format: DD/MM/YYYY
- Time format: 24-hour preferred
- Phone: +54 format

### Business Culture
- Many businesses prefer manual confirmation (trust-based)
- Personal relationships important
- WhatsApp integration may be needed later
- Cash still common for in-person payments

### Legal
- CUIT/CUIL required for businesses
- Invoice generation may be needed
- AFIP compliance for tax purposes
- Consumer protection laws (Defensa del Consumidor)

---

## 📝 Next Steps

1. **Review this updated plan** - Confirm all decisions align
2. **Set up development environment**
3. **Initialize project**
   ```bash
   npx create-next-app@latest appointments-ar --typescript --tailwind --app
   cd appointments-ar
   npm install prisma @prisma/client
   npx prisma init
   ```
4. **Set up Clerk** (Argentina region)
5. **Create database schema** (copy from above)
6. **Install shadcn/ui**
7. **Start Phase 1, Week 1** 🚀

---

## ❓ Remaining Questions

1. **Subscription Pricing**: What's the monthly fee? (e.g., AR$ 5.000/month?)
2. **Trial Period Duration**: 14 days? 30 days?
3. **Email Provider**: Resend? SendGrid? (Resend recommended for Argentina)
4. **Domain Name**: What domain? (.com.ar preferred for Argentina)
5. **Hosting**: Vercel? Railway? (Vercel recommended)
6. **Database**: Neon? Supabase? Railway?
7. **Admin Access**: Who gets admin role initially?
8. **Business Verification**: What documents exactly? (CUIT certificate, address proof?)
9. **News Section**: Who can create posts? Just admin or businesses too?
10. **Professional Limits**: Max professionals per business?

---

This plan is ready to execute! Would you like me to start setting up the project structure or clarify any remaining questions?

