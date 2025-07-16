import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBxXgqvYHlEpL2QpMLPtcEjc23s1O75S2g",
  authDomain: "meallensai-40f6f.firebaseapp.com",
  projectId: "meallensai-40f6f",
  storageBucket: "meallensai-40f6f.appspot.com",
  messagingSenderId: "97250360635",
  appId: "1:97250360635:web:f97290229d0511ae42cb1e",
  measurementId: "G-EFFLC7RMFM"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
