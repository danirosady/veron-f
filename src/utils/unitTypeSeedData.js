/**
 * Unit Type Seed Data — FINAL positions (captured from DB after user repositioning)
 *
 * Position coord system (TyreCanvasBase):
 *   x: 0.0 = left edge, 0.5 = vehicle centre/mirror line, 1.0 = right edge
 *   y: 0.0 = top (front axle), 1.0 = bottom (rear axle)
 */

/** ADT_10POS — Articulated Dump Truck (10 tyres, 3 axles) — chassis: 2x4x4 */
const ADT_10POS_CONFIG = {
  unit_type: 'ADT_10POS',
  display_name: 'Articulated Dump Truck (10 Pos)',
  max_position: 10,
  position_config: [
    { position: 1,  label: 'Tyre 1',  side: 'left',  axle: 'poros_1', x: 0.2571, y: 0.1569, mirror_of: 2  },
    { position: 2,  label: 'Tyre 2',  side: 'right', axle: 'poros_1', x: 0.7429, y: 0.1569, mirror_of: 1  },
    { position: 3,  label: 'Tyre 3',  side: 'left',  axle: 'poros_2', x: 0.1692, y: 0.6111, mirror_of: 6  },
    { position: 4,  label: 'Tyre 4',  side: 'left',  axle: 'poros_2', x: 0.2928, y: 0.6083, mirror_of: 5  },
    { position: 5,  label: 'Tyre 5',  side: 'right', axle: 'poros_2', x: 0.7072, y: 0.6083, mirror_of: 4  },
    { position: 6,  label: 'Tyre 6',  side: 'right', axle: 'poros_2', x: 0.8308, y: 0.6111, mirror_of: 3  },
    { position: 7,  label: 'Tyre 7',  side: 'left',  axle: 'poros_3', x: 0.1691, y: 0.8081, mirror_of: 10 },
    { position: 8,  label: 'Tyre 8',  side: 'left',  axle: 'poros_3', x: 0.2867, y: 0.8081, mirror_of: 9  },
    { position: 9,  label: 'Tyre 9',  side: 'right', axle: 'poros_3', x: 0.7133, y: 0.8081, mirror_of: 8  },
    { position: 10, label: 'Tyre 10', side: 'right', axle: 'poros_3', x: 0.8309, y: 0.8081, mirror_of: 7  },
  ],
};

/** DUMP_6POS — Dump Truck (8 tyres, 2 axles) — chassis: 2x4 */
const DUMP_6POS_CONFIG = {
  unit_type: 'DUMP_6POS',
  display_name: 'Dump Truck (8 Pos)',
  max_position: 8,
  position_config: [
    { position: 1, label: 'Tyre 1', side: 'left',  axle: 'poros_1', x: 0.2425, y: 0.1542, mirror_of: 2 },
    { position: 2, label: 'Tyre 2', side: 'right', axle: 'poros_1', x: 0.7575, y: 0.1542, mirror_of: 1 },
    { position: 3, label: 'Tyre 3', side: 'left',  axle: 'poros_2', x: 0.1774, y: 0.6082, mirror_of: 6 },
    { position: 4, label: 'Tyre 4', side: 'left',  axle: 'poros_2', x: 0.299,  y: 0.6069, mirror_of: 5 },
    { position: 5, label: 'Tyre 5', side: 'right', axle: 'poros_2', x: 0.701,  y: 0.6069, mirror_of: 4 },
    { position: 6, label: 'Tyre 6', side: 'right', axle: 'poros_2', x: 0.8226, y: 0.6082, mirror_of: 3 },
  ],
};

/** TRUCK_6POS — Standard Truck (6 tyres, 3 axles) — chassis: 2x2x2 */
const TRUCK_6POS_CONFIG = {
  unit_type: 'TRUCK_6POS',
  display_name: 'Standard Truck (6 Pos)',
  max_position: 6,
  position_config: [
    { position: 1, label: 'Tyre 1', side: 'left',  axle: 'poros_1', x: 0.2654, y: 0.1556, mirror_of: 2 },
    { position: 2, label: 'Tyre 2', side: 'right', axle: 'poros_1', x: 0.7346, y: 0.1556, mirror_of: 1 },
    { position: 3, label: 'Tyre 3', side: 'left',  axle: 'poros_2', x: 0.2675, y: 0.6056, mirror_of: 4 },
    { position: 4, label: 'Tyre 4', side: 'right', axle: 'poros_2', x: 0.7325, y: 0.6056, mirror_of: 3 },
    { position: 5, label: 'Tyre 5', side: 'left',  axle: 'poros_3', x: 0.2675, y: 0.7914, mirror_of: 6 },
    { position: 6, label: 'Tyre 6', side: 'right', axle: 'poros_3', x: 0.7325, y: 0.7914, mirror_of: 5 },
  ],
};

/** COMPACT_4POS — Compact Vehicle (4 tyres, 2 axles) — chassis: 2x2 */
const COMPACT_4POS_CONFIG = {
  unit_type: 'COMPACT_4POS',
  display_name: 'Compact Vehicle (4 Pos)',
  max_position: 4,
  position_config: [
    { position: 1, label: 'Tyre 1', side: 'left',  axle: 'poros_1', x: 0.2863, y: 0.1569, mirror_of: 2 },
    { position: 2, label: 'Tyre 2', side: 'right', axle: 'poros_1', x: 0.7137, y: 0.1569, mirror_of: 1 },
    { position: 3, label: 'Tyre 3', side: 'left',  axle: 'poros_2', x: 0.2987, y: 0.7972, mirror_of: 4 },
    { position: 4, label: 'Tyre 4', side: 'right', axle: 'poros_2', x: 0.7013, y: 0.7972, mirror_of: 3 },
  ],
};

/**
 * Build the seed payload for one template config.
 */
function buildSeedPayload(config) {
  return {
    unit_type: config.unit_type,
    display_name: config.display_name,
    max_position: config.max_position,
    position_config: config.position_config,
    status: 'active',
  };
}

/** All 4 seed templates (as API payloads, ready to POST) */
export const SEED_TEMPLATES = [
  buildSeedPayload(ADT_10POS_CONFIG),
  buildSeedPayload(DUMP_6POS_CONFIG),
  buildSeedPayload(TRUCK_6POS_CONFIG),
  buildSeedPayload(COMPACT_4POS_CONFIG),
];

/** Raw config objects for reference (without generated positions) */
export const SEED_CONFIGS = [
  ADT_10POS_CONFIG,
  DUMP_6POS_CONFIG,
  TRUCK_6POS_CONFIG,
  COMPACT_4POS_CONFIG,
];
