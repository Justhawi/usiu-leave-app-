# USIU Leave Management System

A modern, beautiful web-based leave management system for USIU-Africa with stunning dark theme UI, real-time updates, and comprehensive features for managing leave requests and attendance tracking.

## 🌟 Features

### For Staff Members
- ✨ **Beautiful Modern UI** - Stunning dark theme with neon accents and glassmorphism effects
- 📋 **Easy Leave Requests** - Submit leave requests with just a few clicks
- ⏰ **Attendance Tracking** - Check-in/check-out with automatic late detection
- 📊 **Personal Analytics** - View leave balances and attendance patterns
- 🔔 **Real-time Notifications** - Get instant updates on request status
- 📈 **Visual Dashboards** - Charts showing leave usage and attendance trends

### For Department Heads
- 👥 **Department Overview** - See all requests from your team
- ✅ **Quick Approvals** - Review and approve/reject requests instantly
- 📊 **Team Analytics** - Track department leave patterns
- 💬 **Comment System** - Add feedback to leave requests

### For HR & Admin
- 🎯 **Complete Oversight** - Manage all leave requests across departments
- 📈 **Advanced Analytics** - Comprehensive reports and visualizations
- 👤 **User Management** - Track all staff and their leave balances
- 🔐 **Role-based Access** - Secure dashboards for different user types

## 🚀 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore Database)
- **Charts**: Chart.js for data visualization
- **Fonts**: Google Fonts (Outfit, Inter)
- **Icons**: Unicode emoji icons

## 📦 Installation & Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (free tier works fine)
- Basic text editor (VS Code recommended)
- Local web server (optional but recommended)

### Step 1: Download the System
Extract the ZIP file to your desired location.

### Step 2: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name: "USIU Leave Management"
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Get Firebase Configuration**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
   - Scroll to "Your apps" section
   - Click the Web icon `</>`
   - Register app with nickname: "Leave Management Web"
   - Copy the `firebaseConfig` object

3. **Update Configuration File**
   - Open `js/firebase-config.js`
   - Replace the placeholder values with your actual config:
   ```javascript
   const firebaseConfig = {
     apiKey: 'YOUR_ACTUAL_API_KEY',
     authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
     projectId: 'YOUR_PROJECT_ID',
     storageBucket: 'YOUR_PROJECT_ID.appspot.com',
     messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
     appId: 'YOUR_APP_ID'
   };
   ```

4. **Enable Authentication**
   - In Firebase Console, click "Authentication"
   - Click "Get started"
   - Click "Sign-in method" tab
   - Enable "Email/Password"
   - Click "Save"

5. **Create Firestore Database**
   - Click "Firestore Database" in sidebar
   - Click "Create database"
   - Choose "Start in test mode"
   - Select location (choose closest to your users)
   - Click "Enable"

6. **Set Security Rules**
   - Go to Firestore Database → Rules tab
   - Copy the security rules from the setup guide document provided
   - Click "Publish"

### Step 3: Run the Application

#### Option A: Simple File Opening
- Double-click `index.html` to open in browser
- **Note**: Some features may not work due to browser security

#### Option B: Using VS Code Live Server (Recommended)
1. Install VS Code
2. Install "Live Server" extension
3. Right-click `index.html`
4. Select "Open with Live Server"
5. System opens at `http://localhost:5500`

#### Option C: Using Python
```bash
# Python 3
python -m http.server 8000

# Then visit http://localhost:8000
```

#### Option D: Using Node.js
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server

