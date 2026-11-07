/** Flip to true to show the maintenance page on the storefront. */
export const MAINTENANCE_MODE = true;

export function isMaintenanceEnabled() {
  return MAINTENANCE_MODE;
}
