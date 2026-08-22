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

async function inspectWebsitesConfig() {
  const app = initializeApp(firebaseConfig, `InspectWeb_${Date.now()}`);
  const db = initializeFirestore(app, { experimentalForceLongPolling: true }, 'default');

  const webSnap = await getDocs(collection(db, 'websites'));
  for (const docSnap of webSnap.docs) {
    const data = docSnap.data();
    console.log(`\n--- Website doc: ${docSnap.id} ---`);
    console.log('companyId:', data.companyId);
    console.log('status:', data.status);
    console.log('themeId:', data.themeId);
    console.log('has draftConfig:', !!data.draftConfig, 'pages:', data.draftConfig?.pages?.length);
    console.log('has publishedConfig:', !!data.publishedConfig, 'pages:', data.publishedConfig?.pages?.length);
  }

  process.exit(0);
}

inspectWebsitesConfig().catch(console.error);