# Visit http://localhost:8080
```

### Step 4: Create User Accounts

1. **Create Admin Account** (Do this first!)
   - Open the application
   - Click "Login" → "Sign Up"
   - Fill in details:
     - Full Name: System Administrator
     - Email: admin@usiu.ac.ke
     - Account Type: Administrator
     - Password: (your secure password)
   - Click "Create Account"
   - You'll be redirected to admin dashboard

2. **Create Staff Accounts**
   - Sign out from admin account
   - Click "Login" → "Sign Up"
   - Fill in details:
     - Full Name: (staff name)
     - Email: (staff email)
     - Account Type: Staff Member
     - Department: (select department)
     - Employee ID: (e.g., EMP-001)
     - Password: (secure password)
   - Click "Create Account"

3. **Create Department Head Accounts**
   - Sign out and sign up again
   - Select appropriate department head role
   - Credentials are automatically set up

## 🎨 Design Features

### Visual Elements
- **Dark Theme**: Modern dark background with gradient overlays
- **Neon Accents**: Vibrant gold, cyan, purple, and pink highlights
- **Glassmorphism**: Frosted glass effect on cards and modals
- **Smooth Animations**: Transitions, hover effects, and loading states
- **Floating Particles**: Animated background particles
- **Responsive Design**: Works on desktop, tablet, and mobile

### Color Palette
- Primary: Dark blue (#0a1628, #1a2b47)
- Accent: Gold (#ffc107, #ffd54f)
- Neon: Cyan (#00ffff), Purple (#b794f6), Pink (#ff6ec7)
- Status: Green (approved), Orange (pending), Red (rejected)

## 📊 User Roles & Permissions

### Staff
- Submit leave requests
- View personal leave balance
- Track own attendance
- Check in/check out
- View request history
- Receive notifications

### Department Heads
- View department requests
- Approve/reject requests
- Add comments
- View department analytics

### HR
- View all requests
- Manage leave balances
- Access system-wide reports
- Approve/reject any request

### Admin
- Complete system access
- User management
- Advanced analytics
- System configuration

## 🔧 Customization

### Changing Colors
Edit `css/style.css` and modify CSS variables in `:root`:
```css
:root {
  --usiu-blue: #0a1628;
  --usiu-gold: #ffc107;
  --neon-cyan: #00ffff;
  /* etc. */
}
```

### Adding Departments
1. Update `login.html` signup form options
2. Add to Firebase security rules
3. Create new department dashboard by copying existing one

### Modifying Leave Types
Edit leave type options in:
- `staff-dashboard.html` (newLeaveForm)
- Add corresponding logic in `js/leave.js`

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🐛 Troubleshooting

### Issue: "User profile not found"
**Solution**: Check Firestore `users` collection for user document

### Issue: Cannot see leave requests
**Solution**: Verify Firebase security rules are published correctly

### Issue: Charts not displaying
**Solution**: Check browser console for errors, ensure Chart.js is loading

### Issue: Authentication errors
**Solution**: Verify Firebase config is correct and Email/Password auth is enabled

## 📄 File Structure

```
usiu-leave-system/
├── index.html              # Landing page
├── login.html              # Login/signup page
├── staff-dashboard.html    # Staff member dashboard
├── admin-dashboard.html    # Administrator dashboard
├── hr-dashboard.html       # HR dashboard
├── finance-dashboard.html  # Finance department dashboard
├── academics-dashboard.html
├── administration-dashboard.html
├── it-dashboard.html
├── library-dashboard.html
├── marketing-dashboard.html
├── css/
│   └── style.css          # Main stylesheet (modern dark theme)
├── js/
│   ├── firebase-config.js # Firebase configuration
│   ├── auth.js           # Authentication module
│   ├── leave.js          # Leave management module
│   └── attendance.js     # Attendance tracking module
└── README.md             # This file
```

## 🔐 Security Best Practices

1. **Never commit real Firebase keys to public repos**
2. **Use environment variables in production**
3. **Keep Firebase security rules updated**
4. **Enable Firebase App Check for production**
5. **Use strong passwords for all accounts**
6. **Regularly review user access**

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Netlify
- Connect GitHub repository
- Set build command: (none)
- Set publish directory: /
- Deploy

### Option 3: Vercel
- Import project from GitHub
- Deploy with default settings

### Option 4: Traditional Web Hosting
- Upload all files to web host
- Ensure HTTPS is enabled
- Configure domain name

## 📞 Support & Contact

For issues or questions:
- Email: support@usiu.ac.ke (replace with actual support email)
- Documentation: See Firebase Setup Guide document

## 📜 License

© 2024 USIU-Africa. All rights reserved.

## 🎯 Future Enhancements

Potential features to add:
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] PDF report export
- [ ] Calendar integration
- [ ] Bulk approval system
- [ ] Advanced reporting dashboard
- [ ] Leave delegation
- [ ] Holiday calendar integration
- [ ] Offline support (PWA)

## 🙏 Credits

- Design & Development: USIU Leave Management Team
- UI Framework: Custom CSS with modern design principles
- Charts: Chart.js
- Backend: Firebase by Google

---

**Enjoy your modern leave management system!** 🎉
