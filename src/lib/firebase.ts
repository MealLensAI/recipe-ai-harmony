import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDfeNB97dUeCtbSBTqTa_oZLNFUoDRCpLg",
  authDomain: "meallensai-e84bc.firebaseapp.com",
  projectId: "meallensai-e84bc",
  storageBucket: "meallensai-e84bc.firebasestorage.app",
  messagingSenderId: "931517253636",
  appId: "1:931517253636:web:344608943b23698df08d51",
  measurementId: "G-XV5LYL1RYJ",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app)

export default app
