# Pre-Development Checklist
## Questions to Answer Before Starting

---

## 💰 Pricing & Business Model

### Subscription Pricing
- [ ] **Monthly subscription cost?**
  - Suggested: AR$ 5.000 - 10.000/month
  - Or: Tiered pricing (Basic AR$ 5.000, Pro AR$ 10.000)
  - Decision: _________________

- [ ] **Trial period duration?**
  - Option A: 14 days free trial
  - Option B: 30 days free trial
  - Option C: First month 50% off
  - Decision: _________________

- [ ] **What happens after trial expires?**
  - Appointments disabled but profile stays?
  - Or profile hidden from directory?
  - Decision: _________________

---

## 🛠️ Technical Setup

### Infrastructure

- [ ] **Domain name?**
  - Suggested: `tucita.com.ar` or `reservas.com.ar`
  - Purchased?: Yes / No
  - Name: _________________

- [ ] **Email service provider?**
  - Recommended: **Resend** (best for transactional emails)
  - Alternative: SendGrid, Mailgun
  - Decision: _________________
  - API key ready?: Yes / No

- [ ] **Database hosting?**
  - Recommended: **Neon** (PostgreSQL with free tier)
  - Alternative: Railway, Supabase
  - Decision: _________________

- [ ] **Application hosting?**
  - Recommended: **Vercel** (Next.js optimized)
  - Decision: _________________

- [ ] **File storage?**
  - Recommended: **Cloudinary** (image optimization + CDN)
  - Alternative: AWS S3, Uploadthing
  - Decision: _________________
  - Account created?: Yes / No

### MercadoPago

- [ ] **MercadoPago account ready?**
  - Test account: Yes / No
  - Production account: Yes / No
  - Access token obtained?: Yes / No

- [ ] **Webhook URL accessible?**
  - Need public URL for development
  - Use ngrok?: Yes / No
  - Or use Vercel preview?: Yes / No

---

## 👥 Access & Permissions

### Admin Setup

- [ ] **Admin user email?**
  - Who will be the first admin?: _________________
  - Should set up before launch

- [ ] **Who can verify businesses?**
  - Just one admin?: Yes / No
  - Multiple people?: Names: _________________

- [ ] **Who can create news posts?**
  - Admin only?: Yes / No
  - Verified businesses?: Yes / No
  - Decision: _________________

---

## 📋 Business Verification

### Required Documents

- [ ] **What documents for verification?**
  - ☑️ CUIT certificate (Constancia de CUIT from AFIP)
  - ☑️ Proof of address (utility bill, lease)
  - ☐ Business license? (depends on industry)
  - ☐ Professional credentials? (for health/legal services)
  - ☐ Photo ID of owner
  - Other: _________________

- [ ] **Verification process?**
  - How long should it take?: _____ days
  - Who reviews?: _________________
  - What if rejected?: _________________

- [ ] **Initial face-to-face verification?**
  - Where/how will this happen?: _________________
  - Required for all businesses?: Yes / No

---

## 🔐 Security & Compliance

### Data Protection

- [ ] **Privacy policy written?**
  - Yes / No / Need help writing

- [ ] **Terms of service written?**
  - Yes / No / Need help writing

- [ ] **Cookie consent needed?**
  - Yes / No (probably yes)

- [ ] **Data retention policy?**
  - How long to keep user data?: _____
  - How long to keep appointment history?: _____
  - Automatic deletion of cancelled bookings?: Yes / No

### Encryption

- [ ] **Encryption key for MercadoPago tokens?**
  - Will generate strong key: Yes / No
  - Store in environment variables: Yes / No

---

## 📱 Features & Limits

### Business Limits

- [ ] **Maximum professionals per business?**
  - Unlimited?: Yes
  - Or cap at: _____ professionals
  - Decision: _________________

- [ ] **Maximum services per location?**
  - Unlimited?: Yes
  - Or cap at: _____ services
  - Decision: _________________

- [ ] **Maximum locations per business?**
  - Unlimited?: Yes
  - Or cap at: _____ locations
  - Decision: _________________

### Appointment Rules

