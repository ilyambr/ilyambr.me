import admin from 'firebase-admin';

const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: 'ilyambr-45403',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: 'https://ilyambr-45403-default-rtdb.firebaseio.com',
};

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
}

export const db = admin.database();
