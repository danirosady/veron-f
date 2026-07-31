export const TYRE_STATUS = {
  SPARE: 'spare',
  MOUNTED: 'mounted',
  DISMOUNTED: 'dismounted',
  SCRAP: 'scrap',
  NEW_TYRE: 'new_tyre',
  REPAIR: 'repair',
};

export const TYRE_STATUS_LABELS = {
  spare: 'Spare',
  mounted: 'Mounted',
  dismounted: 'Dismounted',
  scrap: 'Scrap',
  new_tyre: 'New Tyre',
  repair: 'Repair',
};

export const TYRE_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new_tyre', label: 'New Tyre' },
  { value: 'spare', label: 'Spare' },
  { value: 'mounted', label: 'Mounted' },
  { value: 'dismounted', label: 'Dismounted' },
  { value: 'repair', label: 'Repair' },
  { value: 'scrap', label: 'Scrap' },
];

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN_COMPANY: 'admin_company',
};

export const USER_ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin_company: 'Admin Company',
};

export const REPLACEMENT_ACTIONS = {
  MOUNT: 'mount',
  DISMOUNT: 'dismount',
  SWAP: 'swap',
};

export const REPLACEMENT_ACTION_LABELS = {
  mount: 'Mount',
  dismount: 'Dismount',
  swap: 'Swap',
};

export const RTD_COLOR_THRESHOLDS = {
  CRITICAL: 5,
  WARNING: 10,
  CAUTION: 20,
};

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
};

export const PROJECT_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  completed: 'Completed',
};

export const UNIT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
};

export const UNIT_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
};

export const COMMON_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const COMMON_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const REPLACEMENT_ACTIONS_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'mount', label: 'Mount' },
  { value: 'dismount', label: 'Dismount' },
  { value: 'swap', label: 'Swap' },
];

export const POSITIONS = ['FL', 'FR', 'ML', 'MR', 'RL', 'RR', 'EL', 'ER'];
export const POSITION_LABELS = {
  FL: 'Front Left',
  FR: 'Front Right',
  ML: 'Middle Left',
  MR: 'Middle Right',
  RL: 'Rear Left',
  RR: 'Rear Right',
  EL: 'Extra Left',
  ER: 'Extra Right',
};