- [ ] **Default minimum advance booking?**
  - Suggested: 2 hours minimum
  - Your preference: _____ hours

- [ ] **Default maximum advance booking?**
  - Suggested: 30-90 days
  - Your preference: _____ days

- [ ] **Appointment duration limits?**
  - Minimum: _____ minutes (suggested: 15)
  - Maximum: _____ hours (suggested: 8)

---

## 💬 Communication

### Messaging

- [ ] **Real-time messaging priority?**
  - Must have in MVP?: Yes / No
  - Can wait for Phase 3?: Yes / No

- [ ] **Use WebSockets for real-time?**
  - Yes (more complex, instant updates)
  - No (polling, simpler, slight delay)
  - Decision: _________________

### WhatsApp Integration

- [ ] **WhatsApp Business API needed?**
  - Not for MVP, right?: Confirmed
  - Future phase?: Yes / No

---

## 🎨 Branding & Design

### Visual Identity

- [ ] **Business name finalized?**
  - Name: _________________

- [ ] **Logo ready?**
  - Yes / No / Will create

- [ ] **Brand colors chosen?**
  - Primary: _________________
  - Secondary: _________________
  - Or use default Tailwind blues?: Yes / No

- [ ] **Favicon ready?**
  - Yes / No

---

## 🚀 Launch Strategy

### Initial Users

- [ ] **First businesses confirmed?**
  - How many?: _____
  - Industries: _________________
  - Locations: _________________

- [ ] **Launch timeline?**
  - Target launch date?: _________________
  - Soft launch (invite only)?: Yes / No
  - Public launch date?: _________________

### Marketing

- [ ] **How will businesses find you?**
  - Direct outreach?: Yes / No
  - Social media?: Which platforms?: _________________
  - Local partnerships?: With whom?: _________________
  - Paid ads?: Budget?: _________________

- [ ] **Launch announcement plan?**
  - Where?: _________________
  - When?: _________________

---

## 📊 Analytics & Tracking

### Tools

- [ ] **Google Analytics setup?**
  - Tracking ID ready?: Yes / No
  - GA4 or Universal?: _________________

- [ ] **Error tracking?**
  - Use Sentry?: Yes / No
  - Alternative: _________________

- [ ] **Performance monitoring?**
  - Vercel Analytics?: Yes / No
  - Other tool?: _________________

---

## 🧪 Testing

### Test Data

- [ ] **Will create seed data?**
  - Test businesses?: _____ (suggested: 5-10)
  - Test services?: _____ per business
  - Test appointments?: Yes / No

- [ ] **Test payment flows?**
  - MercadoPago sandbox account ready?: Yes / No
  - Test credit cards documented?: Yes / No

---

## 📞 Support

### Customer Support

- [ ] **Support email?**
  - Email: _________________
  - Who monitors?: _________________

- [ ] **Support hours?**
  - Business hours: _________________
  - Response time goal: _____

- [ ] **FAQ page content?**
  - Need help writing?: Yes / No
  - Topics to cover: _________________

---

## ✅ Ready to Start Checklist

Before starting development, you should have:

**Critical (Must Have)**
- [ ] Domain name decided
- [ ] MercadoPago test account ready
- [ ] Admin email decided
- [ ] Subscription pricing decided
- [ ] Business verification process defined
- [ ] Email service chosen

**Important (Should Have)**
- [ ] Hosting providers decided
- [ ] File storage setup
- [ ] Brand colors chosen
- [ ] Privacy policy drafted
- [ ] First test businesses lined up

**Nice to Have**
- [ ] Logo designed
- [ ] Marketing plan outlined
- [ ] Analytics tools selected
- [ ] Support plan defined

---

## 🎯 Quick Decisions Needed

If you want to start ASAP, here are the **bare minimum decisions** needed:

1. **Subscription price**: AR$ _____ per month
2. **Domain name**: _________________
3. **Admin email**: _________________
4. **Email provider**: Resend / SendGrid / Other: _____
5. **Database**: Neon / Railway / Other: _____

Everything else can be decided during development!

---

**Status**: ⏳ Waiting for answers
**Next Step**: Once answered → Initialize project → Start Phase 1