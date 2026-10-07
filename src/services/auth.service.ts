import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { signToken } from '../utils/jwt';

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: 'student' | 'admin' = 'student'
) => {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const hashed = await bcrypt.hash(password, 12);
  const defaultMask = role === 'admin' ? 15 : 1;

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, permission_mask)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, permission_mask`,
    [name, email, hashed, role, defaultMask]
  );

  const user = result.rows[0];
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissionMask: user.permission_mask.toString(),
  });

  return { user, token };
};

export const loginUser = async (email: string, password: string) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissionMask: user.permission_mask.toString(),
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permission_mask: user.permission_mask,
    },
    token,
  };
};