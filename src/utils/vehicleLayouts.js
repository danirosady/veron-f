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
      { axle: 'rear_1', axleLabel: 'POROS 1 - BELAKANG 1', sideLabels: ['L', 'R'] },
      { axle: 'rear_2', axleLabel: 'POROS 2 - BELAKANG 2', sideLabels: ['L', 'R'] },
      { axle: 'bogie',  axleLabel: 'POROS 3 - BOGIE',      sideLabels: ['L', 'R'] },
      { axle: 'front',  axleLabel: 'POROS 4 - DEPAN',      sideLabels: ['L', 'R'] },
    ],
  },
  SANY_10POS: {
    maxPositions: 10,
    rows: [
      { axle: 'rear_1', axleLabel: 'POROS 1 - BELAKANG 1', sideLabels: ['L', 'R'] },
      { axle: 'rear_2', axleLabel: 'POROS 2 - BELAKANG 2', sideLabels: ['L', 'R'] },
      { axle: 'bogie',  axleLabel: 'POROS 3 - BOGIE',      sideLabels: ['L', 'R'] },
      { axle: 'front',  axleLabel: 'POROS 4 - DEPAN',      sideLabels: ['L', 'R'] },
    ],
  },
  GREADER_6POS: {
    maxPositions: 6,
    rows: [
      { axle: 'rear',   axleLabel: 'POROS 1 - BELAKANG',   sideLabels: ['L', 'R'] },
      { axle: 'bogie',  axleLabel: 'POROS 2 - BOGIE',      sideLabels: ['L', 'R'] },
      { axle: 'front',  axleLabel: 'POROS 3 - DEPAN',      sideLabels: ['L', 'R'] },
    ],
  },
};
