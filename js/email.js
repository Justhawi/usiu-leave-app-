// Email Notification Module using EmailJS
const EmailModule = {
  serviceId: 'service_gm92ove', // EmailJS service ID
  templateId: 'template_0w477ro', // EmailJS template ID
  publicKey: 'scvGfuHbYIRdv6G-g', // EmailJS public Key
  
  init() {
    if (typeof emailjs !== 'undefined' && this.publicKey !== 'xxxxxxxxxxxxxx') {
      emailjs.init(this.publicKey);
    }
  },
  
  isConfigured() {
    return this.serviceId !== 'service_xxxxxxx' && this.publicKey !== 'xxxxxxxxxxxxxx';
  },
  
  async sendEmail(toEmail, subject, message) {
    if (!this.isConfigured()) {
      console.log('EmailJS not configured. Email not sent.');
      return false;
    }
    
    try {
      const response = await emailjs.send(this.serviceId, this.templateId, {
        to_email: toEmail,
        subject: subject,
        message: message,
        from_name: 'USIU Leave Management System'
      });
      console.log('Email sent successfully:', response.status);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  },
  
  async sendLoginNotification(email, name, time) {
    return this.sendEmail(
      email,
      'Login Notification - USIU Leave Management',
      `Hello ${name},\n\nYou have successfully logged into the USIU Leave Management System at ${time}.\n\nIf this wasn't you, please contact IT support immediately.`
    );
  },
  
  async sendFailedLoginNotification(email, name, time) {
    return this.sendEmail(
      email,
      'Security Alert - Failed Login Attempt',
      `Hello ${name},\n\nWe detected a failed login attempt on your account at ${time}.\n\nIf this wasn't you, please reset your password or contact IT support.`
    );
  },
  
  async sendLeaveRequestNotification(email, name, leaveType, days, startDate) {
    return this.sendEmail(
      email,
      'Leave Request Received',
      `Hello ${name},\n\nYour ${leaveType} leave request for ${days} day(s) starting from ${startDate} has been submitted and is pending approval.\n\nYou will be notified once your request is reviewed.`
    );
  },
  
  async sendLeaveApprovedNotification(email, name, leaveType, startDate, endDate) {
    return this.sendEmail(
      email,
      'Leave Request Approved',
      `Hello ${name},\n\nYour ${leaveType} leave request from ${startDate} to ${endDate} has been APPROVED.\n\nEnjoy your leave!`
    );
  },
  
  async sendLeaveRejectedNotification(email, name, leaveType, reason) {
    return this.sendEmail(
      email,
      'Leave Request Rejected',
      `Hello ${name},\n\nYour ${leaveType} leave request has been REJECTED.\n\nReason: ${reason || 'Not specified'}\n\nPlease contact your supervisor for more information.`
    );
  },
  
  async sendNewLeaveRequestToHR(hrEmail, staffName, department, leaveType, days, startDate) {
    return this.sendEmail(
      hrEmail,
      `New Leave Request - ${staffName}`,
      `Hello,\n\nA new leave request requires your approval.\n\nEmployee: ${staffName}\nDepartment: ${department}\nLeave Type: ${leaveType}\nDuration: ${days} day(s)\nStart Date: ${startDate}\n\nPlease review in the Leave Management System.`
    );
  },
  
  async sendCheckInNotification(email, name, time) {
    return this.sendEmail(
      email,
      'Check-in Confirmed',
      `Hello ${name},\n\nYou have successfully checked in at ${time}.\n\nHave a productive day!`
    );
  },
  
  async sendCheckOutNotification(email, name, time, hours) {
    return this.sendEmail(
      email,
      'Check-out Recorded',
      `Hello ${name},\n\nYou have checked out at ${time}.\n\nTotal hours worked today: ${hours}\n\nThank you!`
    );
  }
};

// Fallback notification if EmailJS not configured - store in Firestore for admin to review
const EmailQueue = {
  async queueEmail(emailData) {
    try {
      const db = firebase.firestore();
      await db.collection('email_queue').add({
        ...emailData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Email queued for later sending');
    } catch (error) {
      console.error('Failed to queue email:', error);
    }
  }
};
