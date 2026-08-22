import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDroAUS_-acMmG9JVMp25hTbzqf1KO7RAU",
  authDomain: "nabsite-master-specification.firebaseapp.com",
  projectId: "nabsite-master-specification",
  storageBucket: "nabsite-master-specification.firebasestorage.app",
  messagingSenderId: "692759105114",
  appId: "1:692759105114:web:9f9aee4b7c790100ac9263",
  measurementId: "G-B8VDV8SRWP",
};

async function inspectUsersAndCompanies() {
  const app = initializeApp(firebaseConfig, `Inspect_${Date.now()}`);
  const db = initializeFirestore(app, { experimentalForceLongPolling: true }, 'default');

  console.log('=== INSPECTING FIRESTORE COMPANIES ===');
  const compSnap = await getDocs(collection(db, 'companies'));
  compSnap.docs.forEach((d) => {
    const data = d.data();
    console.log(`Company ID: ${d.id} | Name: "${data.name}" | Slug: "${data.slug}" | Status: ${data.status}`);
  });

  console.log('\n=== INSPECTING FIRESTORE WEBSITES ===');
  const webSnap = await getDocs(collection(db, 'websites'));
  webSnap.docs.forEach((d) => {
    const data = d.data();
    console.log(`Website ID: ${d.id} | CompanyId: ${data.companyId} | Title: "${data.title}" | Status: ${data.status}`);
  });

  process.exit(0);
}

inspectUsersAndCompanies().catch(console.error);
