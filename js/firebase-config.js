// Firebase Configuration Helper
// Provides access to firebase auth and firestore instances

const FirebaseHelper = {
  getAuth() {
    return firebase?.auth();
  },
  
  getFirestore() {
    return firebase?.firestore();
  }
};
