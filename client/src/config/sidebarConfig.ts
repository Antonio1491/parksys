import { deriveSidebarModules } from '@/utils/sidebarHelpers';
import { sidebarSubmenus } from './sidebarSubmenus';

const moduleMap = {
  gestion: ['parks', 'activities', 'amenities', 'trees', 'fauna', 'visitors', 'events', 'spaceReservations', 'evaluations'],
  operations: ['assets', 'incidents', 'warehouse', 'volunteers'],
  adminFinance: ['finance', 'accounting', 'concessions'],
  mktComm: ['marketing', 'advertising', 'communications'],
  hr: ['employees', 'timeOff', 'training', 'payroll', 'timeTracking', 'wellness',],
  configSecurity: ['access', 'policies', 'notifications', 'audit', 'maintenance'],
};

export const sidebarModules = deriveSidebarModules(sidebarSubmenus, moduleMap);