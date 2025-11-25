# Work Plan - Backend Bug Fixes & Testing

**Created:** November 7, 2025  
**Status:** In Progress  
**Team:** You (Supabase) + AI (Code Fixes)

---

## 🎯 Objective

Fix all broken endpoints and complete testing of all 68 API endpoints to achieve 100% functionality.

---

## 📋 Work Distribution

### 👤 YOUR TASKS (Supabase Dashboard)

#### Task 1: Check Database Schema (15 minutes)
**Priority:** Critical  
**Location:** Supabase Dashboard → Table Editor

**Action Items:**
1. Open `detection_history` table
2. Check if column is named `detection_type` OR `recipe_type`
3. Take screenshot or copy column names
4. Share with me so I can update code

**SQL Query to Run:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'detection_history'
ORDER BY ordinal_position;
```

**Expected Output:** List of column names (email me: detection_type vs recipe_type?)

---

#### Task 2: Check RPC Functions (20 minutes)
**Priority:** Critical  
**Location:** Supabase Dashboard → Database → Functions

**Check if these functions exist:**
- [ ] `submit_feedback(p_user_id, p_feedback_text)`
- [ ] `get_user_lifecycle_status(p_user_id)`
- [ ] `initialize_user_trial(p_user_id, p_duration_hours)`
- [ ] `can_user_use_feature(p_user_id, p_feature_name)`
- [ ] `record_feature_usage(p_user_id, p_feature_name, p_count)`
- [ ] `add_detection_history(...)`
- [ ] `update_detection_history(...)`
- [ ] `delete_user_settings(p_user_id, p_settings_type)`

**For each function:**
- ✅ Exists → Tell me "EXISTS"
- ❌ Missing → Tell me "MISSING"
- ⚠️ Exists but broken → Tell me "BROKEN" + error message

---

#### Task 3: Verify Table Names (10 minutes)
**Priority:** High

**Confirm these tables exist with correct names:**
- [ ] `profiles`
- [ ] `user_subscriptions`
- [ ] `subscription_plans`
- [ ] `user_trials`
- [ ] `payment_transactions`
- [ ] `detection_history`
- [ ] `meal_plan_management`
- [ ] `user_settings`
- [ ] `enterprises`
- [ ] `organization_users`
- [ ] `invitations`
- [ ] `feedback`
- [ ] `ai_sessions`

---

#### Task 4: Check RLS Policies (Optional - 15 minutes)
**Priority:** Medium

**Check if Row Level Security is enabled and causing issues:**
1. Go to each table → RLS tab
2. Check if policies allow service role key to bypass
3. Note any restrictive policies

---

### 🤖 MY TASKS (Code Fixes)

#### Task 1: Fix AI Session Bug (5 minutes)
**File:** `routes/ai_session_routes.py` line 32  
**Issue:** Static method called incorrectly  
**Status:** Ready to fix

**Fix:**
```python
# Current (BROKEN):
user_id, auth_type = AuthService.get_supabase_user_id_from_token(auth_header)

# Fixed:
auth_service = current_app.auth_service
user_id, auth_type = auth_service.get_supabase_user_id_from_token(auth_header)
```

---

#### Task 2: Fix Detection History Schema Mismatch (10 minutes)
**File:** `services/supabase_service.py` line 220  
**Status:** Waiting for your schema info

**Two options:**
```python
# Option A: If column is 'recipe_type'
'recipe_type': recipe_type  # Change detection_type → recipe_type

# Option B: If we need to use direct insert without column
# Remove the field entirely and let database handle it
```

---

#### Task 3: Remove RPC Dependencies (30 minutes)
**Files:** All services  
**Status:** Ready to start

**Replace RPC calls with direct table operations:**
- `submit_feedback` → Direct insert into `feedback` table
- `delete_user_settings` → Direct delete from `user_settings` table
- Subscription RPC functions → Direct table queries

**Benefit:** More reliable, easier to debug, no RPC maintenance

---

#### Task 4: Fix Timezone Inconsistencies (20 minutes)
**Files:** `services/subscription_service.py`, `services/lifecycle_subscription_service.py`  
**Status:** Ready to fix

**Replace all:**
```python
datetime.now()  # WRONG - no timezone
# With:
datetime.now(timezone.utc)  # CORRECT - always UTC
```

---

#### Task 5: Fix Array Index Bugs (15 minutes)
**Files:** `services/supabase_service.py`  
**Status:** Ready to fix

**Add bounds checking:**
```python
# Current (UNSAFE):
if result.data and result.data[0].get('status'):

