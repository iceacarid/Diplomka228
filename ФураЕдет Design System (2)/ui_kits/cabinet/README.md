# Cabinet UI Kit — Client / Manager / Admin

A unified back-office shell for ФураЕдет, with a topbar role switcher to demo the three role views.

## Files
- `index.html` — composes everything; topbar switcher swaps the dashboard.
- `Chrome.jsx` — `Sidebar`, `Topbar`, `Card`, `StatTile`, `Btn`, `Field`, `DataTable`, `StatusPill`, `RolePill`.
- `Client.jsx` — `ClientDashboard`. Active shipment tracker with a route progress bar, quick-order form, orders table.
- `Manager.jsx` — `ManagerDashboard`. Queue (priority dot + assign action), drivers list with online dot, ops map (placeholder grid w/ pinned cities).
- `Admin.jsx` — `AdminDashboard`. KPI tiles, revenue bar chart (last 14 days), system health rows, users table, audit log.

## Layout
- **Sidebar 240px**, sticky, `var(--navy-2)`. Active item: gold-tinted background + 2px gold left border, gold text.
- **Topbar 68px**, sticky, with section title + uppercase eyebrow ("КАБИНЕТ МЕНЕДЖЕРА").
- **Main**, `var(--navy)` background, content padded 36px, vertical 28px gaps between blocks.
- Tables, cards, KPI tiles all share the same border + radius pattern (`1px rgba(255,255,255,0.06)` / `border-radius: 8px`).

## Demo / Role switcher
The Topbar has a 3-segment toggle: КЛИЕНТ / МЕНЕДЖЕР / АДМИН. Switching swaps:
- The sidebar nav items
- The user identity (avatar + name + email)
- The dashboard component
- The page title

In production each role would log into their own subdomain — this is a designed demo.

## Status pills
`StatusPill` covers: new, inwork, transit, delivered, cancelled, pending, active, blocked.
`RolePill` covers: client, manager, admin (gold for manager, blue for client, red for admin).
