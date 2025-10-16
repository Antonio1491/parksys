import {
  FolderOpen,
  Wrench,
  DollarSign,
  Megaphone,
  Users,
  Shield,
} from "lucide-react";

export const adminSidebarStructure = [
  {
    moduleKey: 'gestion',
    labelKey: 'admin.management',
    icon: FolderOpen,
    submenus: [
      { id: 'parks', type: 'link' },
      { id: 'activities', type: 'group' },
      { id: 'amenities', type: 'link' },
      { id: 'trees', type: 'group' },
      { id: 'fauna', type: 'link' },
      { id: 'visitors', type: 'group' },
      { id: 'events', type: 'group' },
      { id: 'spaceReservations', type: 'group' },
      { id: 'evaluations', type: 'group' },
    ],
  },
  {
    moduleKey: 'operations',
    labelKey: 'admin.operations',
    icon: Wrench,
    submenus: [
      { id: 'assets', type: 'group' },
      { id: 'incidents', type: 'group' },
      { id: 'warehouse', type: 'group' },
      { id: 'volunteers', type: 'group' },
    ],
  },
  {
    moduleKey: 'adminFinance',
    labelKey: 'admin.finance',
    icon: DollarSign,
    submenus: [
      { id: 'finance', type: 'group' },
      { id: 'accounting', type: 'group' },
      { id: 'concessions', type: 'group' },
    ],
  },
  {
    moduleKey: 'mktComm',
    labelKey: 'admin.marketing',
    icon: Megaphone,
    submenus: [
      { id: 'marketing', type: 'group' },
      { id: 'advertising', type: 'group' },
      { id: 'communications', type: 'group' },
    ],
  },
  {
    moduleKey: 'hr',
    labelKey: 'admin.hr',
    icon: Users,
    submenus: [
      { id: 'employees', type: 'link' },
      { id: 'timeOff', type: 'link' },
      { id: 'training', type: 'link' },
      { id: 'payroll', type: 'link' },
      { id: 'timeTracking', type: 'link' },
      { id: 'wellness', type: 'link' },
    ],
  },
  {
    moduleKey: 'configSecurity',
    labelKey: 'admin.security',
    icon: Shield,
    submenus: [
      { id: 'access', type: 'group' },
      { id: 'policies', type: 'link' },
      { id: 'notifications', type: 'link' },
      { id: 'audit', type: 'link' },
      { id: 'maintenance', type: 'link' },
    ],
  },
];