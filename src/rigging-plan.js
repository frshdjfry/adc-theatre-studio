// Overstage line positions are traced from the plan. Flying bars are shown
// at a representative preview trim; they are not fixed at this height.
export const RIGGING = {
  bars: [
    {id: 'bridge-1', label: 'Bridge 1', a: {x: -4150, y: -4310}, b: {x: 4150, y: -4310}, height: 5085, estimated: true},
    {id: 'bridge-2', label: 'Bridge 2', a: {x: -4150, y: -8340}, b: {x: 4150, y: -8340}, height: 5085, estimated: true},
    {id: 'C2', label: 'C2 · downstage', a: {x: -3990, y: 630}, b: {x: 3490, y: 720}, height: 5200, estimated: true},
    {id: 'C8', label: 'C8 · midstage', a: {x: -3990, y: 2450}, b: {x: 3490, y: 2450}, height: 5200, estimated: true},
    {id: 'C14', label: 'C14 · upstage', a: {x: -3990, y: 4450}, b: {x: 3490, y: 4470}, height: 5200, estimated: true},
    {id: 'C20', label: 'C20 · rear stage', a: {x: -3990, y: 5960}, b: {x: 3490, y: 5960}, height: 5200, estimated: true},
  ],
};
export const barLabel = id => RIGGING.bars.find(bar => bar.id === id)?.label ?? id;
