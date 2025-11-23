// src/security/can.js

import { ROLE_PERMISSIONS } from './roles'

export const can = (role, permission) => {
  if (!role) return false
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  return perms.includes(permission)
}
