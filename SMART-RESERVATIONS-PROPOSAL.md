# Smart Reservations Feature - Workflow Proposal

## Overview
A lightweight reservation system that integrates seamlessly with your existing assets, allowing you to plan equipment needs, reserve kits, and prevent double-bookings without adding bulk to the system.

---

## 🎯 Core Requirements Met

✅ **Plan equipment needs for upcoming productions**  
✅ **Reserve complete kits for specific shooting days**  
✅ **Ensure availability for critical projects**  
✅ **Prevent double-bookings and scheduling conflicts**

---

## 📊 Database Schema (Minimal Addition)

### New Table: `reservations`
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Reservation Details
  title TEXT NOT NULL,                    -- "Commercial Shoot - Client X"
  project_name TEXT,                      -- Optional: Link to project/client
  description TEXT,                       -- Notes about the reservation
  
  -- Time Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,                        -- Optional: "09:00"
  end_time TIME,                          -- Optional: "17:00"
  
  -- Location (optional - can use asset.location or override)
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  
  -- Who/What
  reserved_by UUID REFERENCES users(id),  -- Who made the reservation
  team_members UUID[],                     -- Array of user IDs (optional)
  
  -- Metadata
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction Table: Reservation Assets (Many-to-Many)
CREATE TABLE reservation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,              -- How many of this asset (for groups)
  
  -- Optional: Track actual usage
  checked_out_at TIMESTAMP,               -- When actually taken
  checked_in_at TIMESTAMP,                 -- When returned
  
  UNIQUE(reservation_id, asset_id)
);

-- Indexes for Performance
CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_assets_reservation ON reservation_assets(reservation_id);
CREATE INDEX idx_reservation_assets_asset ON reservation_assets(asset_id);
```

**Why This Design:**
- ✅ Minimal schema (2 tables)
- ✅ Reuses existing `assets` and `users` tables
- ✅ Flexible: supports single assets or full kits
- ✅ Tracks actual usage (checkout/checkin)
- ✅ No duplication of asset data

---

## 🔄 User Workflow

### **Scenario 1: Plan Equipment for Upcoming Production**

```
1. User goes to Assets page
2. Clicks "New Reservation" button (new button in header)
3. Reservation Form opens:
   ├─ Title: "Commercial Shoot - Client ABC"
   ├─ Project: [Optional dropdown of clients]
   ├─ Start Date: [Date picker]
   ├─ End Date: [Date picker]
   ├─ Start/End Time: [Optional time pickers]
   ├─ Location: [Text field - can prefill from asset location]
   ├─ Priority: [Dropdown: Low, Normal, High, Critical]
   └─ Notes: [Text area]

4. Add Assets Section:
   ├─ Search/Filter assets (by category, status, location)
   ├─ Select multiple assets
   ├─ For each asset, specify quantity (if group asset)
   └─ Shows availability status (green/yellow/red)

5. Click "Create Reservation"
   ├─ System checks for conflicts
   ├─ Shows conflicts if any (with option to override)
   └─ Creates reservation with "pending" status
```

### **Scenario 2: Reserve Complete Kit**

```
1. User creates a "Kit Template" (optional feature - stored as metadata)
   Example: "Standard Camera Kit" = [Camera, Lenses, Tripod, Lights]

2. When creating reservation:
   ├─ Option: "Use Kit Template"
   ├─ Select template from dropdown
   └─ All kit assets auto-added to reservation

3. Or manually:
   ├─ Filter by category: "Camera Equipment"
   ├─ Select all needed items
   └─ Add to reservation
```

### **Scenario 3: Check Availability**

```
1. User selects assets in reservation form
2. System automatically checks:
   ├─ Are assets available for selected dates?
   ├─ Are there existing reservations?
   └─ Are assets in maintenance/retired status?

3. Visual Indicators:
   ├─ 🟢 Available - No conflicts
   ├─ 🟡 Warning - Asset in maintenance, but available
   ├─ 🔴 Conflict - Already reserved for overlapping dates
   └─ ⚪ Unavailable - Asset retired/sold

4. Conflict Details:
   ├─ Shows which reservation conflicts
   ├─ Shows conflicting dates
   └─ Option to view conflicting reservation
