
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { Employee, EmployeePosition } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Lazily get the admin instances. This will also initialize the app.
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the user is an admin by checking their role in the database.
    const requestingUserRef = adminDb.ref(`employees/${decodedToken.uid}`);
    const snapshot = await requestingUserRef.once('value');
    const requestingUserData = snapshot.val();

    if (!requestingUserData || requestingUserData.position !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden: You do not have ADMIN permission to create employees.' }, { status: 403 });
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
    
    // Catch the specific error from our firebase-admin.ts to provide a better error message.
    if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid.");
        return NextResponse.json({ message: 'Lỗi cấu hình: Không tìm thấy hoặc khóa dịch vụ Firebase không hợp lệ. Vui lòng kiểm tra biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY phía máy chủ.' }, { status: 503 });
    }
    
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
