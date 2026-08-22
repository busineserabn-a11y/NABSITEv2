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

async function checkDatabaseState() {
  console.log('--- CHECKING PUBLIC / UNAUTHENTICATED FIRESTORE ACCESS ---');
  const app = initializeApp(firebaseConfig, `PublicCheck_${Date.now()}`);
  const db = initializeFirestore(app, { experimentalForceLongPolling: true }, 'default');

  const collections = ['companies', 'websites', 'categories', 'showcase', 'settings', 'products', 'reviews', 'offers', 'users'];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection [${colName}]: ${snap.size} documents found.`);
      if (snap.size > 0 && colName === 'companies') {
        snap.docs.slice(0, 3).forEach((d) => console.log(`  - Company: ${d.id} -> name: "${d.data().name}", slug: "${d.data().slug}"`));
      }
    } catch (err: any) {
      console.error(`Collection [${colName}] failed:`, err.message || err);
    }
  }

  process.exit(0);
}

checkDatabaseState().catch(console.error);
