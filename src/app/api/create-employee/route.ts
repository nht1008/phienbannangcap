
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { Employee, EmployeePosition } from '@/types';

export async function POST(request: NextRequest) {
  // Check if Admin SDK was initialized
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ message: 'Firebase Admin SDK not initialized.' }, { status: 503 });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the user is an admin by checking their email
    if (decodedToken.email !== 'nthe1008@gmail.com') { 
        return NextResponse.json({ message: 'Forbidden: Not an admin' }, { status: 403 });
    }

    const { email, password, name, position, phone, zaloName } = await request.json();

    if (!email || !password || !name || !position) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    
    // Create employee record in Realtime Database
    const employeeData: Omit<Employee, 'id'> = {
      name,
      email,
      position,
      phone: phone || '',
      zaloName: zaloName || '',
    };

    await adminDb.ref(`employees/${userRecord.uid}`).set(employeeData);

    return NextResponse.json({ message: 'Employee created successfully', uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating employee:', error);
    
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: 'Địa chỉ email này đã được sử dụng.' }, { status: 409 });
    }
     if (error.code === 'auth/invalid-password') {
        return NextResponse.json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
    }
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ message: 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.' }, { status: 401 });
    }
    
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
