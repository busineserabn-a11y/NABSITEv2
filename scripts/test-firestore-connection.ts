import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDroAUS_-acMmG9JVMp25hTbzqf1KO7RAU",
  authDomain: "nabsite-master-specification.firebaseapp.com",
  projectId: "nabsite-master-specification",
  storageBucket: "nabsite-master-specification.firebasestorage.app",
  messagingSenderId: "692759105114",
  appId: "1:692759105114:web:9f9aee4b7c790100ac9263",
  measurementId: "G-B8VDV8SRWP",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  console.log('1. Signing in...');
  let userCred;
  try {
    userCred = await signInWithEmailAndPassword(auth, 'busineser.abn@gmail.com', 'Password123!');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      userCred = await createUserWithEmailAndPassword(auth, 'busineser.abn@gmail.com', 'Password123!');
    } else {
      throw err;
    }
  }
  const idToken = await userCred.user.getIdToken();
  console.log('Signed in successfully! UID:', userCred.user.uid);

  console.log('2. Testing Firestore REST API direct write...');
  const testDocId = `test_rest_${Date.now()}`;
  const restUrl = `https://firestore.googleapis.com/v1/projects/nabsite-master-specification/databases/(default)/documents/companies/${testDocId}`;
  
  const restResp = await fetch(restUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        id: { stringValue: testDocId },
        name: { stringValue: 'Addis Grand Bistro REST Test' },
        status: { stringValue: 'active' },
        category: { stringValue: 'Restaurant' },
      }
    }),
  });

  const restText = await restResp.text();
  console.log('REST response status:', restResp.status, restText);

  if (restResp.ok) {
    console.log('3. Testing Firestore REST API direct read...');
    const readResp = await fetch(restUrl, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      }
    });
    console.log('REST Read status:', readResp.status, await readResp.text());
  }

  process.exit(0);
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
