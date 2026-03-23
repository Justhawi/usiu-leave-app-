// Authentication Module
const AuthModule = {
  currentUser: null,
  isInitialized: false,
  isLoadingProfile: false,
  
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    const auth = firebase?.auth();
    if (!auth) {
      console.log('Firebase auth not available');
      return;
    }
    
    console.log('Firebase auth initialized successfully');
    
    // Store the handler reference to prevent multiple listeners
    this.authStateHandler = async (user) => {
      console.log('Auth state changed:', user ? user.email : 'null');
      
      if (user && !this.currentUser) {
        console.log('New user signed in');
        this.currentUser = user;
        await this.loadUserProfile(user.uid);
      } else if (user && this.currentUser && this.currentUser.uid !== user.uid) {
        console.log('Different user signed in');
        this.currentUser = user;
        await this.loadUserProfile(user.uid);
      } else if (!user && this.currentUser) {
        console.log('User signed out');
        this.currentUser = null;
        this.handleLoggedOut();
      }
    };
    
    auth.onAuthStateChanged(this.authStateHandler);
  },
  
  async loadUserProfile(uid) {
    if (this.isLoadingProfile || !this.currentUser) return;
    if (this.currentUser.profile && this.currentUser.profile.role) {
      return;
    }
    
    this.isLoadingProfile = true;
    
    try {
      const db = firebase.firestore();
      if (!db) {
        this.handleLoggedIn({ role: 'staff', fullName: this.currentUser.email.split('@')[0] });
        return;
      }
      
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const normalizedProfile = {
          fullName: userData.fullName || userData.name || userData.head || this.currentUser.email.split('@')[0],
          role: userData.role || 'staff',
          email: userData.email || userData.contact_email || this.currentUser.email,
          department: userData.department || userData.name || '',
          employeeId: userData.employeeId || ''
        };
        this.currentUser.profile = normalizedProfile;
        this.handleLoggedIn(normalizedProfile);
      } else {
        const defaultProfile = {
          fullName: this.currentUser.email.split('@')[0],
          role: 'staff',
          email: this.currentUser.email
        };
        this.currentUser.profile = defaultProfile;
        this.handleLoggedIn(defaultProfile);
      }
    } catch (error) {
      const fallbackProfile = {
        fullName: this.currentUser.email.split('@')[0],
        role: 'staff',
        email: this.currentUser.email
      };
      this.currentUser.profile = fallbackProfile;
      this.handleLoggedIn(fallbackProfile);
    } finally {
      this.isLoadingProfile = false;
    }
  },
  
  handleLoggedIn(profile) {
    console.log('handleLoggedIn called with profile:', JSON.stringify(profile));
    
    const dashboards = {
      admin: 'admin-dashboard.html',
      hr: 'hr-dashboard.html',
      staff: 'staff-dashboard.html',
      finance: 'finance-dashboard.html',
      academics: 'academics-dashboard.html',
      administration: 'administration-dashboard.html',
      it: 'it-dashboard.html',
      library: 'library-dashboard.html',
      marketing: 'marketing-dashboard.html'
    };
    
    const targetDashboard = dashboards[profile.role] || 'staff-dashboard.html';
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('Target:', targetDashboard, 'Current:', currentPage);
    
    // Only redirect if not already on target page
    if (currentPage !== targetDashboard) {
      window.location.href = targetDashboard;
    }
  },
  
  handleLoggedOut() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', ''];
    
    if (!publicPages.includes(currentPage)) {
      window.location.href = 'index.html';
    }
  },
  
  async signUp(email, password, userData) {
    this.showLoading(true);
    
    const auth = firebase?.auth();
    const db = firebase?.firestore();
    
    if (!auth || !db) {
      this.showLoading(false);
      this.showToast('Firebase not initialized. Please refresh.', 'error');
      return;
    }
    
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await db.collection('users').doc(user.uid).set({
        ...userData,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      if (userData.role === 'staff') {
        await db.collection('leave_balances').doc(user.uid).set({
          userId: user.uid,
          annualLeave: 21,
          sickLeave: 10,
          personalLeave: 5,
          usedAnnual: 0,
          usedSick: 0,
          usedPersonal: 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      this.showLoading(false);
      this.showToast('Account created successfully! Redirecting...', 'success');
      
      // Sign out and redirect to login
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (error) {
      this.showLoading(false);
      this.showToast(this.getErrorMessage(error), 'error');
    }
  },
  
  async signIn(email, password) {
    this.showLoading(true);
    
    const auth = firebase?.auth();
    const db = firebase?.firestore();
    
    if (!auth) {
      this.showLoading(false);
      this.showToast('Firebase not initialized. Please refresh.', 'error');
      return;
    }
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      
      // Log successful login
      if (db) {
        await this.logLoginAttempt(email, 'success');
      }
      // Auth state change will trigger loadUserProfile -> handleLoggedIn
    } catch (error) {
      // Log failed login attempt
      if (db) {
        await this.logLoginAttempt(email, 'failed', error.code);
      }
      this.showLoading(false);
      this.showToast(this.getErrorMessage(error), 'error');
    }
  },
  
  async logLoginAttempt(email, status, errorCode = null) {
    try {
      const db = firebase.firestore();
      await db.collection('login_logs').add({
        email: email,
        status: status,
        errorCode: errorCode,
        ipAddress: 'client-side',
        userAgent: navigator.userAgent.substring(0, 200),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
    } catch (e) {
      console.log('Failed to log login attempt:', e);
    }
  },
  
  async signOut() {
    try {
      await firebase?.auth().signOut();
      window.location.href = 'index.html';
    } catch (error) {
      this.showToast('Error signing out', 'error');
    }
  },
  
  getCurrentUser() {
    return this.currentUser;
  },
  
  getUserProfile() {
    return this.currentUser?.profile || null;
  },
  
  hasRole(role) {
    return this.currentUser?.profile?.role === role;
  },
  
  isAdmin() {
    return this.hasRole('admin');
  },
  
  getErrorMessage(error) {
    const code = error.code || '';
    const messages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection'
    };
    return messages[code] || error.message || 'An error occurred';
  },

  // Notifications
  async createNotification(notificationData) {
    try {
      const db = firebase.firestore();
      await db.collection('notifications').add({
        ...notificationData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.log('Error creating notification:', error);
    }
  },

  async getNotifications(userId) {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.log('Error getting notifications:', error);
      return [];
    }
  },

  async markNotificationRead(notificationId) {
    try {
      const db = firebase.firestore();
      await db.collection('notifications').doc(notificationId).update({
        read: true
      });
    } catch (error) {
      console.log('Error marking notification read:', error);
    }
  },

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.toggle('active', show);
    }
  },
  
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.className = `toast ${type}`;
    const p = toast.querySelector('.toast-content p');
    if (p) p.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AuthModule.init();
});
