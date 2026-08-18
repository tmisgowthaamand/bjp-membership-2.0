# Multi-Tier Admin Panel & Interactive Tamil Nadu Map Architecture Plan

**Project**: BJP Tamil Nadu Local Body Elections 2026-27 (Membership & Application Management System)  
**Reference Analysis**: [BJP Schemes Repository](https://github.com/tmisgowthaamand/BJP-schemes) | [Vercel Deployment](https://bjp-schemes.vercel.app/)  
**Target Roles**: Super Admin | State Admin | District Admin  

---

## 1. Executive Overview & Objectives

The goal of this architectural upgrade is to expand the existing BJP Membership Admin System into a **Multi-Tier Role-Based Access Control (RBAC)** governance dashboard. 

The dashboard will feature:
1. **Interactive Tamil Nadu District Map**: Real-time vector SVG map of all 38 Tamil Nadu districts.
2. **Dynamic Filtering**: Clicking any district on the TN map immediately updates the adjacent application dashboard table to display candidate applications for that specific district.
3. **Role-Based Permissions**:
   - **Super Admin & State Admin**: Full state-wide visibility + capability to **Edit** and **Delete** candidate applications.
   - **District Admin**: District-scoped visibility (View-only), displaying assigned district map, hover counts, and candidate lists without write/delete permissions.
4. **Cross-Device Responsiveness**: Pixel-perfect layout adaptation from 320px mobile screens (iPhone, Android, Galaxy Fold) to iPads, Tablets, and 4K iMac/Desktop displays.

---

## 2. Source Analysis: `BJP-schemes` vs. `BJP-membership-2.0`

### Comparative Architecture

| Feature Component | Reference (`BJP-schemes`) | Current (`bjp-membership-2.0`) | Proposed Admin Panel Upgrade |
| :--- | :--- | :--- | :--- |
| **Authentication** | Single Hardcoded Credential | JWT / Express Session Cookie | Multi-tier RBAC (`super_admin`, `state_admin`, `district_admin`) |
| **District Visualization** | Static List / Basic Selector | Text Metrics Card | **Interactive Vector SVG Map** (Hover Counts, Active State, Click Filtering) |
| **Data Scoping** | Global Unfiltered View | Global List with Pagination | **District-Bound Context**: District Admins see only their assigned district data |
| **Application Actions** | View Details & Export PNG | View & Update Photo / ID | **Full Management Suite**: Edit Voter/Ward Data + Delete Record with Audit Trail |
| **Mobile Responsiveness** | Responsive Grid | Stacked Drawer Sidebar | **Adaptive Dual Mode**: Map/Table Side-by-Side on Desktop, Toggle Tabs on Mobile |

---

## 3. Role-Based Access Control (RBAC) Specification

```
                          ┌──────────────────────────┐
                          │   Authentication Gate    │
                          └────────────┬─────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
      ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
      │   SUPER ADMIN    │   │   STATE ADMIN    │   │  DISTRICT ADMIN  │
      └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
               │                      │                      │
   ┌───────────┴───────────┐ ┌────────┴───────────┐ ┌────────┴───────────┐
   │ • State-Wide TN Map   │ │ • State-Wide TN Map │ │ • District Map    │
   │ • Click District Filter││ • Click Filter     │ │ • Hover Count     │
   │ • View Applications   │ │ • View Applications │ │ • View Only List  │
   │ • EDIT Application    │ │ • EDIT Application  │ │ • NO Edit Action  │
   │ • DELETE Application  │ │ • DELETE Application│ │ • NO Delete Action│
   │ • Manage Admin Users  │ │ • View Reports      │ │ • Export PDF/CSV  │
   └───────────────────────┘ └─────────────────────┘ └───────────────────┘
```

### Detailed Role Matrix

| Role | Scope | TN Map View | District Filter | Edit App | Delete App | Manage Admins |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `super_admin` | All 38 Districts | Full Interactive Map | All Districts | ✅ Yes | ✅ Yes | ✅ Yes |
| `state_admin` | All 38 Districts | Full Interactive Map | All Districts | ✅ Yes | ✅ Yes | ❌ No |
| `district_admin` | Assigned District Only | Assigned District Map | Scoped | ❌ View Only | ❌ View Only | ❌ No |

---

## 4. Backend Database & API Design

### 4.1. Admin User Model Schema (`admin_users` Collection)

```json
{
  "_id": "ObjectId",
  "username": "chennai_admin",
  "email": "admin.chennai@bjp.org",
  "password_hash": "$2b$10$e8Z...",
  "role": "district_admin",
  "assigned_district": "Chennai",
  "full_name": "K. R. Vasanth",
  "mobile": "9876543210",
  "is_active": true,
  "created_at": "2026-08-18T10:00:00.000Z",
  "last_login": "2026-08-18T11:30:00.000Z"
}
```

### 4.2. API Endpoints Specification

#### A. Authentication & Session Management
- `POST /api/admin/login` — Authenticates user and returns HTTP-only session cookie + JWT payload with `role` and `assigned_district`.
- `GET /api/admin/session` — Validates active admin session and user permissions.
- `POST /api/admin/logout` — Destroys active session.

#### B. District Map & Analytics API
- `GET /api/admin/district-analytics`
  - **Super/State Admin**: Returns application counts for all 38 districts of Tamil Nadu.
  - **District Admin**: Returns analytics strictly for `assigned_district`.
  - **Response Payload**:
    ```json
    {
      "success": true,
      "total_applications": 12450,
      "district_counts": {
        "Chennai": 1420,
        "Coimbatore": 980,
        "Madurai": 850,
        "Ariyalur": 310,
        "Thanjavur": 640
      }
    }
    ```

#### C. Application Management API (With RBAC Enforcement)
- `GET /api/admin/applications?district=Chennai&page=1&limit=20`
  - Retrieves paginated applications. For `district_admin`, automatically locks filter to `assigned_district`.
- `GET /api/admin/applications/:id` — Fetches full details for a single candidate.
- `PUT /api/admin/applications/:id` — **Super & State Admin Only**. Updates applicant details (Voter Name, EPIC, Contest Preference, Local Body, Ward, Photo URL, Document URL).
- `DELETE /api/admin/applications/:id` — **Super & State Admin Only**. Removes candidate record with audit logging.

---

## 5. Interactive Tamil Nadu & District Map Component Architecture

### 5.1. SVG Vector Map Structure (`TamilNaduMap.jsx`)

The Tamil Nadu map is rendered using vector SVG paths for all 38 districts:
- **`path` Elements**: Each district path is tagged with `data-district="DistrictName"`.
- **Interactive State**:
  - `onMouseEnter`: Displays a sleek floating tooltip with District Name + Live Applicant Count.
  - `onClick`: Sets active district state, triggers parent `onSelectDistrict("DistrictName")`, and highlights the selected district SVG path in BJP Saffron (`#f76201`).
- **Responsive ViewBox**: Configured with `viewBox="0 0 800 1000"` and `width="100%"` for sharp rendering on all screen resolutions.

```jsx
// Conceptual Structure for TamilNaduMap.jsx
import React, { useState } from 'react'

export default function TamilNaduMap({ districtCounts, selectedDistrict, onSelectDistrict, isDistrictAdmin }) {
  const [hoveredDistrict, setHoveredDistrict] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e, districtName) => {
    setHoveredDistrict(districtName)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="tn-map-container" style={{ position: 'relative', width: '100%' }}>
      <svg viewBox="0 0 800 1000" className="tn-svg-map">
        {/* District Paths mapped dynamically */}
        {DISTRICT_SVG_PATHS.map((d) => {
          const count = districtCounts[d.name] || 0
          const isSelected = selectedDistrict === d.name
          return (
            <path
              key={d.id}
              d={d.pathData}
              className={`district-path ${isSelected ? 'active' : ''}`}
              fill={isSelected ? '#f76201' : count > 500 ? '#ff8533' : '#ffd1b3'}
              onMouseMove={(e) => handleMouseMove(e, d.name)}
              onMouseLeave={() => setHoveredDistrict(null)}
              onClick={() => !isDistrictAdmin && onSelectDistrict(d.name)}
            />
          )
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredDistrict && (
        <div
          className="map-tooltip"
          style={{ top: tooltipPos.y - 40, left: tooltipPos.x + 15, position: 'fixed' }}
        >
          <strong>{hoveredDistrict}</strong>
          <div>Applicants: {districtCounts[hoveredDistrict] || 0}</div>
        </div>
      )}
    </div>
  )
}
```

---

## 6. Dashboard Layout & Screen Flow

### 6.1. Super & State Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BJP Tamil Nadu Elections 2026-27 | Admin Panel         [Role: Super Admin] │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ • Dashboard   │  TOTAL APPLICANTS: 12,450 | ACTIVE DISTRICT: Chennai (1,420)  │
│ • Applications├──────────────────────────────┬──────────────────────────────┤
│ • Districts   │  TAMIL NADU DISTRICT MAP     │  CANDIDATE APPLICATIONS      │
│ • Reports     │                              │                              │
│ • Admins      │  ┌────────────────────────┐  │  [Search Name / Application] │
│ • Settings    │  │                        │  │ ┌──────────────────────────┐ │
│               │  │  [ Interactive TN Map ]│  │ │ ID: BJP-2026-NHI234      │ │
│               │  │  (Hover: Count)        │  │ │ Candidate: Dhanapal      │ │
│               │  │  (Click: Selects District)│ │ Contest: Ward Member     │ │
│               │  │                        │  │ │ Actions: [EDIT] [DELETE] │ │
│               │  └────────────────────────┘  │ └──────────────────────────┘ │
└───────────────┴──────────────────────────────┴──────────────────────────────┘
```

### 6.2. District Admin Dashboard Layout (View-Only)

- **Map Display**: Shows District Map SVG for assigned district (e.g. Chennai).
- **Hover/View**: Displays live count of candidates in that district.
- **Table View**: Lists all applications for that district with **[View Details]** button. Edit and Delete action buttons are hidden.

---

## 7. Comprehensive Responsive Layout Architecture

To deliver an exceptional user experience across all device form factors, the dashboard utilizes an **Adaptive Breakpoint System**:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            RESPONSIVE BREAKPOINTS                        │
 ├───────────────────┬───────────────────┬─────────────────────────────────┤
 │ Device Category   │ Width Range       │ Layout Strategy                 │
 ├───────────────────┼───────────────────┼─────────────────────────────────┤
 │ Mobile Portrait   │ 320px - 480px     │ Mobile Drawer Sidebar           │
 │ (iPhone, Android) │                   │ Toggle Tabs: [Map] | [List]     │
 │                   │                   │ Card-based List View            │
 ├───────────────────┼───────────────────┼─────────────────────────────────┤
 │ Foldables         │ 481px - 767px     │ Stacked Column View             │
 │ (Galaxy Fold/Flip)│                   │ Compact Map Header              │
 ├───────────────────┼───────────────────┼─────────────────────────────────┤
 │ Tablets & iPads   │ 768px - 1024px    │ Collapsible Mini Sidebar        │
 │ (iPad, Tab S8)    │                   │ Stacked Map above Table Grid    │
 ├───────────────────┼───────────────────┼─────────────────────────────────┤
 │ Laptops & iMacs   │ 1025px and above  │ Expanded Navigation Sidebar     │
 │ (MacBook, 4K)     │                   │ Side-by-Side Dual Panel (Map+List)│
 └───────────────────┴───────────────────┴─────────────────────────────────┘
```

### Mobile Layout Optimizations (`320px - 767px`)
- **View Toggle Buttons**: Mobile users can toggle between `[ 🗺️ District Map ]` and `[ 📋 Applications ]`.
- **Touch Tooltips**: Tapping a district on mobile opens a bottom sheet card displaying district statistics and an **"Inspect District"** button.
- **Card-Based Applications**: Replaces dense HTML table with stacked mobile application cards.

---

## 8. Implementation Roadmap & Step-by-Step Milestones

### Phase 1: Database & RBAC API Expansion
1. Implement `admin_users` MongoDB collection & seed Super Admin, State Admin, and District Admin accounts.
2. Update Express auth middleware `requireRole(['super_admin', 'state_admin'])` for Edit and Delete routes.
3. Add `PUT /api/admin/applications/:id` and `DELETE /api/admin/applications/:id` endpoints with audit logs.

### Phase 2: Vector SVG Map & District Filtering
1. Create `TamilNaduMap.jsx` vector component containing exact path data for all 38 districts.
2. Implement hover tooltips and interactive click selection.
3. Connect map selection state to candidate applications list filtering.

### Phase 3: Edit & Delete Modal UI
1. Build `EditApplicationModal.jsx` allowing Super and State Admins to edit candidate data, photo URLs, and position preferences.
2. Build `DeleteConfirmModal.jsx` with strict double-confirmation prompt before record removal.
3. Enforce view-only mode for District Admin accounts.

### Phase 4: Responsive Polish & Deployment
1. Apply responsive media queries for Mobile, Foldables, iPads, and iMac displays.
2. Verify production build on Vite and deploy to Vercel + Render backend.

---

## 9. Deliverable Summary & Next Steps

This plan provides the complete blueprint for adding **Multi-Tier RBAC**, **Interactive Tamil Nadu Map District Filtering**, **Edit/Delete Management**, and **Cross-Device Responsiveness** to the BJP Membership system.

Upon your approval, we can begin executing **Phase 1** and **Phase 2** directly in the codebase!
