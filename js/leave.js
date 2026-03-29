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
  }
};
