// Leave Management Module
const LeaveModule = {
  // Submit leave request
  async submitRequest(requestData) {
    try {
      const user = AuthModule.getCurrentUser();
      const profile = AuthModule.getUserProfile();
      
      if (!user || !profile) {
        throw new Error('User not authenticated');
      }
      
      // Create leave request
      const leaveRequest = {
        userId: user.uid,
        staffName: profile.fullName,
        employeeId: profile.employeeId,
        email: profile.email,
        department: profile.department,
        leaveType: requestData.leaveType,
        startDate: firebase.firestore.Timestamp.fromDate(new Date(requestData.startDate)),
        endDate: firebase.firestore.Timestamp.fromDate(new Date(requestData.endDate)),
        reason: requestData.reason,
        status: 'pending',
        requestDate: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        delegatedToId: requestData.delegatedToId || null,
        delegatedToName: requestData.delegatedToName || null
      };
      
      // Calculate number of days
      const start = new Date(requestData.startDate);
      const end = new Date(requestData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      leaveRequest.numberOfDays = days;
      
      // Add to Firestore
      const docRef = await firebase.firestore().collection('leave_requests').add(leaveRequest);
      
      // Notify staff that request was submitted
      await this.createNotification({
        userId: user.uid,
        title: 'Leave Request Submitted',
        message: `Your ${requestData.leaveType} leave request for ${days} day(s) has been submitted and is pending approval`,
        type: 'info',
        read: false
      });

      // Send email notification to staff
      if (typeof EmailModule !== 'undefined' && EmailModule.isConfigured()) {
        await EmailModule.sendLeaveRequestNotification(
          profile.email,
          profile.fullName,
          requestData.leaveType,
          days,
          requestData.startDate
        );
      }

      // Notify department head about new request
      const deptHeads = await this.getDepartmentHeads(profile.department);
      for (const head of deptHeads) {
        await this.createNotification({
          userId: head.uid,
          title: 'New Leave Request',
          message: `${profile.fullName} submitted a ${requestData.leaveType} leave request for ${days} day(s)`,
          type: 'warning',
          read: false
        });
        
        // Send email to department head
        if (typeof EmailModule !== 'undefined' && EmailModule.isConfigured() && head.email) {
          await EmailModule.sendNewLeaveRequestToHR(
            head.email,
            profile.fullName,
            profile.department,
            requestData.leaveType,
            days,
            requestData.startDate
          );
        }
      }
      
      // Also notify HR
      const hrUsers = await this.getHRUsers();
      for (const hr of hrUsers) {
        await this.createNotification({
          userId: hr.uid,
          title: 'New Leave Request',
          message: `${profile.fullName} (${profile.department}) submitted a ${requestData.leaveType} leave request for ${days} day(s)`,
          type: 'warning',
          read: false
        });
        
        // Send email to HR
        if (typeof EmailModule !== 'undefined' && EmailModule.isConfigured() && hr.email) {
          await EmailModule.sendNewLeaveRequestToHR(
            hr.email,
            profile.fullName,
            profile.department,
            requestData.leaveType,
            days,
            requestData.startDate
          );
        }
      }
      
      AuthModule.showToast('Leave request submitted successfully!', 'success');
      return docRef.id;
    } catch (error) {
      AuthModule.showToast('Error submitting leave request', 'error');
      throw error;
    }
  },
  
  // Get user leave requests
  async getUserRequests(userId) {
    try {
      // Simple query without orderBy (no index required)
      const snapshot = await firebase.firestore().collection('leave_requests')
        .where('userId', '==', userId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error loading leave requests:', error);
      return [];
    }
  },
  
  // Get department leave requests
  async getDepartmentRequests(department) {
    try {
      const snapshot = await firebase.firestore().collection('leave_requests')
        .where('department', '==', department)
        .orderBy('requestDate', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  },
  
  // Get all leave requests (admin only)
  async getAllRequests() {
    try {
      const snapshot = await firebase.firestore().collection('leave_requests')
        .orderBy('requestDate', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  },
  
  // Update request status
  async updateRequestStatus(requestId, status, comments = '') {
    try {
      const user = AuthModule.getCurrentUser();
      const profile = AuthModule.getUserProfile();
      
      const updateData = {
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy: user.uid,
        reviewedByName: profile.fullName,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      if (comments) {
        updateData.comments = comments;
      }
      
      await firebase.firestore().collection('leave_requests').doc(requestId).update(updateData);
      
      // Get request details for notification
      const requestDoc = await firebase.firestore().collection('leave_requests').doc(requestId).get();
      const requestData = requestDoc.data();
      
      // Create notification for staff member
      await this.createNotification({
        userId: requestData.userId,
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${requestData.leaveType} leave request has been ${status}`,
        type: status === 'approved' ? 'success' : 'error',
        read: false
      });
      
      // Send email notification to staff
      if (typeof EmailModule !== 'undefined' && EmailModule.isConfigured()) {
        const startDate = requestData.startDate?.toDate ? requestData.startDate.toDate().toLocaleDateString() : 'N/A';
        const endDate = requestData.endDate?.toDate ? requestData.endDate.toDate().toLocaleDateString() : 'N/A';
        
        if (status === 'approved') {
          await EmailModule.sendLeaveApprovedNotification(
            requestData.email,
            requestData.staffName,
            requestData.leaveType,
            startDate,
            endDate
          );
        } else {
          await EmailModule.sendLeaveRejectedNotification(
            requestData.email,
            requestData.staffName,
            requestData.leaveType,
            comments
          );
        }
      }
       
      // Update leave balance if approved
      if (status === 'approved') {
        await this.updateLeaveBalance(requestData);
      }
      
      AuthModule.showToast(`Request ${status} successfully`, 'success');
    } catch (error) {
      AuthModule.showToast('Error updating request status', 'error');
      throw error;
    }
  },
  
  // Update leave balance
  async updateLeaveBalance(requestData) {
    try {
      const balanceDoc = await firebase.firestore().collection('leave_balances').doc(requestData.userId).get();
      
      if (!balanceDoc.exists) return;
      
      const balance = balanceDoc.data();
      const days = requestData.numberOfDays;
      
      let updateData = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      
      switch (requestData.leaveType) {
        case 'annual':
          updateData.usedAnnual = (balance.usedAnnual || 0) + days;
          break;
        case 'sick':
          updateData.usedSick = (balance.usedSick || 0) + days;
          break;
        case 'personal':
          updateData.usedPersonal = (balance.usedPersonal || 0) + days;
          break;
      }
      
      await firebase.firestore().collection('leave_balances').doc(requestData.userId).update(updateData);
    } catch (error) {
      // Error updating leave balance
    }
  },
  
  // Get leave balance
  async getLeaveBalance(userId) {
    try {
      const doc = await firebase.firestore().collection('leave_balances').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      return null;
    }
  },
  
  // Get all leave balances (admin/HR only)
  async getAllLeaveBalances() {
    try {
      const snapshot = await firebase.firestore().collection('leave_balances').get();
      return snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  },
  
  // Create notification
  async createNotification(notificationData) {
    try {
      await firebase.firestore().collection('notifications').add({
        ...notificationData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },
  
  // Get user notifications
  async getUserNotifications(userId) {
    try {
      const snapshot = await firebase.firestore().collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  },
  
  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      await firebase.firestore().collection('notifications').doc(notificationId).update({
        read: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      // Error marking notification as read
    }
  },

  // Mark all notifications as read
  async markAllNotificationsRead(userId) {
    try {
      const snapshot = await firebase.firestore().collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();
      
      const batch = firebase.firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Get department heads for a department
  async getDepartmentHeads(department) {
    try {
      const snapshot = await firebase.firestore().collection('users')
        .where('department', '==', department)
        .where('role', 'in', ['admin', 'hr'])
        .get();
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      return [];
    }
  },

  // Get all HR users
  async getHRUsers() {
    try {
      const snapshot = await firebase.firestore().collection('users')
        .where('role', '==', 'hr')
        .get();
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      return [];
    }
  },

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const snapshot = await firebase.firestore().collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  },

  // Send notification to multiple users (for department heads)
  async notifyDepartment(department, title, message, type = 'info') {
    try {
      const usersSnapshot = await firebase.firestore().collection('users')
        .where('department', '==', department)
        .get();
      
      const batch = firebase.firestore().batch();
      usersSnapshot.docs.forEach(doc => {
        const notifRef = firebase.firestore().collection('notifications').doc();
        batch.set(notifRef, {
          userId: doc.id,
          title: title,
          message: message,
          type: type,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error notifying department:', error);
    }
  },

  // Send notification to specific user
  async notifyUser(userId, title, message, type = 'info') {
    try {
      await firebase.firestore().collection('notifications').add({
        userId: userId,
        title: title,
        message: message,
        type: type,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error notifying user:', error);
    }
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
  },
  
  // Format timestamp
  formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // ======== NEW FEATURES ========

  // Public Holidays (Kenya - can be customized)
  getPublicHolidays(year) {
    return [
      { name: 'New Year', date: `${year}-01-01` },
      { name: 'Good Friday', date: `${year}-04-18` },
      { name: 'Easter Monday', date: `${year}-04-21` },
      { name: 'Labour Day', date: `${year}-05-01` },
      { name: 'Madaraka Day', date: `${year}-06-01` },
      { name: 'Independence Day', date: `${year}-07-12` },
      { name: 'Halloween', date: `${year}-10-20` },
      { name: 'Christmas Day', date: `${year}-12-25` },
      { name: 'Boxing Day', date: `${year}-12-26` }
    ];
  },

  // Check if date is a public holiday
  isPublicHoliday(date) {
    const year = date.getFullYear();
    const holidays = this.getPublicHolidays(year);
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(h => h.date === dateStr);
  },

  // Calculate working days (excluding weekends and holidays)
  calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6; // Sunday or Saturday
      const isHoliday = this.isPublicHoliday(d);
      
      if (!isWeekend && !isHoliday) {
        count++;
      }
    }
    return count;
  },

  // Check leave balance and send alert if low
  async checkLeaveBalance(userId) {
    try {
      const balanceDoc = await firebase.firestore().collection('leave_balances').doc(userId).get();
      if (!balanceDoc.exists) return;
      
      const balance = balanceDoc.data();
      const thresholds = {
        annualLeave: 3,
        sickLeave: 2,
        personalLeave: 1
      };
      
      // Check annual leave
      const annualRemaining = (balance.annualLeave || 0) - (balance.usedAnnual || 0);
      if (annualRemaining <= thresholds.annualLeave && annualRemaining > 0) {
        await this.createNotification({
          userId: userId,
          title: 'Low Leave Balance Alert',
          message: `You only have ${annualRemaining} day(s) of annual leave remaining. Plan accordingly!`,
          type: 'warning',
          read: false
        });
      }
      
      // Check sick leave
      const sickRemaining = (balance.sickLeave || 0) - (balance.usedSick || 0);
      if (sickRemaining <= thresholds.sickLeave && sickRemaining > 0) {
        await this.createNotification({
          userId: userId,
          title: 'Low Sick Leave Balance',
          message: `You only have ${sickRemaining} day(s) of sick leave remaining.`,
          type: 'warning',
          read: false
        });
      }
      
      // Check personal leave
      const personalRemaining = (balance.personalLeave || 0) - (balance.usedPersonal || 0);
      if (personalRemaining <= thresholds.personalLeave && personalRemaining > 0) {
        await this.createNotification({
          userId: userId,
          title: 'Low Personal Leave Balance',
          message: `You only have ${personalRemaining} day(s) of personal leave remaining.`,
          type: 'warning',
          read: false
        });
      }
    } catch (error) {
      console.error('Error checking leave balance:', error);
    }
  },

  // Check upcoming leave and send reminders
  async checkUpcomingLeave(userId) {
    try {
      const snapshot = await firebase.firestore().collection('leave_requests')
        .where('userId', '==', userId)
        .where('status', '==', 'approved')
        .get();
      
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      for (const doc of snapshot.docs) {
        const request = doc.data();
        const startDate = request.startDate?.toDate ? request.startDate.toDate() : new Date(request.startDate);
        
        if (startDate > today && startDate <= threeDaysFromNow) {
          const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
          
          await this.createNotification({
            userId: userId,
            title: 'Upcoming Leave Reminder',
            message: `Your ${request.leaveType} leave starts in ${daysUntil} day(s) on ${this.formatDate(startDate)}`,
            type: 'info',
            read: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking upcoming leave:', error);
    }
  },

  // Submit leave rescheduling request
  async submitRescheduleRequest(requestId, newStartDate, newEndDate, reason) {
    try {
      const user = AuthModule.getCurrentUser();
      const profile = AuthModule.getUserProfile();
      
      await firebase.firestore().collection('leave_requests').doc(requestId).update({
        rescheduleRequested: true,
        originalStartDate: firebase.firestore.FieldValue.serverTimestamp(),
        originalEndDate: firebase.firestore.FieldValue.serverTimestamp(),
        newStartDate: firebase.firestore.Timestamp.fromDate(new Date(newStartDate)),
        newEndDate: firebase.firestore.Timestamp.fromDate(new Date(newEndDate)),
        rescheduleReason: reason,
        rescheduleStatus: 'pending',
        rescheduleRequestedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      await this.createNotification({
        userId: user.uid,
        title: 'Reschedule Request Submitted',
        message: 'Your leave reschedule request has been submitted for approval',
        type: 'info',
        read: false
      });
      
      // Notify HR and department head
      const hrUsers = await this.getHRUsers();
      for (const hr of hrUsers) {
        await this.createNotification({
          userId: hr.uid,
          title: 'Leave Reschedule Request',
          message: `${profile.fullName} requested to reschedule their leave`,
          type: 'warning',
          read: false
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting reschedule request:', error);
      return false;
    }
  },

  // Audit log - track all changes
  async addAuditLog(action, details) {
    try {
      const user = AuthModule.getCurrentUser();
      const profile = AuthModule.getUserProfile();
      
      await firebase.firestore().collection('audit_logs').add({
        action: action,
        details: details,
        userId: user?.uid || 'system',
        userName: profile?.fullName || 'System',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  },

  // Get leave statistics for reports
  async getLeaveStatistics(department = null, year = null) {
    try {
      let query = firebase.firestore().collection('leave_requests');
      if (department) {
        query = query.where('department', '==', department);
      }
      
      const snapshot = await query.get();
      const requests = snapshot.docs.map(doc => doc.data());
      
      const year = year || new Date().getFullYear();
      
      const stats = {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        cancelled: 0,
        byType: {},
        byMonth: {},
        totalDays: 0
      };
      
      requests.forEach(req => {
        const requestDate = req.requestDate?.toDate ? req.requestDate.toDate() : new Date();
        
        if (requestDate.getFullYear() === year) {
          stats.total++;
          stats[req.status] = (stats[req.status] || 0) + 1;
          
          // By type
          stats.byType[req.leaveType] = (stats.byType[req.leaveType] || 0) + 1;
          
          // By month
          const month = requestDate.toLocaleString('en-US', { month: 'long' });
          stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
          
          // Total days
          if (req.status === 'approved') {
            stats.totalDays += req.numberOfDays || 0;
          }
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return null;
    }
  },

  // Leave encashment request
  async requestEncashment(userId, leaveType, days, reason) {
    try {
      const user = AuthModule.getCurrentUser();
      const profile = AuthModule.getUserProfile();
      
      // Check balance
      const balanceDoc = await firebase.firestore().collection('leave_balances').doc(userId).get();
      const balance = balanceDoc.data();
      
      let available = 0;
      if (leaveType === 'annual') available = (balance.annualLeave || 0) - (balance.usedAnnual || 0);
      else if (leaveType === 'sick') available = (balance.sickLeave || 0) - (balance.usedSick || 0);
      else if (leaveType === 'personal') available = (balance.personalLeave || 0) - (balance.usedPersonal || 0);
      
      if (days > available) {
        throw new Error(`Insufficient ${leaveType} leave balance. Available: ${days}`);
      }
      
      await firebase.firestore().collection('encashment_requests').add({
        userId: userId,
        staffName: profile.fullName,
        employeeId: profile.employeeId,
        department: profile.department,
        leaveType: leaveType,
        days: days,
        reason: reason,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      await this.createNotification({
        userId: userId,
        title: 'Encashment Request Submitted',
        message: `Your request to encash ${days} day(s) of ${leaveType} leave has been submitted`,
        type: 'info',
        read: false
      });
      
      // Notify HR
      const hrUsers = await this.getHRUsers();
      for (const hr of hrUsers) {
        await this.createNotification({
          userId: hr.uid,
          title: 'New Encashment Request',
          message: `${profile.fullName} requested to encash ${days} day(s) of ${leaveType} leave`,
          type: 'warning',
          read: false
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting encashment:', error);
      return false;
    }
  },

  // Get leave history for self-service
  async getLeaveHistory(userId) {
    try {
      const snapshot = await firebase.firestore().collection('leave_requests')
        .where('userId', '==', userId)
        .orderBy('requestDate', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting leave history:', error);
      return [];
    }
  },

  // Get approved leave for calendar view
  async getApprovedLeaveForCalendar(department = null, startDate = null, endDate = null) {
    try {
      let query = firebase.firestore().collection('leave_requests')
        .where('status', '==', 'approved');
      
      const snapshot = await query.get();
      
      let events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.staffName,
          start: data.startDate?.toDate ? data.startDate.toDate().toISOString().split('T')[0] : data.startDate,
          end: data.endDate?.toDate ? data.endDate.toDate().toISOString().split('T')[0] : data.endDate,
          leaveType: data.leaveType,
          department: data.department
        };
      });
      
      // Filter by department if specified
      if (department) {
        events = events.filter(e => e.department === department);
      }
      
      return events;
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  }
};
