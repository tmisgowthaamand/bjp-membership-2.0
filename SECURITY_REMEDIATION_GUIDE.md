# Security Remediation Guide: 3D Vector Maps & Credential Hardening

This document provides a technical explanation and step-by-step remediation instructions for securing 3D map assets, access-controlled admin routes, and database credentials.

---

## 1. DigitalOcean Database Credential Leak (High Priority)

### Problem
In `backend/render.yaml`, the DigitalOcean MongoDB connection string containing username and password (`doadmin:K1jb38...`) is committed in plaintext.

```yaml
# ❌ VULNERABLE: Hardcoded credential in tracked configuration
- key: MONGODB_VOTER_URI
  value: mongodb+srv://doadmin:K1jb38520POU7pv4@db-mdb-blr1-62418-1d213a0a.mongo.ondigitalocean.com/voter_db?authSource=admin&tls=true
```

### Remediation Steps

#### Step 1: Rotate Password in DigitalOcean
1. Log in to the [DigitalOcean Cloud Console](https://cloud.digitalocean.com/).
2. Navigate to **Databases** → select your MongoDB cluster (`db-mdb-blr1-62418-1d213a0a`).
3. Under **Users & Databases**, reset/change the password for the `doadmin` user or create a dedicated application user with read-only permissions on `voter_db`.

#### Step 2: Remove Plaintext from `render.yaml`
Update `backend/render.yaml` to mark the environment variable as secret (`sync: false`):

```yaml
# ✅ SECURE: Value managed via Render dashboard secret store
- key: MONGODB_VOTER_URI
  sync: false
- key: MONGODB_APP_URI
  sync: false
```

#### Step 3: Set Secrets in Environment Configuration
- In Render Dashboard: Add `MONGODB_VOTER_URI` under **Environment Variables**.
- In Local Development (`backend/.env`): Ensure `.env` is listed in `.gitignore` and never committed to Git.

---

## 2. 3D Map Vector Assets & Script Integrity (Architecture Review)

### Status: Currently Secure & Locally Bundled
- **GeoJSON Source**: Served from local static directory `/tn-districts.geojson` (located at `frontend/public/tn-districts.geojson`). No external GIS servers are queried.
- **3D Engine**: Three.js, `@react-three/fiber`, and `@react-three/drei` are bundled during `vite build` into `dist/assets/vendor-three-*.js`. No dynamic script injection occurs.

### Recommended Hardening: Subresource Integrity (SRI) for CDN Stylesheets
In `frontend/index.html`, external CDN links can be hardened by adding cryptographic SRI hashes:

```html
<!-- Example of SRI hardening for Bootstrap Icons CDN -->
<link 
  rel="stylesheet" 
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
  integrity="sha384-XGjxtQfXaH2TNPFa9x+v++5IVZ0xIAUngbt6nuSh2YAAUAng8kg20Y76P5KsPWWK"
  crossorigin="anonymous"
/>
```

Alternatively, install Bootstrap Icons locally via npm (`npm i bootstrap-icons`) to eliminate third-party CDN dependencies altogether.

---

## 3. Admin Route Access Control Verification

### Protection Verification
All admin routes and 3D map data endpoints are protected by JWT Bearer token authentication and role checking:

```javascript
// backend/src/routes/admin.js
router.get('/district-analytics', requireAdmin, getDistrictAnalytics)
router.get('/stats', requireAdmin, getDashboardStats)
router.get('/applications', requireAdmin, getApplications)
```

### Security Checklist

- [x] **Rate Limiting**: Rate limiter active on `/api/send-otp` (10 req/10m) and `/admin/api/login` (20 req/10m).
- [x] **Role Separation**: Public chatbot routes cannot access admin aggregate statistics or district breakdown maps.
- [x] **Static Asset Isolation**: GeoJSON contains only geographical boundary coordinates; no voter or candidate PII is included in the static file.
- [ ] **Credential Rotation**: Rotate DigitalOcean database password and update Render environment secrets.
