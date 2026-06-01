# ezeserve - QR-based Restaurant Ordering System

## Original Problem Statement
Continue working on the existing GitHub repository (`jitangoyal22/ezeserve`), a QR-based restaurant ordering system. After a state corruption introduced git merge conflict markers across many critical files, restore the codebase and complete these new features:

1. **Order Management (Kanban):** Change Orders view to Kanban (without drag-and-drop). Use click-to-detail modals and dropdowns for status updates. Show table number and status on cards. Prevent large orders from taking up the full screen.
2. **Real-Time Updates:** WebSockets for instant new order notifications and status updates.
3. **Billing System:** Complete billing management for admins (generate, view, mark paid).
4. **Manual Order Creation:** Allow admins to create orders for walk-in customers.
5. **User Roles:** Super Admin (can see/manage all restaurants) and Restaurant Admin (can only manage their own). No public signup. Default super admin seeded on startup.
6. **UI/Theme:** Maintain the app's purple gradient theme (`#667eea → #764ba2`) across all new and existing pages.

## Architecture
```
/app/
├── backend/
│   ├── server.py        FastAPI + WebSockets + role-based auth
│   ├── requirements.txt
│   └── .env             MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, CLOUDINARY_*
└── frontend/
    ├── package.json
    └── src/
        ├── App.js
        ├── components/  AdminLayout, ProtectedRoute, ui/
        └── pages/       AdminLogin, AdminDashboard, AdminOrders (Kanban),
                         AdminMenu, AdminTables, AdminRestaurants (super-admin only),
                         AdminBilling (new), AdminUsers (new, super-admin only),
                         CustomerMenu, Cart, OrderStatus, LandingPage
```

## DB Schema
- `admin_users`: `{id, email, password (bcrypt), name, role, restaurant_id, created_at}`
- `restaurants`: `{id, name, location, contact, tax_percent, created_at}`
- `categories`: `{id, restaurant_id, name, display_order, created_at}`
- `menu_items`: `{id, restaurant_id, category_id, name, description, price, image_path, is_available, created_at}`
- `orders`: `{id, restaurant_id, table_number, items[], total_amount, status, waiting_time, customer_notes, created_by, created_at, updated_at}`
- `tables`: `{id, restaurant_id, table_number, capacity, status, created_at}`
- `bills`: `{id, bill_number, order_id, restaurant_id, table_number, items[], subtotal, tax_percent, tax_amount, discount_amount, total, payment_method, payment_status, created_at, paid_at}`

## Key API Endpoints
- `POST /api/auth/login` — JWT login
- `GET /api/auth/me` — Current user
- `GET/POST/DELETE /api/admin/users` — Super-admin only
- `GET/POST/PUT/DELETE /api/restaurants` — Listing scoped by role
- `POST /api/orders` (public customer) | `POST /api/orders/manual` (admin walk-in)
- `PUT /api/orders/{id}/status` — Status update (broadcasts WS event)
- `GET/POST /api/bills` | `PUT /api/bills/{id}/pay`
- `WS /api/ws/restaurant/{restaurant_id}` — New/updated orders
- `WS /api/ws/order/{order_id}` — Order status pushes

## Implemented Features (Feb 2026)
- ✅ Recovered codebase from git merge conflict corruption
- ✅ JWT auth with bcrypt, role-based access (super_admin / restaurant_admin)
- ✅ Default super admin seeded on startup (`admin@ezeserve.com` / `admin123`)
- ✅ Public signup disabled (login-only screen)
- ✅ Super-admin-only Users page (create / list / delete admins)
- ✅ Super-admin-only Restaurants page guard (was already routed)
- ✅ Orders Kanban (click-to-detail, no drag-drop) with status dropdown + waiting time
- ✅ Manual Order modal (admin creates walk-in orders)
- ✅ Real-time WebSocket updates for new orders & status changes (with polling fallback)
- ✅ Billing page (list, filter paid/unpaid, generate bill from completed order, mark paid)
- ✅ Bill detail modal with subtotal/tax/discount/total breakdown
- ✅ Restaurants/Orders/Bills scoped to restaurant for restaurant_admin; full access for super_admin
- ✅ Purple gradient theme preserved (`#667eea → #764ba2`) across new pages

## Backlog (P1/P2)
- P1: Update AdminDashboard cards to purple-gradient theme (currently uses orange #E25E3E)
- P1: Add WebSocket to OrderStatus.js customer page (currently polling)
- P2: Bill print/PDF export
- P2: Order edit (change items after creation)
- P2: Dialog accessibility warnings cleanup
- P2: Restaurant switcher for super_admin in a global header (currently per-page)
