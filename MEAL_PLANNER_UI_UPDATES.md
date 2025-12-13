# Meal Planner UI Updates

## Required Changes to Index.tsx

### 1. Imports to Add:
- ChevronDown, User, Settings, LogOut from lucide-react
- DropdownMenu components from ui/dropdown-menu
- useAuth, useNavigate
- Logo component

### 2. Add User Hooks:
```typescript
const navigate = useNavigate();
const { user, signOut } = useAuth();
const userEmail = user?.email || "user@example.com"
const userDisplayName = user?.displayName || userEmail.split('@')[0] || "User"
const userInitials = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U"
const handleLogout = async () => { ... }
const [activeTab, setActiveTab] = useState<'active' | 'saved'>('active')
```

### 3. Header Section (lines ~866-916):
Replace with:
- Logo on left
- "Diet Planner" title
- "Create New Plan +" button (orange)
- User profile dropdown on right

### 4. Add Tabs Section:
- "Active Plan" tab (orange when active)
- "Manage Plans Here" tab (replaces "Saved Plans")

### 5. Date Range Display:
- Show formatted date range (e.g., "Nov 8th - Nov 14th")

### 6. Day Tabs:
- Horizontal row of day buttons (Monday-Sunday)
- Orange highlight for selected day

### 7. Meal Cards Layout:
- Show all meals (Breakfast, Lunch, Dinner, Desert) horizontally in one row
- Each card should have: meal type label, image, calories badge, name, nutritional info, health benefit, "View Meal Details" button

### 8. Color Scheme:
- Replace all blue colors with orange (#f97316, orange-500, etc.)
- Use white backgrounds

