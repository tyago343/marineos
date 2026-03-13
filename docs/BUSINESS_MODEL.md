# MarineOS - Business Model

## 1. Current Phase: Personal Project

MarineOS starts as a personal tool to manage boat maintenance. No monetization at this stage. The goal is to build a solid, useful product and validate the concept with real usage.

## 2. Market Opportunity

### The Problem in the Industry

- Boat maintenance is complex, poorly tracked, and expensive when neglected
- No dominant digital tool exists for recreational boat management (most solutions are enterprise-focused for fleets or marinas)
- Boat owners are a niche but high-spending demographic
- Marine technicians lack a platform to find clients outside of word-of-mouth and marina networks

### Comparable Products

- **Boatyard**: Basic maintenance logging, limited features
- **Saillogger**: Focused on sailing data, not maintenance
- **Dockwa**: Marina/mooring booking, not boat management
- **None** offer a comprehensive maintenance + inventory + stowage + technician marketplace solution

## 3. Revenue Models (Future Phases)

### Model A: Freemium SaaS

| Feature                 | Free           | Pro (monthly/annual)             |
| ----------------------- | -------------- | -------------------------------- |
| Number of boats         | 1              | Unlimited                        |
| Maintenance tracking    | Basic (manual) | Full (auto-schedules, reminders) |
| Stowage management      | Yes            | Yes                              |
| Inventory               | Up to 20 items | Unlimited                        |
| Checklists              | 2 templates    | Unlimited custom                 |
| Photo storage           | 100 MB         | 5 GB                             |
| OCR/AI (PDF processing) | No             | Yes                              |
| Push notifications      | No             | Yes                              |
| Email reminders         | No             | Yes                              |
| Export data (PDF/CSV)   | No             | Yes                              |
| Priority support        | No             | Yes                              |

**Estimated pricing**: 5-9 EUR/month or 49-89 EUR/year

### Model B: Technician Marketplace (Commission-Based)

This is the highest-potential revenue stream.

#### How It Works

1. **Technicians register** on the platform with:
   - Specialties: engine, sails, hull/painting, electrical, electronics, rigging
   - Certifications and experience
   - Service area (marinas/ports they cover)
   - Availability calendar
   - Rates (hourly or per-service)
   - Reviews and ratings from boat owners

2. **Boat owners** approaching a maintenance task see a CTA:
   - "Your oil change is due → **Do it myself** | **Find a technician**"
   - Clicking "Find a technician" shows available professionals filtered by:
     - Proximity to the boat's marina
     - Specialty matching the maintenance type
     - Rating and reviews
     - Availability

3. **Booking flow**:
   - Owner requests a quote or books directly
   - Technician confirms and schedules
   - Work is completed and logged in the boat's maintenance history
   - Owner pays through the platform

4. **Revenue**: Commission per transaction (10-15% from technician, or split between both parties)

#### Why This Works

- Boat owners already need these services but finding reliable technicians is hard
- Technicians get a steady pipeline of qualified leads
- Every maintenance reminder is a potential conversion to a paid service
- The platform has context (what engine, what maintenance is due) making matching precise
- Natural network effects: more boats → more technicians → more boats

### Model C: B2B / Marina Partnerships

- Marinas could offer MarineOS Pro to their berth holders as a value-add
- Marinas get insight into maintenance status of boats in their facility
- Revenue: per-marina license fee or per-user fee subsidized by the marina

### Model D: Data & Partnerships

- Anonymized maintenance data could be valuable to:
  - Engine manufacturers (real-world service intervals, failure patterns)
  - Marine insurance companies (well-maintained boats = lower risk)
  - Marine parts distributors (demand forecasting)
- Revenue: data licensing agreements (with user consent)

## 4. Recommended Phased Approach

### Phase 1 - Build & Validate (Current)

- Personal use, free
- Validate core features work and are useful
- Goal: Use it for one full season on your own boat

### Phase 2 - Open to Others

- Launch free version publicly
- Gather users and feedback from sailing communities (foros, clubs náuticos)
- Build reputation and user base
- Begin collecting data on what features drive engagement

### Phase 3 - Monetize

- Introduce Pro tier (freemium)
- Launch technician marketplace in 1-2 pilot ports/marinas
- Test commission rates and booking flow
- Goal: 100 active boats, 10 technicians, first revenue

### Phase 4 - Scale

- Expand technician marketplace geographically
- Marina partnerships
- Mobile app in app stores (Play Store + App Store)
- Marketing through nautical clubs, regattas, boat shows

## 5. Cost Structure (Estimated for early phases)

| Item                  | Estimated Cost               |
| --------------------- | ---------------------------- |
| Supabase Cloud (Pro)  | 25 USD/month                 |
| Vercel (Pro)          | 20 USD/month                 |
| Domain                | 12 USD/year                  |
| Apple Developer       | 99 USD/year                  |
| Google Play Developer | 25 USD one-time              |
| PowerSync             | Free tier (up to 1000 users) |
| Total (year 1)        | ~600 USD                     |

## 6. Key Metrics to Track

- Monthly active users (MAU)
- Boats registered
- Maintenance items tracked per boat
- Maintenance completion rate (items done on time)
- Technician marketplace: bookings per month, conversion rate from reminder to booking
- Churn rate (users who stop using the app)
- Net Promoter Score (NPS) from boat owners and technicians

## 7. Technician Marketplace - Architecture Notes

When implementing the marketplace (future phase), the database will need:

- `technicians` table (profile, specialties, certifications, service area)
- `technician_reviews` table (rating, comment, linked to completed service)
- `service_requests` table (owner → technician, linked to maintenance item)
- `payments` table (transaction tracking, commission calculation)
- Stripe Connect or similar for split payments

Keep this in mind when designing the initial schema - the `users` table should support a `user_type` field (boat_owner, technician, both) even if the marketplace is not built in Phase 1.
