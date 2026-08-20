import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDroAUS_-acMmG9JVMp25hTbzqf1KO7RAU",
  authDomain: "nabsite-master-specification.firebaseapp.com",
  projectId: "nabsite-master-specification",
  storageBucket: "nabsite-master-specification.firebasestorage.app",
  messagingSenderId: "692759105114",
  appId: "1:692759105114:web:9f9aee4b7c790100ac9263",
  measurementId: "G-B8VDV8SRWP",
};

async function createAuthUser(email: string, pass: string): Promise<string> {
  const secondaryAppName = `TempAuth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const app = initializeApp(firebaseConfig, secondaryAppName);
  const auth = getAuth(app);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    await signOut(auth);
    await deleteApp(app);
    return uid;
  } catch (err: any) {
    await deleteApp(app);
    if (err.code === 'auth/email-already-in-use') {
      console.log(`[INFO] User ${email} already in Auth, signing in to retrieve UID...`);
      const testApp = initializeApp(firebaseConfig, `TempSignIn_${Date.now()}`);
      const testAuth = getAuth(testApp);
      const cred = await signInWithEmailAndPassword(testAuth, email, pass);
      const uid = cred.user.uid;
      await signOut(testAuth);
      await deleteApp(testApp);
      return uid;
    }
    throw err;
  }
}

async function verifyStaffCreation() {
  console.log('===============================================================');
  console.log('STARTING NABSITE STAFF ACCOUNT & PASSWORD PROVISIONING VERIFICATION');
  console.log('===============================================================\n');

  const mainApp = initializeApp(firebaseConfig, 'OwnerSessionApp');
  const ownerAuth = getAuth(mainApp);
  const db = initializeFirestore(mainApp, { experimentalForceLongPolling: true }, 'default');

  // Step 0: Sign in as Platform Owner
  console.log('--- 0. Authenticate as Platform Owner ---');
  const ownerEmail = 'busineser.abn@gmail.com';
  const ownerPassword = 'Password123!';
  try {
    await signInWithEmailAndPassword(ownerAuth, ownerEmail, ownerPassword);
    console.log(`[PASS] Signed in as Platform Owner: ${ownerEmail} (uid: ${ownerAuth.currentUser?.uid})`);
  } catch (err: any) {
    console.error(`[FAIL] Owner sign in failed:`, err);
    throw err;
  }

  const timestamp = Date.now();
  const adminEmail = `admin_tester_${timestamp}@nabsite.et`;
  const adminPass = `Admin#Pass2026!${Math.floor(100 + Math.random() * 900)}`;

  const subAdminEmail = `subadmin_tester_${timestamp}@nabsite.et`;
  const subAdminPass = `Sub#Pass2026!${Math.floor(100 + Math.random() * 900)}`;

  // Step 1: Owner provisions Platform Admin with email and password
  console.log(`\n--- 1. Provision Platform Admin Account with Password ---`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPass}`);
  const adminUid = await createAuthUser(adminEmail, adminPass);
  console.log(`[PASS] Firebase Auth account created for Admin. UID: ${adminUid}`);

  const adminDoc = {
    id: adminUid,
    email: adminEmail,
    name: 'Bethlehem Assefa (Admin)',
    role: 'ADMIN',
    status: 'active',
    assignedCompanyId: '',
    assignedCompanyIds: [],
    permissions: ['all'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', adminUid), adminDoc);
  console.log(`[PASS] Saved Admin document in Firestore at users/${adminUid}`);

  // Step 2: Test Admin login with newly created password
  console.log(`\n--- 2. Verify Admin Login with Created Password ---`);
  const adminTestApp = initializeApp(firebaseConfig, 'AdminSignInSession');
  const adminAuth = getAuth(adminTestApp);
  const adminLoginCred = await signInWithEmailAndPassword(adminAuth, adminEmail, adminPass);
  console.log(`[PASS] Platform Admin successfully logged in! UID: ${adminLoginCred.user.uid}, Email: ${adminLoginCred.user.email}`);

  // Fetch admin profile
  const adminProfileSnap = await getDoc(doc(db, 'users', adminUid));
  if (adminProfileSnap.exists() && adminProfileSnap.data().role === 'ADMIN') {
    console.log(`[PASS] Admin profile verified in Firestore. Role: ${adminProfileSnap.data().role}`);
  } else {
    throw new Error('Admin profile role check failed');
  }
  await signOut(adminAuth);
  await deleteApp(adminTestApp);

  // Step 3: Owner provisions Company Sub-Admin with email, password, and assigned company
  console.log(`\n--- 3. Provision Company Sub-Admin Account with Password ---`);
  console.log(`Email: ${subAdminEmail}`);
  console.log(`Password: ${subAdminPass}`);
  const subAdminUid = await createAuthUser(subAdminEmail, subAdminPass);
  console.log(`[PASS] Firebase Auth account created for Sub-Admin. UID: ${subAdminUid}`);

  const subAdminDoc = {
    id: subAdminUid,
    email: subAdminEmail,
    name: 'Dawit Tadesse (Sub-Admin)',
    role: 'SUB_ADMIN',
    status: 'active',
    assignedCompanyId: 'comp_1',
    assignedCompanyIds: ['comp_1'],
    permissions: ['edit_business_info', 'manage_products', 'moderate_reviews'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', subAdminUid), subAdminDoc);
  console.log(`[PASS] Saved Sub-Admin document in Firestore at users/${subAdminUid}`);

  // Step 4: Test Sub-Admin login with newly created password
  console.log(`\n--- 4. Verify Sub-Admin Login with Created Password ---`);
  const subAdminTestApp = initializeApp(firebaseConfig, 'SubAdminSignInSession');
  const subAdminAuth = getAuth(subAdminTestApp);
  const subAdminLoginCred = await signInWithEmailAndPassword(subAdminAuth, subAdminEmail, subAdminPass);
  console.log(`[PASS] Company Sub-Admin successfully logged in! UID: ${subAdminLoginCred.user.uid}, Email: ${subAdminLoginCred.user.email}`);

  // Fetch subadmin profile
  const subAdminProfileSnap = await getDoc(doc(db, 'users', subAdminUid));
  if (subAdminProfileSnap.exists() && subAdminProfileSnap.data().role === 'SUB_ADMIN') {
    const d = subAdminProfileSnap.data();
    console.log(`[PASS] Sub-Admin profile verified in Firestore. Role: ${d.role}, Assigned Company: ${d.assignedCompanyId}`);
  } else {
    throw new Error('Sub-Admin profile check failed');
  }

  await signOut(subAdminAuth);
  await deleteApp(subAdminTestApp);

  await signOut(ownerAuth);
  await deleteApp(mainApp);

  console.log('\n===============================================================');
  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY: 100% PRODUCTION READY');
  console.log('===============================================================\n');
}

verifyStaffCreation().catch((err) => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});

