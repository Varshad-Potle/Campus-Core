import { redisClient } from '../config/redis';

const COOLDOWN_DAYS = 15;
const COOLDOWN_SECONDS = COOLDOWN_DAYS * 24 * 60 * 60;
const PROFILE_COOLDOWN_KEY = (userId: string) => `cooldown:${userId}:profile`;

export const setProfileCooldown = async (userId: string): Promise<void> => {
  const key = PROFILE_COOLDOWN_KEY(userId);
  const unlocksAt = Date.now() + COOLDOWN_SECONDS * 1000;
  await redisClient.setEx(key, COOLDOWN_SECONDS, JSON.stringify({ unlocksAt }));
};

export const checkProfileCooldown = async (
  userId: string
): Promise<{ blocked: boolean; unlocksAt?: number; remainingMs?: number; remainingDays?: number }> => {
  const key = PROFILE_COOLDOWN_KEY(userId);
  const data = await redisClient.get(key);

  if (!data) return { blocked: false };

  const { unlocksAt } = JSON.parse(data);
  const remainingMs = unlocksAt - Date.now();

  if (remainingMs <= 0) {
    await redisClient.del(key);
    return { blocked: false };
  }

  return {
    blocked: true,
    unlocksAt,
    remainingMs,
    remainingDays: Math.ceil(remainingMs / (1000 * 60 * 60 * 24)),
  };
};

export const clearProfileCooldown = async (userId: string): Promise<void> => {
  await redisClient.del(PROFILE_COOLDOWN_KEY(userId));
};