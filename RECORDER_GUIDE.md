# Recorder Role Documentation

## 📋 Overview

The **Recorder** role is designed for score keepers and competition organizers who manage day-to-day archery operations without full administrative privileges.

---

## 🔐 Access Credentials

**Default Recorder Account:**

- Email: `recorder@archery.club`
- Password: `recorder123`

**Default Admin Account:**

- Email: `admin@archery.club`
- Password: `admin123`

---

## ✅ Recorder Permissions

### **Can Do:**

#### 1. **Archer Management** (`/admin/archers`)

- ✅ View all archers
- ✅ Add new archers (role: archer only)
- ✅ Edit archer information
- ✅ Search and filter archers
- ❌ **Cannot:** Delete archers
- ❌ **Cannot:** Create admin/recorder accounts

#### 2. **Score Management** (`/admin/scores`)

- ✅ View all scores (staged, pending, approved, rejected)
- ✅ **Approve scores** - Move from pending to approved
- ✅ **Reject scores** - Reject invalid scores with reason
- ✅ View detailed score breakdown (ends & arrows)
- ✅ Delete scores if needed
- ✅ Filter by status, round, archer

**Score Approval Workflow:**

```
Archer submits → Staged → Pending → Recorder Approves → Approved
                                   ↓
                            Recorder Rejects → Rejected
```

#### 3. **Round Management** (`/admin/rounds`)

- ✅ View all rounds
- ✅ Add new rounds with ranges
- ✅ Edit round configurations
- ✅ Configure multiple ranges per round
- ❌ **Cannot:** Delete rounds

**Round Configuration Includes:**

- Distance & Unit (meters/yards)
- Target Size
- Scoring Type (10-zone, 5-zone, Imperial, Worcester)
- Number of Ends
- Arrows per End

#### 4. **Competition Management** (`/admin/competitions`)

- ✅ View all competitions
- ✅ Create new competitions
- ✅ Edit competition details
- ✅ Set competition status (upcoming/ongoing/completed/cancelled)
- ✅ Link competitions to rounds
- ❌ **Cannot:** Delete competitions

#### 5. **Championship Management** (`/admin/championships`)

- ✅ View all championships
- ✅ Create new club championships
- ✅ Edit championship details
- ✅ Link multiple competitions to championships
- ✅ Mark competitions as championship events
- ❌ **Cannot:** Delete championships

#### 6. **Dashboard** (`/admin`)

- ✅ View statistics (archers, pending scores, competitions, rounds)
- ✅ Quick access to common tasks
- ✅ Recent activity feed

---

## ❌ Recorder Restrictions

### **Cannot Do:**

1. **Delete Operations**
   - Cannot delete archers
   - Cannot delete rounds
   - Cannot delete competitions
   - Cannot delete championships
2. **User Role Management**

   - Cannot create admin accounts
   - Cannot create other recorder accounts
   - Can only create regular archer accounts

3. **System Administration**
   - No access to system settings
   - No access to database operations

---

## 🎯 Primary Responsibilities

### 1. **Score Recording & Validation**

The recorder's main job is to validate and approve scores:

- **Check arrow-by-arrow data** for each end
- **Verify equipment used** matches registered equipment
- **Ensure total scores** are calculated correctly
- **Approve valid scores** to make them official
- **Reject invalid scores** with clear reasons

### 2. **Data Entry**

Maintain accurate archery data:

- **Add new archers** joining the club
- **Create rounds** for different competition formats
- **Set up competitions** for upcoming events
- **Organize championships** for club rankings

### 3. **Competition Management**

Organize and track competitions:

- **Link competitions to championships** for club rankings
- **Update competition status** as events progress
- **Ensure scores are tied to correct competitions**

---

## 📊 Score Approval Process

### Step 1: Archer Submits Score

Archer enters their score through the archer portal (`/archer/score-entry`)

### Step 2: Score Appears as "Pending"

Recorder sees the score in `/admin/scores` with status "pending"

