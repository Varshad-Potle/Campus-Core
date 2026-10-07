import { redisClient } from '../config/redis';

const WINDOW_KEY = 'admin:update-window';

export const openUpdateWindow = async (durationSeconds: number): Promise<void> => {
  await redisClient.setEx(WINDOW_KEY, durationSeconds, 'true');
  await redisClient.publish('admin-events', JSON.stringify({ windowOpen: true, durationSeconds }));
};

export const closeUpdateWindow = async (): Promise<void> => {
  await redisClient.del(WINDOW_KEY);
  await redisClient.publish('admin-events', JSON.stringify({ windowOpen: false }));
};

export const isUpdateWindowOpen = async (): Promise<boolean> => {
  const value = await redisClient.get(WINDOW_KEY);
  return value === 'true';
};

export const getUpdateWindowStatus = async (): Promise<{
  open: boolean;
  ttl?: number;
}> => {
  const open = await isUpdateWindowOpen();
  if (!open) return { open: false };

  const ttl = await redisClient.ttl(WINDOW_KEY);
  return { open: true, ttl };
};