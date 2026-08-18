# FINAL MASTER PROMPT — EXACT TAMIL NADU DISTRICT MAP

## PRIMARY REQUIREMENT

Replace the current Tamil Nadu map implementation completely.

The required result must look like a **real administrative map of Tamil Nadu**, similar to the provided reference screenshot:

- One single continuous Tamil Nadu state silhouette
- Actual Tamil Nadu geographic outline
- Actual 38 district boundaries drawn INSIDE the state
- Districts remain geographically connected
- No floating district cards
- No rectangular district boxes
- No tiles
- No 3D individual district blocks
- No artificial arrangement of districts
- No isometric map
- No exploded map
- No separated districts

The entire Tamil Nadu state must visually read as **ONE MAP**.

---

# 1. REFERENCE IMAGE REQUIREMENT

Use the uploaded reference image as the visual direction.

The target appearance is:

```text
                 NORTH
              ┌─────────┐
             / Chennai  \
            /────────────\
           /              \
          /  District      \
         │   boundaries     │
         │                  │
         │   District       │
         │   boundaries     │
         │                  │
          \                /
           \              /
            \            /
             \          /
              \________/
              Kanyakumari
```

The actual map must have:

**ONE OUTER TAMIL NADU BORDER**

and inside that:

**38 REAL DISTRICT BOUNDARIES**

---

# 2. THE MOST IMPORTANT DIFFERENCE

### WRONG

The current implementation does something like:

```text
[Chennai]
[Salem]
[Madurai]
[Coimbatore]
[Tiruppur]
```

with individual rectangular or polygon cards positioned next to each other.

This is NOT acceptable.

### CORRECT

The implementation must work like this:

```text
┌─────────────────────────────────┐
│                                 │
│       TAMIL NADU OUTLINE        │
│                                 │
│   ┌─────┬────────┬─────────┐   │
│   │     │        │         │   │
│   ├─────┼────────┼─────────┤   │
│   │     │        │         │   │
│   ├─────┴────────┼─────────┤   │
│   │              │         │   │
│   │       REAL DISTRICTS   │   │
│   │              │         │   │
│   └──────────────┴─────────┘   │
│                                 │
└─────────────────────────────────┘
```

The internal lines must follow the **actual geographic district boundaries**.

---

# 3. USE ONE REAL GEOGRAPHIC DATASET

Use a proper Tamil Nadu administrative district GeoJSON / TopoJSON dataset.

The dataset must contain:

```text
Tamil Nadu state boundary
+
38 district polygons
```

Do not construct the map yourself.

Do not generate district shapes using CSS.

Do not use rectangles.

Do not approximate the boundaries.

Do not use a generic India map and crop it.

Do not use a screenshot as the actual interactive map.

---

# 4. RENDERING MODEL

The map should fundamentally be:

```text
GeoJSON
     ↓
38 district geographic polygons
     ↓
SVG paths
     ↓
Single Tamil Nadu map
```

Each district should be an SVG `<path>` based on its actual geographic geometry.

Example architecture:

```jsx
<svg>
    <g className="tamil-nadu-map">

        <path
            d="REAL CHENNAI GEOMETRY"
        />

        <path
            d="REAL TIRUVALLUR GEOMETRY"
        />

        <path
            d="REAL KANCHIPURAM GEOMETRY"
        />

        ...

        <path
            d="REAL KANNIYAKUMARI GEOMETRY"
        />

    </g>
</svg>
```

All 38 paths together must create the complete Tamil Nadu silhouette.

---

# 5. OUTER STATE BORDER

The final map must have a clearly recognizable Tamil Nadu outer boundary.

Use the actual geographic boundary.

Do not create the outer state shape separately using a manually drawn CSS shape.

The district polygons should naturally form the outer boundary.

The result should immediately look like:

**Tamil Nadu**

even before district labels are displayed.

---

# 6. INTERNAL DISTRICT BOUNDARIES

The internal district lines are extremely important.

Use:

