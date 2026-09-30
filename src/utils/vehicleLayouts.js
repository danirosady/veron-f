// Chassis image URLs for each unit type
// Chassis image is determined by unit_type matching a key here.
// null = fallback SVG in TyreCanvasBase.
export const VEHICLE_CHASSIS_IMAGES = {
  WDT_10POS:      '/vehicle-chassis-2x4x4.png',   // Articulated Dump Truck (8 tyres, 4 axles)
  DUMP_6POS:     '/vehicle-chassis-2x4.png',      // Dump Truck (8 tyres, 4 axles)
  TRUCK_6POS:    '/vehicle-chassis-2x2x2.png',    // Standard Truck (6 tyres, 3 axles)
  COMPACT_4POS:  '/vehicle-chassis-2x2.png',      // Compact Vehicle (4 tyres, 2 axles)
};

export const VEHICLE_LAYOUTS = {
  WDT_10POS: {
    maxPositions: 10,
    rows: [
      { axle: 'poros_3', axleLabel: 'POROS 3', sideLabels: ['L', 'R'] },
      { axle: 'poros_4', axleLabel: 'POROS 4', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
    ],
  },
  DUMP_6POS: {
    maxPositions: 8,
    rows: [
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
      { axle: 'poros_3', axleLabel: 'POROS 3', sideLabels: ['L', 'R'] },
      { axle: 'poros_4', axleLabel: 'POROS 4', sideLabels: ['L', 'R'] },
    ],
  },
  TRUCK_6POS: {
    maxPositions: 6,
    rows: [
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
      { axle: 'poros_3', axleLabel: 'POROS 3', sideLabels: ['L', 'R'] },
    ],
  },
  COMPACT_4POS: {
    maxPositions: 4,
    rows: [
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
    ],
  },
};
