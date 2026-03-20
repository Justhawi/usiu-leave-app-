# Quick Start Guide - USIU Leave Management System

## ⚡ 5-Minute Setup

### 1. Extract Files ✅
Unzip the downloaded file to any folder on your computer.

### 2. Firebase Setup (Required) 🔥

**A. Create Firebase Project**
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "USIU Leave Management"
4. Click through setup (disable Analytics if asked)

**B. Get Your Keys**
1. Click gear icon ⚙️ → Project settings
2. Scroll down, click Web icon `</>`
3. Copy the config object shown

**C. Update Config File**
1. Open `js/firebase-config.js` in any text editor
2. Replace placeholder values with your actual Firebase config
3. Save the file

**D. Enable Authentication**
1. In Firebase Console, click "Authentication"
2. Click "Get started" → "Email/Password"
3. Toggle "Enable" → Save

**E. Create Database**
1. Click "Firestore Database"
2. Click "Create database"
3. Choose "Test mode" → Select location → Enable

**F. Set Security Rules**
1. Click "Rules" tab in Firestore
2. Copy rules from the Firebase Setup Guide document
3. Click "Publish"

### 3. Run the Application 🚀

**Easiest Method (Double-click)**
- Double-click `index.html`
- Opens in default browser

**Better Method (Local Server)**

Using Python:
```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

Using VS Code:
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### 4. Create Your First Account 👤

**Admin Account (Create First!)**
1. Click "Login" → "Sign Up"
2. Fill in:
   - Name: Your Name
   - Email: admin@usiu.ac.ke (or your email)
   - Role: Administrator
   - Password: (min 6 characters)
3. Click "Create Account"
4. You're in! 🎉

**Staff Account**
1. Sign out from admin
2. Click "Login" → "Sign Up"
3. Fill in:
   - Name: Staff Name
   - Email: staff@usiu.ac.ke
   - Role: Staff Member
   - Department: (choose one)
   - Employee ID: EMP-001
   - Password: (min 6 characters)
4. Click "Create Account"

## 🎯 First Tasks

### As Admin:
1. Review all departments
2. Check analytics dashboard
3. Set up additional admin/HR accounts

### As Staff:
1. Check your leave balance
2. Submit a test leave request
3. Record attendance (Check In)
4. View your dashboard

### As Department Head:
1. View team requests
2. Practice approving/rejecting
3. Review department analytics

## 💡 Pro Tips

### Leave Requests
- ✅ Set start date before end date
- ✅ Provide clear reasons
- ✅ Check your balance before requesting
- ✅ Submit requests in advance

### Attendance
- ✅ Check in before 9:00 AM to avoid "late" status
- ✅ Remember to check out at end of day
- ✅ View your attendance history regularly

### Approvals (Department Heads/HR/Admin)
- ✅ Review request details before approving
- ✅ Add comments for transparency
- ✅ Check team member's leave balance
- ✅ Process pending requests promptly

## 🎨 Using the Interface

### Navigation
- **Top bar**: Your name, logout button
- **Cards**: Click to expand/view details
- **Buttons**: Color-coded (Gold=primary, Green=approve, Red=reject)
- **Status badges**: Pending (orange), Approved (green), Rejected (red)

### Dashboard Features
- **Stats cards**: Show key metrics with icons
- **Charts**: Visual analytics (click legend to filter)
- **Request cards**: Expandable details
- **Modals**: Pop-up forms for actions

### Filters & Search
- Use dropdown filters to narrow results
- Status filter: All, Pending, Approved, Rejected
- Department filter: View specific departments
- Date filters: Coming soon

## 🔧 Common Actions

### Submit Leave Request
1. Click "New Leave Request" button
2. Select leave type
3. Choose start and end dates
4. Enter reason
5. Click "Submit Request"
6. View in your request list

### Record Attendance
1. Click "Check In" button (morning)
2. Automatic time recording
3. Click "Check Out" button (evening)
4. View hours worked in attendance list

### Approve/Reject Request (Managers)
1. Find request in list
2. Click "Approve" or "Reject"
3. Add optional comments
4. Click "Confirm"
5. Staff gets notified automatically

### View Analytics
1. Check dashboard charts
2. Hover over chart sections for details
3. Click legend items to show/hide data
4. Charts update automatically

## 🐛 Quick Fixes

**Problem: Can't log in**
- Solution: Check email/password, ensure Firebase Auth is enabled

**Problem: No data showing**
- Solution: Wait a few seconds for data to load, check internet connection

**Problem: Charts not visible**
- Solution: Refresh page, check browser console for errors

**Problem: "Permission denied"**
- Solution: Check Firebase security rules are published

**Problem: Attendance not recording**
- Solution: Can only record once per day, check if already checked in

## 📱 Mobile Use

The system works on mobile devices:
- All features available
- Responsive design
- Touch-friendly buttons
- Optimized charts

Best experience: Use on tablet or desktop

## 🎓 Training Videos

### For Staff (5 minutes)
1. How to submit leave request
2. How to check in/out
3. How to view leave balance

### For Managers (10 minutes)
1. Reviewing requests
2. Approving/rejecting with comments
3. Viewing team analytics

### For Admin/HR (15 minutes)
1. System overview
2. Managing users
3. Advanced reporting
4. Security best practices

## 📞 Get Help

**Documentation**
- README.md - Complete documentation
- Firebase Setup Guide - Detailed setup steps

**Support**
- Check browser console for errors (F12)
- Review Firebase Console for data issues
- Contact: support@usiu.ac.ke

## 🎉 You're Ready!

Start managing leave requests efficiently with your beautiful new system!

**Next Steps:**
1. ✅ Create accounts for your team
2. ✅ Customize colors if desired
3. ✅ Set up email notifications (optional)
4. ✅ Deploy to production server

---

**Need more help?** See full README.md for detailed documentation.
