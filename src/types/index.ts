export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  permission_mask: bigint;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  permissionMask: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}