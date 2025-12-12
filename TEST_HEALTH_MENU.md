# Quick Test: Show Health Information Menu

## Option 1: Set in Browser Console (Temporary Test)

1. Open your browser console (F12 or Cmd+Option+I)
2. Paste and run this command:
```javascript
localStorage.setItem('meallensai_product_type', 'health');
location.reload();
```

This will:
- Set your product type to 'health' in localStorage
- Reload the page
- The "Health Information" menu should appear in the dropdown

## Option 2: Go Through Health Product Page (Proper Way)

1. Navigate to: `http://localhost:5173/product/health`
2. This will automatically set the product type to 'health'
3. Then the menu should appear

## Option 3: Check Database (If Migration is Run)

If you've run the migration, you can check your database:

```sql
SELECT * FROM user_product_preferences WHERE user_id = 'YOUR_USER_ID';
```

If you have a record with `has_health_condition = true`, the menu should show.

## What to Look For

After running Option 1 or 2, check:
- The user dropdown menu should now show "Health Information" between "Profile" and "Payment"
- Console logs should show: `hasHealthCondition: true`