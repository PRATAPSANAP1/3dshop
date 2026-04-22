import { useAuth } from '@/context/AuthContext';

export type EmployeePermission =
  | 'VIEW_ORDERS'
  | 'UPDATE_DELIVERY_STATUS'
  | 'USE_SCANNER'
  | 'VIEW_PRODUCTS'
  | 'VIEW_DASHBOARD_STATS'
  | 'MANAGE_INVENTORY_STOCK';

export const PERMISSION_LABELS: Record<EmployeePermission, string> = {
  VIEW_ORDERS: 'View orders',
  UPDATE_DELIVERY_STATUS: 'Update delivery status',
  USE_SCANNER: 'Use scanner / POS',
  VIEW_PRODUCTS: 'View products',
  VIEW_DASHBOARD_STATS: 'View dashboard stats',
  MANAGE_INVENTORY_STOCK: 'Adjust stock levels',
};

export const usePermission = (perm: EmployeePermission): boolean => {
  const { user } = useAuth();
  if (!user) return false;
  if ((user as any).role === 'admin' || (user as any).role === 'superadmin') return true;
  return (user as any).employeePermissions?.includes(perm) ?? false;
};

export const useHasAnyPermission = (): boolean => {
  const { user } = useAuth();
  if (!user) return false;
  if ((user as any).role === 'admin' || (user as any).role === 'superadmin') return true;
  return ((user as any).employeePermissions?.length ?? 0) > 0;
};
