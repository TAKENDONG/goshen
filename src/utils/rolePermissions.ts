import { UserRole } from '../types';

export type PageId = 'dashboard' | 'farm' | 'sales' | 'feed' | 'reports' | 'users';

export interface RolePermissions {
  canAccess: PageId[];
  defaultPage: PageId;
  displayName: string;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  superadmin: {
    canAccess: ['dashboard', 'farm', 'sales', 'feed', 'reports', 'users'],
    defaultPage: 'dashboard',
    displayName: 'Super Administrateur'
  },
  farm_manager: {
    canAccess: ['dashboard', 'farm', 'sales', 'reports'],
    defaultPage: 'farm',
    displayName: 'Gérant de Ferme'
  },
  feed_manager: {
    canAccess: ['dashboard', 'feed', 'reports'],
    defaultPage: 'feed',
    displayName: 'Gérant Provenderie'
  },
  accountant: {
    canAccess: ['dashboard', 'sales', 'reports'],
    defaultPage: 'sales',
    displayName: 'Comptable'
  },
  employee: {
    canAccess: ['dashboard', 'farm'],
    defaultPage: 'dashboard',
    displayName: 'Employé'
  }
};

export const getRolePermissions = (role: UserRole): RolePermissions => {
  return rolePermissions[role] || rolePermissions.employee;
};

export const canUserAccess = (userRole: UserRole, pageId: PageId): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions.canAccess.includes(pageId);
};

export const getDefaultPage = (userRole: UserRole): PageId => {
  const permissions = getRolePermissions(userRole);
  return permissions.defaultPage;
};

export const getRoleDisplayName = (role: UserRole): string => {
  return rolePermissions[role]?.displayName || 'Employé';
};