```text
stroke: subtle gray
stroke-width: 0.7–1.2
fill: data-driven
```

The lines should resemble the screenshot:

- Thin
- Clean
- Geographic
- Continuous
- Subtle
- Clearly separating districts

Do NOT make district borders thick cartoon outlines.

---

# 7. NO 3D DISTRICT EXTRUSION

The screenshot/reference may have a subtle overall map shadow.

You may add:

```text
filter: drop-shadow(...)
```

to the **entire Tamil Nadu map**.

But NEVER apply 3D extrusion to individual districts.

Forbidden:

```text
❌ translateZ
❌ rotateX
❌ rotateY
❌ perspective
❌ individual district extrusion
❌ 3D cards
❌ floating blocks
❌ isometric projection
```

The district geometry must remain flat.

Optional:

```text
Entire map
      ↓
Very subtle shadow
```

This is acceptable.

---

# 8. VISUAL STYLE

Match the uploaded reference direction:

### Map

- White/off-white district fills
- Very light gray district borders
- Darker outer Tamil Nadu border
- Subtle overall shadow
- Clean geographic appearance

### Background

Use a modern admin dashboard background:

```text
#F8FAFC
```

or a very subtle gray/white gradient.

### District hover

When hovering:

```text
white
   ↓
gold/light gold
```

with a slightly stronger border.

### Selected district

Use the project's existing primary brand color.

Do not move the district out of the map.

Do not separate it.

Do not extrude it.

---

# 9. APPLICATION DATA

The project already contains the **REAL application database**.

Do not create any mock data.

Do not create:

```js
const mockDistricts = [...]
```

Do not create:

```js
const applications = {
    Chennai: 100,
    Madurai: 50
}
```

Do not hardcode application counts.

Use the existing local database/API.

The data flow must be:

```text
REAL DATABASE
      ↓
Existing API / Backend
      ↓
Applications
      ↓
Group by district
      ↓
District application count
      ↓
Real geographic map
```

---

# 10. DATA-DRIVEN MAP

Each real district polygon should receive its real application count.

For example:

```text
GeoJSON District
       ↓
Normalize District Name
       ↓
Find Real Database Count
       ↓
Apply Color
```

If:

```text
Chennai = 128 applications
```

then the actual Chennai geographic polygon receives the appropriate data-driven color.

Do NOT create a separate card saying Chennai = 128 and leave the map static.

The actual geographic polygon itself must respond to the data.

---

# 11. COLOR SCALE

Use application volume to determine district fill.

Example:

```text
0
→ #E5E7EB

Low
→ light gold

Medium
→ medium gold

High
→ stronger gold/crimson
```

The exact colors can follow the existing project design system.

Important:

**Color must be calculated from real application data.**

---

# 12. HOVER TOOLTIP

Hovering over the actual geographic district polygon should display:

```text
┌─────────────────────────┐
│ CHENNAI                 │
│                         │
│ Applications            │
│ 128                     │
└─────────────────────────┘
```

The count is dynamic.

The tooltip must NOT be a permanent district card.

It should appear only on hover/focus.

---

# 13. CLICK INTERACTION

Click the actual district polygon.

Example:

```text
User clicks Chennai polygon
             ↓
Selected district = Chennai
             ↓
Existing application filtering
             ↓
Show Chennai applications
```

The district remains in exactly the same geographic position.

Only its visual state changes.

---

# 14. DISTRICT LABELS

Display district names inside the real geographic polygons where possible.

Use:

```text
polygon centroid
```

or:

```text
representative point
```

for label positioning.

Do not manually position every district using arbitrary CSS coordinates.

Avoid labels outside the map unless necessary for very small districts.

For small districts:

- Reduce font size
- Use abbreviations if appropriate
- Use hover tooltip

Do not distort the map to fit labels.

---

# 15. 38 DISTRICTS

Verify that the geographic dataset contains all current Tamil Nadu districts.

The implementation must support all 38 districts.

Before completion, run a validation:

