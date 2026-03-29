// Attendance Management Module
const AttendanceModule = {
  // Record attendance
  async recordAttendance(userId, status = 'present') {
    try {
      let profile = AuthModule.getUserProfile();
      if (!profile) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 200));
          profile = AuthModule.getUserProfile();
          if (profile) break;
        }
      }
      if (!profile) {
        AuthModule.showToast('User profile not loaded. Try refreshing.', 'error');
        return;
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const timeValue = hour + minutes / 60;
      
      if (status === 'present' && timeValue > 9) {
        status = 'late';
      }
      
      const attendanceData = {
        userId: userId,
        staffName: profile.fullName || 'Unknown',
        employeeId: profile.employeeId || '',
        department: profile.department || 'staff',
        date: firebase.firestore.Timestamp.fromDate(today),
        checkInTime: firebase.firestore.FieldValue.serverTimestamp(),
        status: status,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const db = firebase.firestore();
      const docRef = await db.collection('attendance').add(attendanceData);
      
      // Create notification
      await LeaveModule.createNotification({
        userId: userId,
        title: 'Check-in Recorded',
        message: `You checked in at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        type: 'success',
        read: false
      });
      
      AuthModule.showToast(`Checked in successfully!`, 'success');
      return docRef.id;
    } catch (error) {
      console.error('Attendance error:', error);
      AuthModule.showToast('Failed to record attendance: ' + error.message, 'error');
    }
  },
  
  // Check out
  async recordCheckout(userId) {
    try {
      const db = firebase.firestore();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's record without orderBy
      const snapshot = await db.collection('attendance')
        .where('userId', '==', userId)
        .limit(10)
        .get();
      
      let todayRecord = null;
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const recordDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || data.createdAt);
        recordDate.setHours(0, 0, 0, 0);
        
        if (recordDate.getTime() === today.getTime() && !data.checkOutTime) {
          todayRecord = { id: doc.id, ...data };
          break;
        }
      }
      
      if (!todayRecord) {
        AuthModule.showToast('No check-in record found for today', 'error');
        return;
      }
      
      await db.collection('attendance').doc(todayRecord.id).update({
        checkOutTime: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      const now = new Date();
      const hours = AttendanceModule.calculateWorkHours(todayRecord.checkInTime, firebase.firestore.FieldValue.serverTimestamp());
      
      // Create notification
      await LeaveModule.createNotification({
        userId: userId,
        title: 'Check-out Recorded',
        message: `You checked out at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Total hours: ${hours}`,
        type: 'info',
        read: false
      });
      
      AuthModule.showToast('Checked out successfully!', 'success');
    } catch (error) {
      console.error('Checkout error:', error);
      AuthModule.showToast('Failed to checkout: ' + error.message, 'error');
    }
  },
  
  // Get today's attendance
  async getTodayAttendance(userId) {
    try {
      const db = firebase.firestore();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const snapshot = await db.collection('attendance')
        .where('userId', '==', userId)
        .limit(10)
        .get();
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const recordDate = data.date?.toDate ? data.date.toDate() : new Date(data.date || data.createdAt);
        recordDate.setHours(0, 0, 0, 0);
        
        if (recordDate.getTime() === today.getTime()) {
          return { id: doc.id, ...data };
        }
      }
      return null;
    } catch (error) {
      console.error('Get attendance error:', error);
      return null;
    }
  },
  
  // Get user attendance records
  async getUserAttendance(userId, limit = 30) {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection('attendance')
        .where('userId', '==', userId)
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get user attendance error:', error);
      return [];
    }
  },
  
  // Get department attendance
  async getDepartmentAttendance(department, date = null) {
    try {
      let query = firebase.firestore().collection('attendance')
        .where('department', '==', department);
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .where('date', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
          .where('date', '<=', firebase.firestore.Timestamp.fromDate(endOfDay));
      }
      
      const snapshot = await query.orderBy('date', 'desc').limit(100).get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  },
  
  // Get all attendance (admin only)
  async getAllAttendance(date = null) {
    try {
      let query = firebase.firestore().collection('attendance');
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .where('date', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
          .where('date', '<=', firebase.firestore.Timestamp.fromDate(endOfDay));
      }
      
      const snapshot = await query.orderBy('date', 'desc').limit(200).get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  },
  
  // Get attendance statistics
  async getAttendanceStats(userId, startDate, endDate) {
    try {
      const snapshot = await firebase.firestore().collection('attendance')
        .where('userId', '==', userId)
        .where('date', '>=', firebase.firestore.Timestamp.fromDate(startDate))
        .where('date', '<=', firebase.firestore.Timestamp.fromDate(endDate))
        .get();
      
      const stats = {
        total: snapshot.size,
        present: 0,
        late: 0,
        absent: 0
      };
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'present') stats.present++;
        else if (data.status === 'late') stats.late++;
        else if (data.status === 'absent') stats.absent++;
      });
      
      return stats;
    } catch (error) {
      return { total: 0, present: 0, late: 0, absent: 0 };
    }
  },
  
  // Calculate work hours
  calculateWorkHours(checkInTime, checkOutTime) {
    if (!checkInTime || !checkOutTime) return 0;
    
    const checkIn = checkInTime.toDate ? checkInTime.toDate() : new Date(checkInTime);
    const checkOut = checkOutTime.toDate ? checkOutTime.toDate() : new Date(checkOutTime);
    
    const diff = checkOut - checkIn;
    const hours = diff / (1000 * 60 * 60);
    
    return Math.round(hours * 10) / 10; // Round to 1 decimal
  },
  
  // Format time
  formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Format date
  formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};