```

### **Scenario 4: Prevent Double-Bookings**

```
When creating/updating reservation:
1. System queries:
   SELECT DISTINCT asset_id 
   FROM reservation_assets ra
   JOIN reservations r ON ra.reservation_id = r.id
   WHERE r.status IN ('pending', 'confirmed', 'active')
     AND r.id != [current_reservation_id]
     AND (
       (r.start_date <= [new_end_date] AND r.end_date >= [new_start_date])
     )
   AND ra.asset_id IN ([selected_asset_ids]);

2. If conflicts found:
   ├─ Show warning modal
   ├─ List conflicting assets
   ├─ Show conflicting reservation details
   └─ Options:
      ├─ Cancel conflicting reservation
      ├─ Adjust dates
      └─ Override (with admin permission)
```

---

## 🎨 UI Integration (Non-Bulky)

### **1. Assets Page - Minimal Changes**

**Current Layout:**
```
┌─────────────────────────────────────┐
│  Assets                    [New]    │
├─────────────────────────────────────┤
│  [Asset List Panel]  [View Panel]   │
└─────────────────────────────────────┘
```

**With Reservations (Add One Button):**
```
┌─────────────────────────────────────┐
│  Assets    [New] [New Reservation]  │  ← Only new button
├─────────────────────────────────────┤
│  [Asset List Panel]  [View Panel]   │
└─────────────────────────────────────┘
```

**In Asset View Panel - Add Small Section:**
```
┌─────────────────────────────┐
│  Asset Details              │
│  ...                        │
│  ───────────────────────    │
│  📅 Reservations            │  ← New small section
│  • Upcoming: 2              │
│  • Active: 0                │
│  [View All Reservations]    │
└─────────────────────────────┘
```

### **2. New Reservations Page (Tab or Separate)**

**Option A: Tab in Assets Page**
```
Assets | Reservations  ← New tab
```

**Option B: Separate Page (Cleaner)**
```
/dashboard/reservations
```

**Reservations List View:**
```
┌─────────────────────────────────────────────┐
│  Reservations                    [New]      │
├─────────────────────────────────────────────┤
│  Filters: [Status] [Date Range] [Priority]  │
│  ────────────────────────────────────────   │
│  📅 Commercial Shoot - Client ABC           │
│     Dec 15-17, 2024 | 5 assets | High      │
│     [View] [Edit] [Cancel]                  │
│  ────────────────────────────────────────   │
│  📅 Product Photography                     │
│     Dec 20-21, 2024 | 12 assets | Normal    │
│     [View] [Edit] [Cancel]                  │
└─────────────────────────────────────────────┘
```

### **3. Reservation View Panel (Similar to Asset View)**

```
┌─────────────────────────────────────────────┐
│  Reservation Details                        │
│  ─────────────────────────────────────────  │
│  Title: Commercial Shoot - Client ABC       │
│  Status: [Confirmed]                        │
│  Priority: [High]                           │
│  ─────────────────────────────────────────  │
│  📅 Dates: Dec 15-17, 2024                 │
│  ⏰ Time: 09:00 - 17:00                     │
│  📍 Location: Studio A                      │
│  ─────────────────────────────────────────  │
│  📦 Reserved Assets (5)                      │
│  • Camera Body x1                           │
│  • 24-70mm Lens x1                          │
│  • Tripod x2                                │
│  • Lighting Kit x1                          │
│  ─────────────────────────────────────────  │
│  👥 Team: John Doe, Jane Smith              │
│  ─────────────────────────────────────────  │
│  Notes: [Text]                              │
│  ─────────────────────────────────────────  │
│  [Edit] [Check Out] [Cancel]                │
└─────────────────────────────────────────────┘
```

---

## 🔍 Conflict Detection Logic

### **Availability Check Algorithm**

```typescript
async function checkAssetAvailability(
  assetIds: string[],
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string
): Promise<AvailabilityResult> {
  // 1. Check asset status
  const assets = await getAssetsByIds(assetIds);
  const unavailable = assets.filter(a => 
    a.status === 'retired' || a.status === 'sold'
  );
  
  // 2. Check existing reservations
  const conflicts = await db.query(`
    SELECT DISTINCT 
      r.id as reservation_id,
      r.title,
      r.start_date,
      r.end_date,
      ra.asset_id,
      a.name as asset_name
    FROM reservation_assets ra
    JOIN reservations r ON ra.reservation_id = r.id
    JOIN assets a ON ra.asset_id = a.id
    WHERE r.status IN ('pending', 'confirmed', 'active')
      AND ($1::uuid IS NULL OR r.id != $1)
      AND ra.asset_id = ANY($2::uuid[])
      AND (
        (r.start_date <= $4 AND r.end_date >= $3)
      )
  `, [excludeReservationId, assetIds, startDate, endDate]);
  
  return {
    available: unavailable.length === 0 && conflicts.length === 0,
    unavailableAssets: unavailable,
    conflicts: conflicts
  };
}
```

---

## 📱 Key Features Implementation

### **1. Quick Reservation from Asset**
```
User viewing an asset → Click "Reserve" button
→ Opens reservation form with asset pre-selected
→ User adds dates and other assets
→ Creates reservation
```

### **2. Calendar View (Optional - Phase 2)**
```
Simple calendar showing:
- Reservations as colored blocks
- Color by priority (red=critical, yellow=normal)
- Click to view reservation details
```

### **3. Check Out/Check In**
```
When reservation starts:
- User clicks "Check Out" in reservation view
- System records actual checkout time
- Optionally updates asset status to "in_use"

