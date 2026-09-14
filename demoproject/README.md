# City Bus Tracker (Frontend Prototype)

> **IMPORTANT NOTICE:** This project is **FRONTEND ONLY**.
> It uses **mock data** and does **NOT** have a backend.
> It runs 100% in the browser using HTML, CSS, and Vanilla JavaScript.
> Do NOT install or run Node.js, Express, PostgreSQL, Prisma, MongoDB, Socket.IO, or JWT.

---

## 1. What the Project Is

**City Bus Tracker** is a comprehensive, responsive transit application supporting three conceptual user roles:
1. **Passenger**: Finds buses by selecting **Boarding Stop ➔ Destination Stop** based on strictly ordered routes.
2. **Driver**: Operates assigned buses, controls trip lifecycles (Start, Pause, End), and simulates driver mobile GPS streaming.
3. **Admin**: Manages the complete transit system—most importantly, **reordering stops**, adding/removing stations, registering buses, and overseeing live fleet telemetry.

---

## 2. Three User Roles & Switching

Instead of real password authentication, the prototype provides a simple role-selection mechanism:

* **Navbar Role Switcher**: Click the `[ Role: Passenger / Driver / Admin ▼ ]` dropdown at the top-right of any screen to instantly jump between interfaces.
* **Role Launchpad Screen**: Open [pages/role-select.html](pages/role-select.html) to choose between:
  - 👤 **Passenger Portal**: [index.html](index.html)
  - 🚌 **Driver Dashboard**: [pages/driver.html](pages/driver.html)
  - ⚙️ **Admin Management**: [pages/admin.html](pages/admin.html)

---

## 3. Passenger Interface

The passenger interface remains completely functional:
* **Boarding & Destination Selection**: Dropdowns populated with city stops (`Jalukbari`, `Adabari`, `Paltan Bazar`, `Ganeshguri`, `Beltola`, `Narengi`, etc.).
* **Ordered Route Search**: Evaluates stop sequence:
  $$\text{Valid if: } \text{index}(\text{Boarding Stop}) < \text{index}(\text{Destination Stop})$$
  Example:
  - **Paltan Bazar ➔ Ganeshguri**: **VALID** on Route 1.
  - **Ganeshguri ➔ Paltan Bazar**: **INVALID** on Route 1 (flags wrong direction, matches return Route 3).
* **Live Map**: Leaflet + OpenStreetMap displaying route polylines, stops, and simulated moving bus markers.
* **Bus Details**: Ordered vertical stop timeline (`✓ Passed`, `● Current`, `Upcoming`) and mini live map.
* **Routes Directory & Profile**: Timetables, commuter stats, and recent searches.

---

## 4. Driver Interface ([pages/driver.html](pages/driver.html))

Designed for in-vehicle transit drivers:
* **Driver Information**: Driver Name (*Rahul Sharma*), Driver ID (*D001*), Assigned Bus (*Bus 001*), Assigned Route (*Route 1*).
* **Driver Selector**: Switch between mock driver profiles (`D001`, `D002`, `D003`) to test different vehicle and route assignments.
* **Trip Lifecycle Controls**:
  - **Start Trip**: Begins route navigation and launches simulated GPS streaming.
  - **Pause Trip**: Pauses vehicle telemetry (traffic halt/break).
  - **Resume Trip**: Resumes active route transit.
  - **End Trip**: Concludes trip at terminal station.
* **Simulated Driver Phone GPS**:
  - Automatically advances coordinates along route stops every 3.5 seconds.
  - Updates current stop, next stop, real-time speed (`28 km/h`), and route progress bar.
  - Telemetry synchronization: Updating bus coordinates here immediately reflects in the Passenger map!

---

## 5. Admin Portal ([pages/admin.html](pages/admin.html))

The administrator portal provides complete control over transit operations:

### A. Route Management ([pages/admin-routes.html](pages/admin-routes.html)) — *CRITICAL*
* **Display Routes**: Visual cards showing route number, name, distance, frequency, and the exact ordered sequence of stops.
* **Edit Route & Reorder Stops**:
  - Click **Edit Route** on any route line.
  - **Move Stop Up (`↑`) / Move Stop Down (`↓`)**: Reorder stops sequentially.
  - **Add Stop (`[+ Add Stop]`)**: Select any available city stop from the dropdown to append it to the route.
  - **Remove Stop (`[Remove]`)**: Prompts confirmation: *"Are you sure you want to remove X from this route?"*
  - **Save Changes (`[Save Changes]`)**: Persists the new ordered array to `localStorage`.
  - *Immediate Passenger Impact*: Reordering stops immediately alters the passenger bus search engine validation!
