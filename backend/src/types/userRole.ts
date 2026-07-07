export const userRoles = ["individual", "ngo", "volunteer", "business", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

