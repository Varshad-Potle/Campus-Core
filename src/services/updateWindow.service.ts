import { redisClient } from '../config/redis';

const WINDOW_KEY = 'admin:update-window';
const WINDOW_ID_KEY = 'admin:update-window-id';
const WINDOW_MESSAGE_KEY = 'admin:update-window-message';
const WINDOW_FIELDS_KEY = 'admin:update-window-fields';

export const openUpdateWindow = async (
  windowId: string,
  durationSeconds: number,
  message: string,
  fieldsToUpdate: string[]
): Promise<void> => {
  await redisClient.setEx(WINDOW_KEY, durationSeconds, 'true');
  await redisClient.setEx(WINDOW_ID_KEY, durationSeconds, windowId);
  await redisClient.setEx(WINDOW_MESSAGE_KEY, durationSeconds, message);
  await redisClient.setEx(WINDOW_FIELDS_KEY, durationSeconds, JSON.stringify(fieldsToUpdate));
  await redisClient.publish('admin-events', JSON.stringify({ windowOpen: true, message, fieldsToUpdate }));
};

export const closeUpdateWindow = async (): Promise<void> => {
  await redisClient.del(WINDOW_KEY);
  await redisClient.del(WINDOW_ID_KEY);
  await redisClient.del(WINDOW_MESSAGE_KEY);
  await redisClient.del(WINDOW_FIELDS_KEY);
  await redisClient.publish('admin-events', JSON.stringify({ windowOpen: false }));
};

export const isUpdateWindowOpen = async (): Promise<boolean> => {
  const value = await redisClient.get(WINDOW_KEY);
  return value === 'true';
};

export const getUpdateWindowStatus = async (): Promise<{
  open: boolean;
  ttl?: number;
  message?: string;
  fieldsToUpdate?: string[];
}> => {
  const open = await isUpdateWindowOpen();
  if (!open) return { open: false };

  const [ttl, message, fields] = await Promise.all([
    redisClient.ttl(WINDOW_KEY),
    redisClient.get(WINDOW_MESSAGE_KEY),
    redisClient.get(WINDOW_FIELDS_KEY),
  ]);

  return {
    open: true,
    ttl,
    message: message || '',
    fieldsToUpdate: fields ? JSON.parse(fields) : [],
  };
};