```text
Total Geographic Features: 38
Matched Application Districts: 38
Unmatched Districts: 0
```

If there is a district-name mismatch between GeoJSON and database:

Create one centralized normalization mapping.

Example:

```text
GeoJSON name
     ↓
Normalization
     ↓
Database district name
```

Do not spread special cases throughout components.

---

# 16. RESPONSIVE MAP

Desktop:

```text
┌───────────────────────────────────────────────┐
│ Tamil Nadu District Applications              │
│                                               │
│               ┌────────────┐                  │
│              /              \                 │
│             │ REAL TAMIL    │                 │
│             │ NADU MAP      │                 │
│             │               │                 │
│             │ 38 DISTRICTS  │                 │
│              \              /                 │
│               └────────────┘                  │
│                                               │
└───────────────────────────────────────────────┘
```

Tablet:

- Map centered
- Scale proportionally

Mobile:

- Map scales to available width
- No horizontal scrolling
- District boundaries remain visible
- Touch/click works
- Tooltip converts to a compact information card

---

# 17. ADMIN ROLES

## SUPER ADMIN

Show complete Tamil Nadu.

All 38 districts interactive.

Can click any district and view real applications.

## STATE ADMIN

Show complete Tamil Nadu.

Use existing state-admin permissions.

## DISTRICT ADMIN

Show only the authorized district/application information according to the existing backend authorization.

Do not rely on frontend hiding alone.

---

# 18. SECURITY

District Admin authorization must happen server-side.

Never do:

```js
allApplications.filter(...)
```

after sending all applications to the browser if the user is not authorized to access them.

Instead:

```text
Authenticated User
       ↓
Role
       ↓
Authorized District
       ↓
Backend Query
       ↓
Only permitted data
       ↓
Frontend
```

---

# 19. TECHNOLOGY

Use the existing project stack.

For React:

```text
React
Tailwind CSS
SVG
GeoJSON / TopoJSON
```

Recommended:

```text
react-simple-maps
```

or direct SVG rendering.

Do not use a mapping library that converts the districts into cards or 3D objects.

The final output must be SVG geographic paths.

---

# 20. REMOVE THE CURRENT IMPLEMENTATION

The current implementation shown in the previous result must be removed.

Specifically remove any code responsible for:

```text
❌ district cards
❌ district rectangles
❌ district boxes
❌ 3D blocks
❌ individual extrusion
❌ artificial district coordinates
❌ CSS-positioned map tiles
❌ isometric layout
❌ perspective map
```

Do NOT attempt to fix the current blocks with styling.

Replace the underlying map rendering approach with real geographic polygon rendering.

---

# 21. VISUAL ACCEPTANCE TEST

After implementation, compare the result against the uploaded reference.

The following must be true:

### Outer shape

The silhouette must clearly resemble real Tamil Nadu.

### Internal boundaries

The 38 districts must appear as real geographic subdivisions.

### Continuity

Districts must touch their neighboring districts naturally.

### No gaps

There must not be large artificial gaps between districts.

### No boxes

No district should look like a card or rectangle.

### No extrusion

No district should look raised independently.

### One map

The viewer should perceive one Tamil Nadu map, not 38 objects.

---

# 22. FINAL NON-NEGOTIABLE RULE

The final output MUST satisfy this exact concept:

> **ONE REAL TAMIL NADU MAP + 38 REAL DISTRICT BOUNDARIES + REAL LOCAL APPLICATION DATA**

NOT:

> **38 SHAPES/CARDS ARRANGED TO LOOK LIKE TAMIL NADU**

The geographic boundary data is the source of truth.

Do not manually recreate Tamil Nadu.

Do not approximate Tamil Nadu.

Do not arrange district components to form Tamil Nadu.

Load the real Tamil Nadu district GeoJSON/TopoJSON and render its actual geographic polygons.

The final result should visually resemble the uploaded reference image: a **single continuous Tamil Nadu silhouette with subtle internal district boundary lines**, while retaining full hover, click, role-based access, and real database integration.