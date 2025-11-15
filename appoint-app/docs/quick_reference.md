# Quick Reference - Key Decisions & Implementation Notes

## 🎯 Business Model Summary

**Revenue**: 
- Monthly subscription from businesses (amount TBD)
- 1% booking fee from users
- Free tier = landing page only (no appointments)

**Target Market**: 
- Small businesses in Argentina
- Services: salons, consultants, service providers
- Initial geographic focus: Small towns in Argentina

---

## 🔑 Critical Implementation Decisions

### 1. Booking Flow
```
User requests → Business approves (2h window) → Payment link sent → 
User pays via MercadoPago → Booking confirmed
```
- **NO auto-confirm** (manual approval required)
- **NO guest booking** (must create account)
- Can configure auto-confirm per service later

### 2. Multi-Location Model
- ONE business can have MULTIPLE locations
- Services belong to a specific location
- Each location has its own:
  - Address
  - Business hours
  - Blocked dates
  - Professionals (who work there on specific days)

### 3. Payment Integration
- **MercadoPago ONLY** (not Stripe)
- Direct to business account (connected accounts model)
- Platform takes 1% fee on booking
- Business must connect their MercadoPago account

### 4. Cancellation & Refunds
```
Timeline:
- 24-48+ hours before: 100% refund
- 4-24 hours before: 100% refund (configurable)
- Less than 4 hours: 0% refund
```
- Business must approve refunds
- Can be automatic based on policy

### 5. Timezone
- **Argentina timezone ONLY** for now
- `America/Argentina/Buenos_Aires`
- No timezone conversion for users
- Display all times in Argentina time

---

## 🗄️ Database Architecture Highlights

### Key Changes from Original Plan

#### Added:
- **Location** model (one business → many locations)
- **MercadoPagoAccount** model
- **ProfessionalLocation** junction (professionals work at locations on specific days)
- **Message** model (in-app chat)
- **UserNotification** model
- **BusinessAnalytics** model
- Argentina-specific fields (CUIT, documentType, province)

#### Modified:
- Services now belong to **Location** (not directly to Business)
- Appointments track `approvalDeadline` and `hasConflict`
- Payment model uses MercadoPago IDs instead of Stripe
- All currency defaults to **ARS**

### Important Relationships
```
Business
  └── Location (many)
       ├── Service (many)
       │    └── ServiceProfessional
       ├── BusinessHours
       ├── BlockedDates
       └── ProfessionalLocation
            └── Professional

Appointment
  ├── User
  ├── Business
  ├── Service
  ├── Professional (optional)
  └── Payment (many)
```

---

## 🚨 Critical Business Logic

### 1. Approval Window
```typescript
// Business has 2 hours to respond
const approvalDeadline = new Date(
  appointmentCreatedAt.getTime() + (2 * 60 * 60 * 1000)
);

// Background job:
if (now > approvalDeadline && status === 'PENDING') {
  // Mark as EXPIRED
  // Notify user
  // Free the time slot
}
```

### 2. Conflict Detection
```typescript
// Check for overlapping appointments
const hasConflict = existingAppointments.some(apt => {
  return (
    apt.status === 'CONFIRMED' || apt.status === 'PAYMENT_PENDING'
  ) && (
    (apt.startTime <= newStartTime && apt.endTime > newStartTime) ||
    (apt.startTime < newEndTime && apt.endTime >= newEndTime)
  );
});

// If conflict found:
// - Flag appointment with hasConflict = true
// - Notify business owner
// - Allow manual resolution (contact user to change time)
```

### 3. Platform Fee Calculation
```typescript
const platformFee = totalAmount * 0.01; // 1%
const businessReceives = totalAmount - platformFee;

// Store in Payment:
{
  amount: totalAmount,
  platformFee: platformFee,
  netAmount: businessReceives,
  // MercadoPago also charges processing fee (handled by them)
}
```

---

## 📧 Notification System

### Email Events (Spanish)
1. **Nueva solicitud de cita** (Business)
2. **Tu solicitud fue aprobada** (User) + payment link
3. **Tu solicitud fue rechazada** (User)
4. **Pago confirmado** (Both)
5. **Recordatorio: Cita en 24 horas** (Both)
6. **Recordatorio: Cita en 1 hora** (Both)
7. **Cita cancelada** (Both)
8. **Reembolso procesado** (User)

### In-App Notifications
All email events PLUS:
- New message received
- New review received
- Subscription expiring
- Verification approved/rejected

---

## 🇦🇷 Argentina-Specific Features

### Required Fields
- **Business**: CUIT (tax ID)
- **User**: Phone (for WhatsApp contact)
- **Location**: Province (Argentina provinces)

### Localization
- Language: Spanish (Argentina variant - use "vos")
- Currency: ARS with proper formatting: `$1.500,00`
- Date: DD/MM/YYYY
- Time: 24-hour format
- Phone: +54 9 XXX XXX-XXXX

