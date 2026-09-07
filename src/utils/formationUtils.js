// ─── Formation Types ────────────────────────────────────────────────────────────
//
// formation: Array<{ axle: string, count: number }>
// e.g. [{ axle: 'poros_1', count: 2 }, { axle: 'poros_3', count: 4 }, { axle: 'poros_4', count: 4 }]
//
// Generated position shape: { position, label, side, axle, x, y, mirror_of }

// y = 0.0 is TOP of canvas, y = 1.0 is BOTTOM
// Front axle = front of vehicle = TOP of canvas (small y)
// Rear axle = back of vehicle = BOTTOM of canvas (large y)
export const AXLE_DEFAULTS = {
  poros_1: { y: 0.10, label: 'Poros 1' },
  poros_2: { y: 0.60, label: 'Poros 2' },
  poros_3: { y: 0.84, label: 'Poros 3' },
  poros_4: { y: 0.100, label: 'Poros 4' },
  poros_5: { y: 0.110, label: 'Poros 5' },
};

export const AXLE_OPTIONS = Object.entries(AXLE_DEFAULTS).map(([value, meta]) => ({
  value,
  label: `${meta.label} (${value})`,
}));

export const COUNT_OPTIONS = [2, 4, 6, 8, 10, 12];

// ─── Position Generation ──────────────────────────────────────────────────────

/**
 * Generate positions from a formation array.
 *
 * @param {Array<{axle: string, count: number}>} formation
 * @returns {Array} positions in the shape {position, label, side, axle, x, y, mirror_of}
 *
 * Positions are arranged by column: each column has one left + one right tyre.
 * After all columns are generated, tyres are re-paired by distance from vehicle
 * center (|x - 0.5|): the tyre furthest left pairs with the tyre furthest right
 * (outer pair), and the next furthest left pairs with the next furthest right
 * (inner pair). This gives correct outer/inner pair semantics regardless of
 * the number of columns per axle.
 */
export function generatePositionsFromFormation(formation) {
  const allPositions = [];
  let posNum = 1;

  formation.forEach(({ axle, count }) => {
    if (!count || count < 2) return;
    const cols = count / 2;
    const axleMeta = AXLE_DEFAULTS[axle] || { y: 0.5 };
    const y = axleMeta.y;

    // Generate left/right pairs per column first
    const axlePositions = [];
    for (let col = 0; col < cols; col++) {
      const t = (col + 1) / (cols + 1);
      const xLeft  = 0.05 + t * 0.38;
      const xRight = 0.96 - t * 0.38;

      axlePositions.push(
        { position: String(posNum),     label: `Tyre ${posNum}`,     side: 'left',  axle, x: xLeft,  y, col },
        { position: String(posNum + 1), label: `Tyre ${posNum + 1}`, side: 'right', axle, x: xRight, y, col }
      );
      posNum += 2;
    }

    // Re-pair tyres by distance from vehicle center (|x - 0.5|).
    // Furthest from center = outer pair, closest = inner pair.
    const sorted = [...axlePositions].sort(
      (a, b) => Math.abs(b.x - 0.5) - Math.abs(a.x - 0.5)
    );
    for (let i = 0; i < sorted.length; i += 2) {
      const tyreA = sorted[i];
      const tyreB = sorted[i + 1];
      tyreA.mirror_of = tyreB.position;
      tyreB.mirror_of = tyreA.position;
      allPositions.push(tyreA, tyreB);
    }
  });

  return allPositions;
}

/**
 * Calculate total positions from formation.
 */
export function totalPositionsFromFormation(formation) {
  return formation.reduce((sum, { count }) => sum + (count || 0), 0);
}

/**
 * Given existing positions (from a template), extract the formation config.
 * Useful when editing an existing template to show current formation.
 *
 * Each position object in position_config = 1 tyre.
 * Formation count = total tyres per axle = position count.
 * Stepper shows the count directly (1 stepper increment = 2 tyres = 1 pair).
 */
export function extractFormationFromPositions(positions) {
  if (!positions?.length) return [];

  const axleMap = {};

  positions.forEach((p) => {
    const axle = p.axle || 'rear';
    if (!axleMap[axle]) axleMap[axle] = 0;
    axleMap[axle]++;
  });

  return Object.entries(axleMap).map(([axle, count]) => ({
    axle,
    count,
  }));
}

/**
 * Mirror an x coordinate across the center of a [0,1] space.
 * Used when dragging a tyre to sync its mirror pair.
 */
export function mirrorX(x) {
  return Math.max(0.02, Math.min(0.98, 1.0 - x));
}
