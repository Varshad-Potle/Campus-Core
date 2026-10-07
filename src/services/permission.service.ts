import { redisClient } from '../config/redis';
import { pool } from '../config/database';

const CACHE_TTL = 300; // 5 minutes

export const getCachedPermissions = async (userId: string): Promise<bigint> => {
  const cached = await redisClient.get(`perms:${userId}`);
  if (cached) {
    return BigInt(cached);
  }

  const result = await pool.query(
    'SELECT permission_mask FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const mask = result.rows[0].permission_mask.toString();
  await redisClient.setEx(`perms:${userId}`, CACHE_TTL, mask);

  return BigInt(mask);
};

export const invalidatePermissionCache = async (userId: string): Promise<void> => {
  await redisClient.del(`perms:${userId}`);
};

export const updateUserPermissions = async (
  userId: string,
  newMask: bigint
): Promise<void> => {
  await pool.query(
    'UPDATE users SET permission_mask = $1, updated_at = NOW() WHERE id = $2',
    [newMask.toString(), userId]
  );

  await redisClient.setEx(`perms:${userId}`, CACHE_TTL, newMask.toString());
};