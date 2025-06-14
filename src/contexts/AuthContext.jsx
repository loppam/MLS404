import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Save additional user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...userData,
        email,
        createdAt: new Date().toISOString(),
      });
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    let unsubscribeAuth = null;
    let unsubscribeUser = null;

    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set up real-time listener for user data
        unsubscribeUser = onSnapshot(
          doc(db, "users", user.uid),
          (doc) => {
            if (doc.exists()) {
              setCurrentUser({ ...user, ...doc.data() });
            } else {
              setCurrentUser(user);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setCurrentUser(user);
            setLoading(false);
          }
        );
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