### Payment Context
- MercadoPago dominates in Argentina
- Cash payments still common (mark as "cash" type)
- Consider inflation in pricing model

---

## 🎨 UI/UX Notes

### Directory (Spanish URLs)
- `/directorio` - All businesses
- `/directorio/peluquerias` - Category filter
- `/directorio/salon-centro` - Business page
- `/directorio/salon-centro/reservar/corte-pelo` - Booking flow

### Dashboard (Spanish URLs)
- `/panel` - User dashboard
- `/panel/citas` - My appointments
- `/negocio/[id]` - Business dashboard
- `/negocio/[id]/citas` - Appointments management

### Key Components Needed
```
- BookingCalendar (Argentina timezone aware)
- TimeSlotPicker (shows conflicts)
- PaymentLinkButton (MercadoPago)
- ConflictWarning (for double bookings)
- ApprovalCountdown (2-hour timer)
- LocationSelector (if business has multiple)
- ProfessionalSelector (optional)
```

---

## 🔐 Security Considerations

### MercadoPago Account Storage
```typescript
// NEVER store access tokens in plain text
import crypto from 'crypto';

function encryptToken(token: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
}

function decryptToken(encrypted: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
```

### Webhook Verification
```typescript
// Always verify MercadoPago webhook signatures
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

---

## 📱 Phase Priority

### Phase 1 (MVP) - MUST HAVE
1. ✅ User authentication
2. ✅ Business registration (multi-location)
3. ✅ Service management
4. ✅ Public directory
5. ✅ Booking request flow
6. ✅ Manual approval
7. ✅ Conflict detection
8. ✅ Email notifications

### Phase 2 (Payments) - MUST HAVE
1. ✅ MercadoPago integration
2. ✅ Payment processing
3. ✅ Refund handling
4. ✅ Business & user dashboards
5. ✅ Calendar views

### Phase 3 (Enhanced) - SHOULD HAVE
1. ✅ Professional management
2. ✅ In-app messaging
3. ✅ Review system
4. ✅ News section
5. ⚠️ Analytics
6. ⚠️ Reminders

### Post-Launch - NICE TO HAVE
1. ❌ SMS notifications
2. ❌ WhatsApp integration
3. ❌ Native mobile app
4. ❌ Multi-language
5. ❌ Recurring bookings

---

## ⚠️ Important Notes

### Professional Management
- Professionals can work at **different locations on different days**
- Example: Dr. Smith works at Location A on Mondays, Location B on Wednesdays
- Use `ProfessionalLocation` junction table with `daysOfWeek[]` field

### Conflict Resolution Strategy
- **Allow** double-booking but warn business
- Show conflict indicator in dashboard
- Business must manually:
  1. Contact one customer (via phone/message)
  2. Reschedule one appointment
  3. Confirm resolution

### Subscription vs Free Tier
```
FREE TIER:
- Business profile page (/directorio/[slug])
- Show services
- Show contact info
- NO booking button
- NO appointment management

PAID SUBSCRIPTION:
- Everything in free tier
- Booking button enabled
- Appointment management
- Calendar
- Analytics
- Payment processing
```

---

## 🚀 Quick Start Commands

### Setup Project
```bash
npx create-next-app@latest appointments-ar --typescript --tailwind --app
cd appointments-ar

# Install dependencies
npm install @prisma/client
npm install -D prisma
npm install @clerk/nextjs
npm install zod
npm install react-hook-form @hookform/resolvers
npm install date-fns # Argentina timezone handling
npm install mercadopago

# Shadcn UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input calendar select

# Initialize Prisma
npx prisma init
```

### Database Setup
```bash
# Copy schema from PROJECT_PLAN_UPDATED.md
# Then:
npx prisma migrate dev --name init
npx prisma generate
```

---

## 📞 Support Contacts for Questions

### Still Need Clarification:
1. Monthly subscription price (AR$ amount?)
2. Trial period duration (14/30 days?)
3. Email provider preference (Resend recommended)
4. Domain name (.com.ar?)
5. Exact business verification documents
6. Admin user email for initial setup
7. News posting permissions (admin only?)
8. Professional limits per business

---

## 🎯 Success Metrics to Track

### User Metrics
- Registration conversion rate
- Booking completion rate
- Cancellation rate
- Rebooking rate

### Business Metrics
- Active subscriptions
- Average response time (to approve)
- Approval rate
- Revenue per business
- Churn rate

### Platform Metrics
- Total bookings
- Total GMV (Gross Merchandise Value)
- Platform fee revenue
- Subscription revenue
- User retention

---

**Last Updated**: Based on strategic decisions provided
**Next Step**: Review remaining questions, then start Phase 1 development!