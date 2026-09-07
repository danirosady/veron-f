// Chassis image URLs for each unit type
// ADT_8POS uses the 2x4x4 image; others fall back to SVG in VehicleCanvasCore
export const VEHICLE_CHASSIS_IMAGES = {
  ADT_8POS:      '/vehicle-chassis-2x4x4.png',
  SANY_10POS:    null,
  GREADER_6POS:  null,
};

export const VEHICLE_LAYOUTS = {
  ADT_8POS: {
    maxPositions: 8,
    rows: [
      { axle: 'poros_3', axleLabel: 'POROS 3', sideLabels: ['L', 'R'] },
      { axle: 'poros_4', axleLabel: 'POROS 4', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
    ],
  },
  SANY_10POS: {
    maxPositions: 10,
    rows: [
      { axle: 'poros_3', axleLabel: 'POROS 3', sideLabels: ['L', 'R'] },
      { axle: 'poros_4', axleLabel: 'POROS 4', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
    ],
  },
  GREADER_6POS: {
    maxPositions: 6,
    rows: [
      { axle: 'poros_5', axleLabel: 'POROS 5', sideLabels: ['L', 'R'] },
      { axle: 'poros_2', axleLabel: 'POROS 2', sideLabels: ['L', 'R'] },
      { axle: 'poros_1', axleLabel: 'POROS 1', sideLabels: ['L', 'R'] },
    ],
  },
};
