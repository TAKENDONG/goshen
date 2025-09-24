import { useRoleAccess } from './useRoleAccess';
import { UserRole } from '../types';

export const usePermissions = () => {
  const { userRole, canAccess } = useRoleAccess();

  return {
    userRole,
    canAccess,

    // Page-based permissions
    canAccessFarm: () => canAccess('farm'),
    canAccessFeed: () => canAccess('feed'),
    canAccessSales: () => canAccess('sales'),
    canAccessReports: () => canAccess('reports'),
    canAccessUsers: () => canAccess('users'),

    // Role-based permissions
    isSuperAdmin: () => userRole === 'superadmin',
    isFarmManager: () => userRole === 'farm_manager',
    isFeedManager: () => userRole === 'feed_manager',
    isAccountant: () => userRole === 'accountant',
    isEmployee: () => userRole === 'employee',

    // Combined permissions for common use cases
    canManageFarm: () => userRole === 'superadmin' || userRole === 'farm_manager',
    canManageFeed: () => userRole === 'superadmin' || userRole === 'feed_manager',
    canViewFinancials: () => userRole === 'superadmin' || userRole === 'accountant' || userRole === 'farm_manager',
    canManageUsers: () => userRole === 'superadmin',

    // Feature-specific permissions
    canAddUsers: () => userRole === 'superadmin',
    canDeleteRecords: () => userRole === 'superadmin' || userRole === 'farm_manager' || userRole === 'feed_manager',
    canViewAllReports: () => userRole === 'superadmin',
    canExportData: () => userRole !== 'employee',
    canModifyPrices: () => userRole === 'superadmin' || userRole === 'accountant',

    // Check multiple roles
    hasAnyRole: (roles: UserRole[]) => roles.includes(userRole),
    hasAllRoles: (roles: UserRole[]) => roles.every(role => role === userRole), // Utile pour des permissions très restrictives

    // Custom permission checks
    canPerformAction: (actionRoles: UserRole[]) => actionRoles.includes(userRole),
    isAuthorizedFor: (check: (role: UserRole) => boolean) => check(userRole)
  };
};