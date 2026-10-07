import { redisClient } from '../config/redis';
import { pool } from '../config/database';

const COOLDOWN_DAYS = 15;
const COOLDOWN_SECONDS = COOLDOWN_DAYS * 24 * 60 * 60;

export const bulkApplyCooldown = async (
  fieldName: string,
  studentIds?: string[]
): Promise<{ applied: number; fieldName: string }> => {
  let ids: string[] = [];

  if (studentIds && studentIds.length > 0) {
    ids = studentIds;
  } else {
    const result = await pool.query(
      "SELECT id FROM users WHERE role = 'student'"
    );
    ids = result.rows.map((row: { id: string }) => row.id);
  }

  if (ids.length === 0) {
    return { applied: 0, fieldName };
  }

  const unlockAt = Date.now() + COOLDOWN_SECONDS * 1000;
  const value = JSON.stringify({ unlocksAt: unlockAt });

  const pipeline = redisClient.multi();

  for (const id of ids) {
    pipeline.setEx(`cooldown:${id}:${fieldName}`, COOLDOWN_SECONDS, value);
  }

  await pipeline.exec();

  return { applied: ids.length, fieldName };
};

export const bulkClearCooldown = async (
  fieldName: string,
  studentIds?: string[]
): Promise<{ cleared: number; fieldName: string }> => {
  let ids: string[] = [];

  if (studentIds && studentIds.length > 0) {
    ids = studentIds;
  } else {
    const result = await pool.query(
      "SELECT id FROM users WHERE role = 'student'"
    );
    ids = result.rows.map((row: { id: string }) => row.id);
  }

  if (ids.length === 0) {
    return { cleared: 0, fieldName };
  }

  const pipeline = redisClient.multi();

  for (const id of ids) {
    pipeline.del(`cooldown:${id}:${fieldName}`);
  }

  await pipeline.exec();

  return { cleared: ids.length, fieldName };
};