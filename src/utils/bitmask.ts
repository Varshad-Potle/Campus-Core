export const Permissions = {
  READ_PROFILE:    1n,  // bit 0 — 0001
  UPDATE_PROFILE:  2n,  // bit 1 — 0010
  READ_RESULTS:    4n,  // bit 2 — 0100
  ADMIN:           8n,  // bit 3 — 1000
} as const;

export type Permission = keyof typeof Permissions;

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