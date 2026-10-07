export const Permissions = {
  READ_PROFILE:   1n,   // bit 0 — 000001
  UPDATE_PROFILE: 2n,   // bit 1 — 000010
  READ_RESULTS:   4n,   // bit 2 — 000100
  ADMIN:          8n,   // bit 3 — 001000
  UPLOAD_MARKS:   16n,  // bit 4 — 010000
  UPLOAD_FILES:   32n,  // bit 5 — 100000
} as const;

export type Permission = keyof typeof Permissions;

export const DEFAULT_STUDENT_MASK = 1n + 2n + 4n + 32n;  // 39
export const DEFAULT_ADMIN_MASK   = 1n + 2n + 4n + 8n + 16n + 32n;  // 63

export const hasPermission = (userMask: bigint, required: bigint): boolean => {
  return (userMask & required) === required;
};

export const grantPermission = (userMask: bigint, permission: bigint): bigint => {
  return userMask | permission;
};

export const revokePermission = (userMask: bigint, permission: bigint): bigint => {
  return userMask & ~permission;
};

export const maskFromPermissions = (...permissions: bigint[]): bigint => {
  return permissions.reduce((acc, p) => acc | p, 0n);
};