# Enterprise System - Quick Start Guide

## 🚀 What You Just Built

A complete enterprise/organization management system that allows doctors, clinics, and healthcare providers to:
- Register their organizations
- Invite patients/users via email or link
- Monitor who they've invited and who has joined
- Manage their users

## ✅ Setup (Already Done!)

All the code is ready and the database tables have been created. The system is fully functional!

## 🎯 How to Use It

### For Organizations (Doctors/Clinics):

#### 1. Register Your Organization
**During Signup:**
- Go to the signup page
- Click the "Organization" tab at the top
- Fill in both your personal details AND organization details
- Click "Register Organization"

**After Login:**
- Click on your profile menu (top right)
- Select "My Organizations"
- Click "Register Organization"

#### 2. Invite Users/Patients
- Go to `/enterprise` or click "My Organizations" in menu
- Click "Invite User" button
- Enter the patient's email
- Add a personal message (optional)
- Click "Send Invitation"

#### 3. Share the Invitation Link
**If email is NOT configured (current setup):**
- A modal will appear with the invitation link
- Click "Copy" to copy the link
- Share via WhatsApp, text, email, etc.

**If email IS configured:**
- User receives professional email automatically
- They can click the link in the email

### For Patients/Users:

#### 1. Receive Invitation
- You'll receive an invitation link from your healthcare provider
- Click the link to view the invitation

#### 2. Accept Invitation
**If you don't have an account:**
- Click "Accept Invitation"
- Fill in the registration form:
  - First Name
  - Last Name
  - Password
  - Confirm Password
- Submit the form
- Your account will be created
- You'll be automatically added to the organization
- Redirected to your MealLensAI account dashboard

**If you already have an account:**
- Log in first (or the system will prompt you)
- Click "Accept Invitation"
- You'll be automatically added to the organization
- Redirected to your MealLensAI account dashboard

## 📋 Current Status

✅ **Database Tables** - Created and working
✅ **Backend API** - All endpoints functional
✅ **Frontend UI** - Dashboard and invitation pages ready
✅ **User Registration** - Works with invitation acceptance
✅ **Invitation System** - Creates invitations successfully
✅ **Manual Link Sharing** - Shows copyable link when email not configured

⚠️ **Email Service** - Not configured (optional)

## 🔧 Optional: Configure Email Service

To enable automatic email sending:

1. **Add to your `.env` file:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-google-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=MeallensAI
```

2. **For Gmail:**
   - Go to https://myaccount.google.com/apppasswords
   - Create an App Password
   - Use that password in SMTP_PASSWORD

3. **Restart the backend server**

## 🎉 That's It!

The enterprise system is now fully functional. You can:
- Register organizations during signup or after login
- Invite users and share invitation links
- Users can register and join automatically
- Monitor all your invited users

No email configuration is needed - the manual link sharing works perfectly for most use cases!

## 📝 Important URLs

- **Enterprise Dashboard:** `http://localhost:5173/enterprise`
- **Accept Invitation:** `https://www.meallensai.com/accept-invitation?token=<invitation_token>`

## 🆘 Troubleshooting

### "No Organizations Yet" after registration
- Check if the backend server is running on port 5001
- Check browser console for errors
- Try registering a new organization manually

### Invitation link doesn't work
- Make sure the link includes the full token parameter
- Check that the invitation hasn't expired (7 days)
- Verify the invitation is still in "pending" status in database

### 500 Errors
- Restart the backend server
- Check that all database tables exist
- Look at backend terminal for error logs

