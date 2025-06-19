
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { ref, get, child, set } from "firebase/database";
import type { UserAccessRequest } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signUpAndRequestAccess: (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & {password: string}) => Promise<void>;
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
      
      // Check if the user is an admin or an approved employee
      const employeeSnapshot = await get(child(ref(db), `employees/${user.uid}`));
      if (user.email === "nthe1008@gmail.com" || employeeSnapshot.exists()) {
        setCurrentUser(user);
        return user;
      }

      // If not admin/employee, check userAccessRequests for 'employee' role
      const employeeAccessRequestSnapshot = await get(child(ref(db), `userAccessRequests/${user.uid}`));
      if (employeeAccessRequestSnapshot.exists()) {
        const requestData = employeeAccessRequestSnapshot.val() as UserAccessRequest;
        if (requestData.requestedRole === 'employee') {
          if (requestData.status === 'approved') {
            // This case should ideally be caught by the `employees/${user.uid}` check if data is consistent
            // but as a fallback:
            setCurrentUser(user);
            return user;
          } else if (requestData.status === 'pending') {
            await firebaseSignOut(auth);
            setError({ code: "auth/account-not-approved", message: "Yêu cầu nhân viên của bạn đang chờ phê duyệt." } as AuthError);
            return null;
          } else if (requestData.status === 'rejected') {
            await firebaseSignOut(auth);
            setError({ code: "auth/account-rejected", message: `Yêu cầu nhân viên đã bị từ chối. Lý do: ${requestData.rejectionReason || 'Không có'}` } as AuthError);
            return null;
          }
        }
      }
      
      // If it's not an employee context, then it must be for "OrderEase" (customer app) context which is removed.
      // For "Fleur Manager", if not admin or employee, they should not log in here directly.
      // The login page itself will handle showing the "pending/rejected" status for employees *before* calling signIn.
      // This signIn in AuthContext primarily validates credentials.
      // The logic in page.tsx is what actually determines access for employees.
      // So, if it's not admin and not found in employees, it is an unauthorized attempt for Fleur Manager.
      // However, to prevent errors if a customer from the (now removed) OrderEase somehow tries to log in,
      // we can keep a generic check.
      // Given the app is now standalone Fleur Manager, only employees/admin should pass.
      // The most robust check is already done in page.tsx. If signIn is called, it implies credential check.

      setCurrentUser(user); // Temporarily set user to allow page.tsx to evaluate access
      return user;

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
      
      if (requestedRole === 'employee') {
        await set(ref(db, `userAccessRequests/${user.uid}`), accessRequestData);
      } else if (requestedRole === 'customer') {
        await set(ref(db, `khach_hang_cho_duyet/${user.uid}`), accessRequestData);
      } else {
        throw new Error("Vai trò yêu cầu không hợp lệ.");
      }
      
      await firebaseSignOut(auth); // Sign out immediately after registration
      setCurrentUser(null);

    } catch (err) {
      setError(err as AuthError);
      throw err;
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
    signUpAndRequestAccess,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