* **Add New Route (`[+ Add New Route]`)**: Create new corridor lines by providing Route ID, Name, Color, and selecting ordered stops.
* **Delete Route**: Deletes a route after confirmation.

### B. Stop Registry ([pages/admin-stops.html](pages/admin-stops.html))
* Data table: Stop ID, Stop Name, Landmark, Latitude, Longitude, and Status.
* Add, edit, and delete stops.

### C. Bus Fleet Management ([pages/admin-buses.html](pages/admin-buses.html))
* Data table: Bus ID, Bus Number, Model, Assigned Route, Assigned Driver, and Operational Status.
* Register buses, change route assignments, assign drivers, and toggle live/maintenance states.

### D. Driver Staff Management ([pages/admin-drivers.html](pages/admin-drivers.html))
* Data table: Driver ID, Name, Phone, License, Assigned Bus, Assigned Route, and Duty Status.
* Add new drivers, edit details, and assign buses.

### E. Live Fleet Monitoring ([pages/admin-live-buses.html](pages/admin-live-buses.html))
* Interactive Leaflet map plotting all running buses in real time.
* Live telemetry table showing current stop, next stop, and speed with automatic 3-second refresh.

---

## 6. Project Directory Structure

```text
demoproject/
│
├── index.html                   # Passenger Landing Page & Bus Finder
│
├── pages/
│   ├── role-select.html         # Role Selection Launchpad (Passenger, Driver, Admin)
│   ├── passenger.html           # Passenger alias redirect
│   ├── driver.html              # Driver Dashboard & Trip GPS Simulator
│   ├── admin.html               # Admin Dashboard Overview & KPI Metrics
│   ├── admin-routes.html        # Route Management (Reorder [↑][↓], Add/Remove Stops)
│   ├── admin-stops.html         # Stop Registry (CRUD)
│   ├── admin-buses.html         # Bus Fleet Management (CRUD & Assignments)
│   ├── admin-drivers.html       # Driver Staff Management (CRUD & Assignments)
│   ├── admin-live-buses.html    # Admin Live Fleet Map & Telemetry Stream
│   ├── admin-users.html         # Passenger User Accounts Directory
│   ├── live-map.html            # Passenger Interactive Transit Map
│   ├── routes.html              # Passenger Routes Directory
│   ├── bus-details.html         # Passenger Bus Inspection & Stop Timeline
│   └── profile.html             # Passenger Commuter Profile
│
├── css/
│   ├── style.css                # Base theme, CSS variables, and typography
│   ├── layout.css               # App shell, navbar, sidebar & dashboard grid
│   ├── components.css           # Cards, buttons, modals, reorder buttons & tables
│   └── responsive.css           # Responsive breakpoints for mobile, tablet & desktop
│
├── js/
│   ├── mock-data.js             # Unified data layer with localStorage persistence & CRUD
│   ├── main.js                  # Shared app utilities, digital clock & role switcher
│   ├── search.js                # Passenger ordered route search engine
│   ├── live-map.js              # Passenger Leaflet map manager & GPS loop
│   ├── bus-details.js           # Passenger bus inspection & stop timeline
│   ├── routes.js                # Passenger route directory explorer
│   ├── profile.js               # Passenger profile & search replay
│   ├── driver.js                # Driver trip controller & phone GPS simulation
│   ├── admin.js                 # Admin dashboard overview KPIs & reset handler
│   ├── admin-routes.js          # Admin route management & stop reordering logic
│   ├── admin-stops.js           # Admin stop CRUD logic
│   ├── admin-buses.js           # Admin bus fleet CRUD logic
│   ├── admin-drivers.js         # Admin driver CRUD logic
│   └── admin-live-buses.js      # Admin live fleet map & telemetry controller
│
├── assets/
│   ├── images/                  # App branding (logo.svg)
│   └── icons/                   # Transit icons (bus.svg, map-pin.svg)
│
└── README.md                    # Project documentation
```

---

## 7. How to Run

No build tools (`npm`, `webpack`, `vite`) are required.

### Method 1: Direct in Browser
Open `index.html` or `pages/role-select.html` directly in Chrome, Edge, Safari, or Firefox.

### Method 2: Local HTTP Server (Recommended)
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000` or `http://localhost:8000/pages/role-select.html`.

---

## 8. Resetting Demo Data

If you modify or delete routes, stops, or buses while testing the Admin interface, you can instantly restore the pristine default dataset by clicking **🔄 Reset to Default Demo Data** on the [Admin Dashboard](pages/admin.html).
