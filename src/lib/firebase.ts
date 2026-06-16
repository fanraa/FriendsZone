import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, getDocs, setDoc, query, orderBy, limit, addDoc } from "firebase/firestore";
import { MOCK_POSTS, MOCK_AUTHORS, Post, Author } from "../types";

export const firebaseConfig = {
  apiKey: "AIzaSyAPs0KD8TpSnv6xMSwGOlKnHmpMC2RxSFQ",
  authDomain: "fanratech.firebaseapp.com",
  projectId: "fanratech",
  storageBucket: "fanratech.firebasestorage.app",
  messagingSenderId: "239690129899",
  appId: "1:239690129899:web:c67aaab14fc0427b2239ae",
  measurementId: "G-M8ZVJXLNH8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Seeding function to make sure Firestore has data on the first run (disabled mock posts seeding on user request)
export async function seedInitialDataIfNeeded() {
  try {
    // We only seed users if needed to let them login, but we do not seed any mock postings.
    const usersSnapshot = await getDocs(collection(db, "users"));
    if (usersSnapshot.empty) {
      console.log("[Firebase] Seeding user accounts to Firestore...");
      for (const [key, val] of Object.entries(MOCK_AUTHORS)) {
        await setDoc(doc(db, "users", val.id), {
          id: val.id,
          name: val.name,
          avatar: val.avatar,
          banner: val.banner || "",
          bio: val.bio || "",
          location: val.location || "",
          joinedDate: val.joinedDate || "Jun 2026",
          gender: val.gender || "Others",
          followerCount: val.followerCount || 0,
          followingCount: val.followingCount || 0
        });
      }
      console.log("[Firebase] Seeding users completed!");
    }
  } catch (error) {
    console.error("[Firebase] Error seeding data:", error);
  }
}
