// Plan units are millimetres. X increases towards prompt side, Y upstage.
// Zero is the intersection of the stage centreline and safety curtain.
export const STAGE = { depth: 8400, openingWidth: 6550, openingHeight: 3810, front: -2540 };
export const CENTRE_STAGE = {x: 0, y: 3500};
export const SOURCES = {
  plan: 'https://www.adctheatre.com/media/5027/adc-a1.pdf',
  specification: 'https://www.adctheatre.com/media/7259/stage-tech-spec.pdf',
  lanterns: 'https://www.adctheatre.com/media/7544/lantern-list.pdf',
};
const point = ([x, y]) => ({x, y});

// Simplified from the June 2025 stage plan, retaining the flat forestage,
// usable wings and inset in the upstage prompt-side wall.
const floorOutline = [
  [-3550, -2540], [3550, -2540], [4200, -2440], [4550, -2140],
  [4650, -1520], [4650, -440], [7750, -440], [7750, 6360],
  [3140, 6360], [2890, 6600], [2890, 8400], [-6250, 8400],
  [-6250, -440], [-4650, -440], [-4650, -1520], [-4550, -2140], [-4200, -2440],
].map(point);
const walls = [
  [[-6250, -440], [-6250, 8400]],
  [[-6250, 8400], [2890, 8400]],
  [[2890, 8400], [2890, 6600]],
  [[2890, 6600], [3140, 6360]],
  [[3140, 6360], [7750, 6360]],
  [[7750, 6360], [7750, -440]],
].map(([a, b]) => ({a: point(a), b: point(b)}));
const halfOpening = STAGE.openingWidth / 2;
export const VENUE = {
  floorOutline,
  wallSegments: walls,
  arch: {left: -halfOpening, right: halfOpening, y: -440},
  safetyCurtain: {a: {x: -halfOpening, y: 0}, b: {x: halfOpening, y: 0}},
};

// Positions and rake are a sightline model, with the back-row eye position
// anchored to the published section (13.25 m from flat forestage, +2.9 m).
const rowCounts = [14,14,15,15,15,15,15,16,16,16,16,16,16,15,14];
const firstY = -3950, lastY = STAGE.front - 13250;
const pitch = (firstY - lastY) / (rowCounts.length - 1);
const rake = row => Math.min(row, 8) / 5.5 + Math.max(0, row - 8) / 3.3;
export const AUDIENCE_ROWS = rowCounts.map((count, row) => ({
  name: String.fromCharCode(65 + row), count,
  y: firstY - pitch * row, deck: Math.round(-780 + 2480 * rake(row) / rake(14)), pitch,
}));

export function insideStage({x, y}) {
  let inside = false;
  for (let i = 0, j = floorOutline.length - 1; i < floorOutline.length; j = i++) {
    const a = floorOutline[i], b = floorOutline[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export const planToWorld = ({x, y, height = 0}) => [x / 1000, height / 1000, -y / 1000];
export const worldToPlan = ({x, y, z}) => ({x: Math.round(x * 1000), y: Math.round(-z * 1000), height: Math.round(y * 1000)});
