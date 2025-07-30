// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
// import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAcCdAj4rglqXPvyxw_o7x5k9C8M4rl8R8",
    authDomain: "healthtick-assignment-9540a.firebaseapp.com",
    projectId: "healthtick-assignment-9540a",
    storageBucket: "healthtick-assignment-9540a",
    messagingSenderId: "522797967748",
    appId: "1:522797967748:web:25c7de185f6b61fd7615d1",
    measurementId: "G-1EG89WW35V"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore DB
export const db = getFirestore(app);


export default app;