When reservation ends:
- User clicks "Check In"
- System records check-in time
- Asset status returns to "active"
```

### **4. Notifications (Optional - Phase 2)**
```
- Email reminder 1 day before reservation
- Alert if asset not checked out on start date
- Alert if asset not checked in after end date
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Functionality (MVP)**
- ✅ Create reservations table
- ✅ Create reservation_assets junction table
- ✅ Basic reservation CRUD
- ✅ Conflict detection
- ✅ Simple list view

### **Phase 2: Enhanced Features**
- ✅ Calendar view
- ✅ Kit templates
- ✅ Check out/check in
- ✅ Email notifications
- ✅ Reservation analytics

### **Phase 3: Advanced (If Needed)**
- ✅ Recurring reservations
- ✅ Waitlist for unavailable assets
- ✅ Reservation approval workflow
- ✅ Integration with quotations/invoices

---

## 💡 Design Principles

1. **Minimal Schema**: Only 2 new tables, reuses existing
2. **Non-Intrusive**: Doesn't change existing asset functionality
3. **Optional**: Users can still use assets without reservations
4. **Flexible**: Supports single assets or full kits
5. **Visual**: Clear conflict indicators, easy to understand
6. **Fast**: Efficient queries with proper indexes

---

## 🎯 User Benefits

1. **Plan Ahead**: See what equipment is needed when
2. **Avoid Conflicts**: Automatic conflict detection
3. **Track Usage**: Know where equipment is at any time
4. **Team Coordination**: See who reserved what
5. **Priority Management**: Critical projects get priority
6. **Historical Data**: Track equipment usage over time

---

## 📋 Example Use Cases

### **Use Case 1: Production Company**
```
Monday: Create reservation for "Client X Commercial" (Dec 15-17)
- Selects: Camera, Lenses, Lighting, Audio equipment
- System shows: All available ✅
- Creates reservation

Wednesday: Another user tries to reserve same camera for Dec 16
- System shows: 🔴 Conflict with "Client X Commercial"
- User adjusts dates to Dec 18-20
- Reservation created successfully
```

### **Use Case 2: Equipment Rental**
```
User creates "Standard Photography Kit" template:
- Camera Body x1
- 24-70mm Lens x1
- 70-200mm Lens x1
- Tripod x1
- Lighting Kit x1

When booking:
- Selects "Standard Photography Kit" template
- All 5 assets auto-added
- Adjusts dates
- Creates reservation in 30 seconds
```

---

## 🔐 Permissions & Access

- **All Users**: Can view reservations
- **All Users**: Can create reservations
- **Admin/Owner**: Can cancel any reservation
- **Reservation Creator**: Can edit/cancel their own reservations
- **Override Conflicts**: Admin/Owner only

---

## 📊 Reporting (Future)

- Most reserved assets
- Equipment utilization rate
- Peak usage periods
- Reservation trends
- Conflict frequency

---

## ✅ Summary

This proposal provides a **lightweight, non-bulky** reservation system that:
- ✅ Adds minimal database schema (2 tables)
- ✅ Integrates seamlessly with existing assets
- ✅ Provides clear conflict detection
- ✅ Supports both individual assets and kits
- ✅ Maintains clean, familiar UI patterns
- ✅ Can be implemented in phases
- ✅ Doesn't disrupt existing workflows

**Next Steps:**
1. Review this proposal
2. Approve schema design
3. Implement Phase 1 (MVP)
4. Test with real scenarios
5. Iterate based on feedback

