import { useAuth } from '../contexts/AuthContext';
import { getRolePermissions, canUserAccess, getDefaultPage, getRoleDisplayName } from '../utils/rolePermissions';
import { PageId } from '../utils/rolePermissions';

export const useRoleAccess = () => {
  const { appUser } = useAuth();

  const userRole = appUser?.role || 'employee';
  const permissions = getRolePermissions(userRole);

  return {
    userRole,
    permissions,
    canAccess: (pageId: PageId) => canUserAccess(userRole, pageId),
    getDefaultPage: () => getDefaultPage(userRole),
    getRoleDisplayName: () => getRoleDisplayName(userRole),
    allowedPages: permissions.canAccess,
    isLoaded: !!appUser
  };
};