# Fixed (SAFE):
if result.data and len(result.data) > 0 and result.data[0].get('status'):
```

---

#### Task 6: Test All Remaining Endpoints (60 minutes)
**Status:** Waiting for fixes above

**Test categories:**
- [ ] All payment endpoints (10)
- [ ] All meal plan variations (5)
- [ ] All food detection (4)
- [ ] All enterprise management (10)
- [ ] All lifecycle (6)
- [ ] Password change/reset (2)

---

## 📅 Timeline

### Phase 1: Information Gathering (30 min)
**YOU → Complete Tasks 1-3 above**
- Check database schema
- Verify RPC functions
- Confirm table names

**ME → Wait for your feedback**

---

### Phase 2: Code Fixes (1 hour)
**ME → Fix all code issues**
- Fix AI session bug
- Fix detection history (based on your schema)
- Remove/fix RPC dependencies
- Fix timezone issues
- Fix array index bugs

**YOU → Review and test changes**

---

### Phase 3: Comprehensive Testing (1 hour)
**BOTH → Test all 68 endpoints**
- I'll create test scripts
- You run them and report results
- We fix any remaining issues

---

### Phase 4: Documentation Update (30 min)
**ME → Update documentation**
- Mark working vs broken endpoints
- Update payloads based on actual behavior
- Add troubleshooting section

---

## 🚀 Parallel Work Strategy

### While You Check Supabase (30 min):

**I can do these simultaneously:**
1. ✅ Fix AI session bug (no info needed)
2. ✅ Fix timezone issues (no info needed)
3. ✅ Fix array index bugs (no info needed)
4. ✅ Create comprehensive test scripts

### After You Share Schema Info (1 hour):

**I can then:**
5. ⏳ Fix detection history schema
6. ⏳ Remove broken RPC dependencies
7. ⏳ Test all endpoints
8. ⏳ Update documentation

---

## 📝 Communication Protocol

### What I Need From You:

**Format: Quick Answers**
```
Q1: detection_history column name?
A: "recipe_type" or "detection_type"

Q2: RPC functions status?
A: 
- submit_feedback: MISSING
- get_user_lifecycle_status: EXISTS
- initialize_user_trial: BROKEN (error: ...)
```

### What You'll Get From Me:

**Format: Fixed Code + Test Commands**
```
✅ Fixed: ai_session_routes.py
✅ Fixed: supabase_service.py (3 bugs)
✅ Fixed: timezone issues (12 files)

Test:
curl -X POST http://localhost:5000/api/api/store-session ...
```

---

## ✅ Success Criteria

### Definition of Done:
- [ ] All 68 endpoints tested
- [ ] 95%+ endpoints working (65+ out of 68)
- [ ] No crashes or 500 errors
- [ ] All database operations successful
- [ ] Documentation updated with test results

### Known Acceptable Failures:
- Payment webhooks (needs Paystack test account)
- Email features (needs SMTP configuration)

---

## 🎬 Let's Start!

### Immediate Next Steps:

**YOU (Right Now):**
1. Open Supabase Dashboard
2. Go to Table Editor → `detection_history`
3. Tell me the actual column names

**ME (Right Now):**
1. Fix AI session bug
2. Fix timezone bugs
3. Fix array index bugs
4. Wait for your schema info

---

**Ready to start? Just tell me:**
1. What are the actual `detection_history` columns?
2. Which RPC functions exist vs missing?

Then I'll fix everything and we'll retest! 🚀

