
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  createUserWithEmailAndPassword // Added for registration
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { ref, get, child, set } from "firebase/database"; // Added set
import type { UserAccessRequest } from '@/types'; // Added for typing

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signUpAndRequestAccess: (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & {password: string}) => Promise<void>; // New function type
  error: AuthError | null;
  setError: React.Dispatch<React.SetStateAction<AuthError | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err as AuthError);
      setLoading(false);
    });
    return unsubscribe; 
  }, []);

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // Check if user is an employee first (defined in 'employees' node)
      const employeeRef = child(ref(db), `employees/${user.uid}`);
      const employeeSnapshot = await get(employeeRef);
      if (employeeSnapshot.exists()) {
        // This is an employee, allow login directly
        setCurrentUser(user);
        return user;
      }
      
      // If not an employee, check customer approval status in 'users' node
      const userStatusRef = child(ref(db), `users/${user.uid}`);
      const snapshot = await get(userStatusRef);

      if (snapshot.exists() && snapshot.val().approvalStatus === 'approved' && snapshot.val().requestedRole === 'customer') {
        setCurrentUser(user);
        return user;
      } else {
        // For all other cases (not approved customer, or user not in 'employees' and not in 'users' with approval)
        await firebaseSignOut(auth); // Sign out immediately
        setCurrentUser(null);
        setError({
          code: 'auth/account-not-approved',
          message: 'Tài khoản của bạn đang chờ phê duyệt, chưa được kích hoạt, hoặc không có quyền truy cập.'
        } as AuthError);
        return null;
      }
    } catch (err) {
      setError(err as AuthError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileName = async (name: string) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name });
         // Manually update currentUser state if needed, as onAuthStateChanged might not fire immediately
        setCurrentUser(prevUser => prevUser ? ({ ...prevUser, displayName: name }) : null);
      } catch (err) {
        setError(err as AuthError);
        throw err; 
      }
    } else {
      const err = new Error("No current user to update.") as AuthError;
      setError(err);
      throw err;
    }
  };

  const sendPasswordResetEmail = async (emailAddress: string) => {
    setError(null);
    try {
      await firebaseSendPasswordResetEmail(auth, emailAddress);
    } catch (err) {
      setError(err as AuthError);
      throw err; 
    }
  };

  const signUpAndRequestAccess = async (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & {password: string}) => {
    setLoading(true);
    setError(null);
    const { email, password, fullName, phone, address, zaloName, requestedRole } = details;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      const accessRequestData: Omit<UserAccessRequest, 'id'> = {
        fullName,
        email,
        phone,
        address,
        zaloName,
        requestedRole,
        status: 'pending',
        requestDate: new Date().toISOString(),
      };

      let dbPath = '';
      if (requestedRole === 'customer') {
        dbPath = `khach_hang_cho_duyet/${user.uid}`;
      } else if (requestedRole === 'employee') {
        dbPath = `userAccessRequests/${user.uid}`;
      } else {
        throw new Error("Vai trò yêu cầu không hợp lệ.");
      }
      
      await set(ref(db, dbPath), accessRequestData);
      
      // Sign out immediately after registration and request submission
      await firebaseSignOut(auth);
      setCurrentUser(null); // Ensure local state is also cleared

    } catch (err) {
      setError(err as AuthError);
      throw err; // Re-throw for the calling component to handle
    } finally {
      setLoading(false);
    }
  };


  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    updateUserProfileName,
    sendPasswordResetEmail,
    signUpAndRequestAccess, // Provide new function
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