### Step 3: Recorder Reviews

- Click "View" to see detailed breakdown
- Verify each end and arrow
- Check total score calculation
- Confirm equipment used

### Step 4: Decision

**Option A - Approve:**

```javascript
// Score becomes official
Status: pending → approved
// Now counts toward rankings and championships
```

**Option B - Reject:**

```javascript
// Score is marked invalid
Status: pending → rejected
Reason: "Arrow count mismatch" (example)
// Archer can resubmit corrected score
```

---

## 🏆 Championship Tracking

Recorders can mark which competitions count toward Club Championships:

1. Create a **Club Championship** (e.g., "2025 Club Championship")
2. **Link multiple competitions** to the championship
3. **Approve scores** from those competitions
4. System automatically tracks championship standings

**Example:**

```
2025 Club Championship
├── Summer Open (June 15)
├── Autumn Challenge (Sept 20)
└── Winter Finals (Dec 10)
```

All approved scores from these 3 competitions count toward the championship.

---

## 🔍 Data Integrity

Recorders ensure data quality:

### Arrow-by-Arrow Tracking

- Each arrow score is recorded individually
- Arrows are grouped into "ends"
- Ends are positioned within ranges

**Example:**

```
WA 1440 Round
├── Range 1 (90m)
│   ├── End 1: [10, 9, 9, 8, 7, 6] = 49
│   ├── End 2: [X, 10, 9, 9, 8, 7] = 53
│   └── ...
├── Range 2 (70m)
│   └── ...
```

### Equipment Verification

- Check if archer used registered equipment
- Ensure division matches (e.g., Recurve vs Compound)
- Verify target face size matches round requirements

---

## 💡 Best Practices

### 1. **Regular Score Review**

- Check pending scores daily
- Don't let scores pile up
- Provide timely feedback to archers

### 2. **Clear Communication**

- Use detailed rejection reasons
- Contact archer if score seems unusual
- Document any irregularities

### 3. **Data Accuracy**

- Double-check calculations
- Verify competition details
- Keep round configurations up-to-date

### 4. **Competition Preparation**

- Set up competitions in advance
- Create/verify rounds before events
- Test score entry process

---

## 📱 Quick Actions

### From Dashboard:

1. **Review Scores** → Go to pending scores
2. **Manage Archers** → Add new club members
3. **Create Competition** → Set up next event
4. **Manage Rounds** → Add/edit round types

### Common Workflows:

**New Competition Setup:**

```
1. Create Round (if not exists)
2. Create Competition
3. Link to Round
4. Set Status to "Upcoming"
5. On event day → Change to "Ongoing"
6. After event → Change to "Completed"
```

**Score Approval:**

```
1. Go to Scores page
2. Filter by "Pending"
3. Click "View" on score
4. Review ends & arrows
5. Click "Approve" or "Reject"
```

---

## 🚫 What Admins Can Do (That Recorders Cannot)

Only **admins** can:

- Delete any records (archers, rounds, competitions)
- Create other admin/recorder accounts
- Manage system-level settings
- Access user role assignments

---

## 🔄 Login Flow

1. Go to `/login`
2. Enter recorder credentials
3. Redirected to `/admin` (Recorder Dashboard)
4. Header shows "Recorder Panel" with yellow badge
5. Delete buttons are hidden throughout the interface

---

## 📝 Notes

- Recorder accounts can be created only by admins
- Recorders can edit their own profile
- All recorder actions are logged
- Recorders have full access to reports and statistics

---

## 🎓 Training Checklist

New recorders should know how to:

- [ ] Add a new archer
- [ ] Create a round
- [ ] Set up a competition
- [ ] Approve a score
- [ ] Reject a score with reason
- [ ] Link competitions to championships
- [ ] Generate reports (when available)

---

## 🆘 Support

For issues or questions:

- Contact system administrator
- Check backend logs for errors
- Review score submission guidelines
- Consult club policies on score validation

---

**Last Updated:** October 21, 2025
