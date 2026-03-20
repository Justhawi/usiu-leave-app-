# Firebase Setup Guide - USIU Leave Management System

## ⚠️ Important Notice

The system is currently running with **demo Firebase credentials** for testing purposes. To use the system with real data, you must configure your own Firebase project.

## 🔥 Firebase Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name your project: `USIU Leave Management`
4. Click **"Continue"** and disable Google Analytics (optional)
5. Click **"Create project"**

### 2. Get Your Firebase Configuration

1. In your Firebase project, click the **gear icon** ⚙️ → **Project settings**
2. Scroll down to the **"Your apps"** section
3. Click the **Web icon** `</>`
4. Enter an app name: `USIU Leave Management Web`
5. Click **"Register app"**
6. **Copy the firebaseConfig object** - you'll need this for the next step

### 3. Update Firebase Configuration

1. Open the file: `js/firebase-config.js`
2. **Replace the demo configuration** with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

3. Save the file

### 4. Enable Authentication

1. In Firebase Console, go to **"Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"**, select **"Email/Password"**
4. Toggle **"Enable"** and click **"Save"**

### 5. Set Up Firestore Database

1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows read/write access during setup)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

### 6. Set Security Rules

1. In Firestore, go to the **"Rules"** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leave requests - staff can read/write own, admins/dept heads can read department
    match /leave_requests/{requestId} {
      allow read, write: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.role in ['admin', 'hr'] ||
         request.auth.token.role == resource.data.department);
    }
    
    // Leave balances - users can read own, admins can read all
    match /leave_balances/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || request.auth.token.role in ['admin', 'hr']);
    }
    
    // Attendance records
    match /attendance/{recordId} {
      allow read, write: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.role in ['admin', 'hr']);
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

## 🚀 After Setup

1. **Restart your local server** (stop and start again)
2. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
3. **Test the system**:
   - Create an admin account
   - Create staff accounts
   - Test leave requests and approvals

## 🎯 Default User Roles

When creating accounts, use these role values:

- `admin` - System administrator
- `hr` - Human Resources
- `staff` - Regular staff member
- `finance` - Finance department head
- `academics` - Academics department head
- `administration` - Administration department head
- `it` - IT Services department head
- `library` - Library department head
- `marketing` - Marketing department head

## 📱 Testing the System

1. **Admin Account** (create first):
   - Role: `admin`
   - Can access all features

2. **Staff Account**:
   - Role: `staff`
   - Department: (choose one)
   - Employee ID: (e.g., EMP-001)

3. **Department Head Account**:
   - Role: (department name)
   - Can approve/reject requests for their department

## 🔧 Troubleshooting

### "Permission denied" errors
- Check that security rules are published
- Verify Firebase Auth is enabled
- Ensure users are created with correct roles

### "Firebase initialization error"
- Check that your Firebase config is correct
- Ensure all required fields are filled
- Verify project ID matches your Firebase project

### "No data showing"
- Wait a few seconds for data to load
- Check browser console (F12) for errors
- Verify internet connection

## 📞 Support

If you need help:
1. Check the browser console (F12) for error messages
2. Review Firebase Console for setup issues
3. Refer to the main documentation in `README.md`

---

**✅ Your system is ready to use once Firebase is properly configured!**
