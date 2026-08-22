import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDroAUS_-acMmG9JVMp25hTbzqf1KO7RAU",
  authDomain: "nabsite-master-specification.firebaseapp.com",
  projectId: "nabsite-master-specification",
  storageBucket: "nabsite-master-specification.firebasestorage.app",
  messagingSenderId: "692759105114",
  appId: "1:692759105114:web:9f9aee4b7c790100ac9263",
  measurementId: "G-B8VDV8SRWP",
};

async function diagnose() {
  console.log('=== 1. TEST UNAUTHENTICATED (VISITOR PROFILE) ACCESS ===');
  const anonApp = initializeApp(firebaseConfig, `AnonTest_${Date.now()}`);
  const anonDb = initializeFirestore(anonApp, { experimentalForceLongPolling: true }, 'default');

  const publicCollections = [
    'companies',
    'websites',
    'categories',
    'showcase',
    'products',
    'reviews',
    'offers',
    'themes',
    'features'
  ];

  for (const col of publicCollections) {
    try {
      const snap = await getDocs(collection(anonDb, col));
      console.log(`[PASS] Anonymous can read "${col}": ${snap.size} documents found.`);
    } catch (err: any) {
      console.error(`[FAIL] Anonymous read "${col}" failed:`, err.message || err);
    }
  }

  await deleteApp(anonApp);

  console.log('\n=== 2. TEST SUB-ADMIN PROFILE ACCESS ===');
  const subAdminEmail = 'subadmin_tester_1787241938183@nabsite.et';
  const subAdminPass = 'Sub#Pass2026!844';
  const subApp = initializeApp(firebaseConfig, `SubTest_${Date.now()}`);
  const subAuth = getAuth(subApp);
  const subDb = initializeFirestore(subApp, { experimentalForceLongPolling: true }, 'default');

  try {
    const cred = await signInWithEmailAndPassword(subAuth, subAdminEmail, subAdminPass);
    console.log(`[PASS] Sub-Admin signed in: ${cred.user.email} (UID: ${cred.user.uid})`);
    const userDoc = await getDoc(doc(subDb, 'users', cred.user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log(`[PASS] Sub-Admin user profile fetched: Role=${data.role}, AssignedCompany=${data.assignedCompanyId}`);
    } else {
      console.error(`[FAIL] Sub-Admin user doc not found!`);
    }

    // Test subadmin reading companies and company details
    const compSnap = await getDocs(collection(subDb, 'companies'));
    console.log(`[PASS] Sub-Admin can list companies: ${compSnap.size} companies.`);
  } catch (err: any) {
    console.error(`[FAIL] Sub-Admin test failed:`, err.message || err);
  }
  await signOut(subAuth);
  await deleteApp(subApp);

  console.log('\n=== 3. TEST ADMIN PROFILE ACCESS ===');
  const adminEmail = 'admin_tester_1787241938183@nabsite.et';
  const adminPass = 'Admin#Pass2026!203';
  const adminApp = initializeApp(firebaseConfig, `AdminTest_${Date.now()}`);
  const adminAuth = getAuth(adminApp);
  const adminDb = initializeFirestore(adminApp, { experimentalForceLongPolling: true }, 'default');

  try {
    const cred = await signInWithEmailAndPassword(adminAuth, adminEmail, adminPass);
    console.log(`[PASS] Admin signed in: ${cred.user.email} (UID: ${cred.user.uid})`);
    const userDoc = await getDoc(doc(adminDb, 'users', cred.user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log(`[PASS] Admin user profile fetched: Role=${data.role}`);
    } else {
      console.error(`[FAIL] Admin user doc not found!`);
    }
  } catch (err: any) {
    console.error(`[FAIL] Admin test failed:`, err.message || err);
  }
  await signOut(adminAuth);
  await deleteApp(adminApp);

  process.exit(0);
}

diagnose().catch(console.error);
