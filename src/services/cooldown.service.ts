import { redisClient } from '../config/redis';

const COOLDOWN_DAYS = 15;
const COOLDOWN_SECONDS = COOLDOWN_DAYS * 24 * 60 * 60;

export const setCooldown = async (
  studentId: string,
  fieldName: string
): Promise<void> => {
  const key = `cooldown:${studentId}:${fieldName}`;
  const unlockAt = Date.now() + COOLDOWN_SECONDS * 1000;

  await redisClient.setEx(
    key,
    COOLDOWN_SECONDS,
    JSON.stringify({ unlocksAt: unlockAt })
  );
};

export const checkCooldown = async (
  studentId: string,
  fieldName: string
): Promise<{ blocked: boolean; unlocksAt?: number; remainingMs?: number }> => {
  const key = `cooldown:${studentId}:${fieldName}`;
  const data = await redisClient.get(key);

  if (!data) {
    return { blocked: false };
  }

  const { unlocksAt } = JSON.parse(data);
  const remainingMs = unlocksAt - Date.now();

  if (remainingMs <= 0) {
    await redisClient.del(key);
    return { blocked: false };
  }

  return { blocked: true, unlocksAt, remainingMs };
};

export const clearCooldown = async (
  studentId: string,
  fieldName: string
): Promise<void> => {
  await redisClient.del(`cooldown:${studentId}:${fieldName}`);
};