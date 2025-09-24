import React from 'react';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { PageId } from '../../utils/rolePermissions';
import { UserRole } from '../../types';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  /** Page required to access this component */
  requirePage?: PageId;
  /** Specific roles that can see this component */
  allowedRoles?: UserRole[];
  /** Roles that are explicitly denied */
  deniedRoles?: UserRole[];
  /** Custom permission check function */
  customCheck?: (userRole: UserRole) => boolean;
  /** What to render if access is denied (default: nothing) */
  fallback?: React.ReactNode;
}

/**
 * Component that completely hides its children if the user doesn't have permission
 * Usage examples:
 *
 * // Hide if can't access feed page
 * <RoleBasedAccess requirePage="feed">
 *   <button>Manage Feed</button>
 * </RoleBasedAccess>
 *
 * // Show only to superadmin and farm_manager
 * <RoleBasedAccess allowedRoles={['superadmin', 'farm_manager']}>
 *   <button>Farm Settings</button>
 * </RoleBasedAccess>
 *
 * // Hide from employees
 * <RoleBasedAccess deniedRoles={['employee']}>
 *   <div>Financial Data</div>
 * </RoleBasedAccess>
 *
 * // Custom permission logic
 * <RoleBasedAccess customCheck={(role) => role === 'superadmin' || role === 'accountant'}>
 *   <div>Admin/Accounting only</div>
 * </RoleBasedAccess>
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  requirePage,
  allowedRoles,
  deniedRoles,
  customCheck,
  fallback = null
}) => {
  const { userRole, canAccess, isLoaded } = useRoleAccess();

  // Don't render anything while loading user data
  if (!isLoaded) {
    return null;
  }

  let hasAccess = true;

  // Check page-based access
  if (requirePage && !canAccess(requirePage)) {
    hasAccess = false;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    hasAccess = false;
  }

  // Check denied roles
  if (deniedRoles && deniedRoles.includes(userRole)) {
    hasAccess = false;
  }

  // Check custom condition
  if (customCheck && !customCheck(userRole)) {
    hasAccess = false;
  }

  // Return children if access is granted, fallback otherwise
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleBasedAccess;

// Convenience components for common use cases
export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback = null }) => (
  <RoleBasedAccess allowedRoles={['superadmin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const FarmManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback = null }) => (
  <RoleBasedAccess allowedRoles={['superadmin', 'farm_manager']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const FeedManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback = null }) => (
  <RoleBasedAccess allowedRoles={['superadmin', 'feed_manager']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const AccountantOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback = null }) => (
  <RoleBasedAccess allowedRoles={['superadmin', 'accountant']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

export const NotEmployee: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback = null }) => (
  <RoleBasedAccess deniedRoles={['employee']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);