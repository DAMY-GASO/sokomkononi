# SokoMkononi — Awamu 0 & 1 (Scaffold)

Muundo wa awali wa mradi kwa mujibu wa `sokomkononi-muongozo.md`:
- **backend/** — Node.js + Express + Prisma + PostgreSQL
- **frontend/** — React (Vite) + Tailwind + React Router

## Kilichokamilika (Awamu 0-1)
- Database schema kamili (users, categories, properties, deal_rooms, deal_messages,
  reservations, waiting_list, transactions, reviews, notifications, fee_settings)
- Authentication (register/login/me) — akaunti moja kwa Buy + Sell
- Properties: list (buyer feed), my-listings (seller), create (na category-specific fields)
- Categories + seed ya categories 5 za MVP + admin wa default + fee settings za default
- Frontend: Landing page (CTA mbili), Login/Register, Dashboard (toggle Nunua/Uza),
  PropertyForm yenye fields za category, PropertyDetail (kitufe Nunua Hii / Join Waiting List)

## Bado (stubs zenye TODO — zinaonyesha 501 kwa sasa)
- Deal Room (negotiation, agreed price, create transaction) — Awamu 4
- Reservation flow kamili (payment, inspection decisions, payment proof, confirm) — Awamu 5
- Waiting List logic — Awamu 5
- My Transactions — Awamu 5
- Admin dashboard (logic halisi) — Awamu 6
- Notifications engine — Awamu 7
- Boosting/Leading/Ads — Awamu 8

## Kuanzisha Backend
```bash
cd backend
cp .env.example .env   # weka DATABASE_URL yako ya PostgreSQL
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
API itaendesha kwenye http://localhost:4000

## Kuanzisha Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Itaendesha kwenye http://localhost:5173

## Akaunti ya Admin ya Default (baada ya seed)
- Email: [email protected]
- Password: Admin@12345
(Badilisha mara moja baada ya login ya kwanza)
