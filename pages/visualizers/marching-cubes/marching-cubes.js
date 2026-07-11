
/* ============================================================
   MARCHING CUBES — interactive isosurface visualizer
   Algo Infinity Verse · pages/visualizers/marching-cubes

   Sweeps a cube through a 3D scalar noise field, classifies its
   8 corners as inside/outside an isovalue, looks the resulting
   8-bit case up in a triangulation table, and stitches the
   interpolated edge points into a mesh — cell by cell.
   ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ------------------------------------------------------------
   1. CUBE TOPOLOGY + TRIANGULATION LOOKUP TABLE
   ------------------------------------------------------------
   Corner index -> local (x,y,z) via bits: x=i&1, y=(i&2)>>1, z=(i&4)>>2
   CUBE_CORNERS[i] gives that corner's unit-cube offset.
   CUBE_EDGES[e] gives the pair of corner indices an edge connects.
   CASE_TRIANGLES[case] gives a flat list of edge indices (triples,
   terminated by -1) describing which edge-intersection points form
   triangles for that 8-bit inside/outside configuration.
------------------------------------------------------------- */

const CUBE_CORNERS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];

const CUBE_EDGES = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [4, 5], [5, 7], [7, 6], [6, 4],
  [0, 4], [1, 5], [3, 7], [2, 6],
];

// 256-entry triangulation table: for each of the 256 possible
// inside/outside corner patterns, the edges (by index above) whose
// midpoints form the triangles crossing that cube. This is standard,
// widely-used Marching Cubes reference data (equivalent tables ship
// with virtually every isosurface implementation); expressed here in
// our own compact flat-array format.
const CASE_TRIANGLES = [
  [-1],
  [0, 3, 8, -1], [0, 9, 1, -1], [3, 8, 1, 1, 8, 9, -1],
  [2, 11, 3, -1], [8, 0, 11, 11, 0, 2, -1], [3, 2, 11, 1, 0, 9, -1], [11, 1, 2, 11, 9, 1, 11, 8, 9, -1],
  [1, 10, 2, -1], [0, 3, 8, 2, 1, 10, -1], [10, 2, 9, 9, 2, 0, -1], [8, 2, 3, 8, 10, 2, 8, 9, 10, -1],
  [11, 3, 10, 10, 3, 1, -1], [10, 0, 1, 10, 8, 0, 10, 11, 8, -1], [9, 3, 0, 9, 11, 3, 9, 10, 11, -1], [8, 9, 11, 11, 9, 10, -1],
  [4, 8, 7, -1], [7, 4, 3, 3, 4, 0, -1], [4, 8, 7, 0, 9, 1, -1], [1, 4, 9, 1, 7, 4, 1, 3, 7, -1],
  [8, 7, 4, 11, 3, 2, -1], [4, 11, 7, 4, 2, 11, 4, 0, 2, -1], [0, 9, 1, 8, 7, 4, 11, 3, 2, -1], [7, 4, 11, 11, 4, 2, 2, 4, 9, 2, 9, 1, -1],
  [4, 8, 7, 2, 1, 10, -1], [7, 4, 3, 3, 4, 0, 10, 2, 1, -1], [10, 2, 9, 9, 2, 0, 7, 4, 8, -1], [10, 2, 3, 10, 3, 4, 3, 7, 4, 9, 10, 4, -1],
  [1, 10, 3, 3, 10, 11, 4, 8, 7, -1], [10, 11, 1, 11, 7, 4, 1, 11, 4, 1, 4, 0, -1], [7, 4, 8, 9, 3, 0, 9, 11, 3, 9, 10, 11, -1], [7, 4, 11, 4, 9, 11, 9, 10, 11, -1],
  [9, 4, 5, -1], [9, 4, 5, 8, 0, 3, -1], [4, 5, 0, 0, 5, 1, -1], [5, 8, 4, 5, 3, 8, 5, 1, 3, -1],
  [9, 4, 5, 11, 3, 2, -1], [2, 11, 0, 0, 11, 8, 5, 9, 4, -1], [4, 5, 0, 0, 5, 1, 11, 3, 2, -1], [5, 1, 4, 1, 2, 11, 4, 1, 11, 4, 11, 8, -1],
  [1, 10, 2, 5, 9, 4, -1], [9, 4, 5, 0, 3, 8, 2, 1, 10, -1], [2, 5, 10, 2, 4, 5, 2, 0, 4, -1], [10, 2, 5, 5, 2, 4, 4, 2, 3, 4, 3, 8, -1],
  [11, 3, 10, 10, 3, 1, 4, 5, 9, -1], [4, 5, 9, 10, 0, 1, 10, 8, 0, 10, 11, 8, -1], [11, 3, 0, 11, 0, 5, 0, 4, 5, 10, 11, 5, -1], [4, 5, 8, 5, 10, 8, 10, 11, 8, -1],
  [8, 7, 9, 9, 7, 5, -1], [3, 9, 0, 3, 5, 9, 3, 7, 5, -1], [7, 0, 8, 7, 1, 0, 7, 5, 1, -1], [7, 5, 3, 3, 5, 1, -1],
  [5, 9, 7, 7, 9, 8, 2, 11, 3, -1], [2, 11, 7, 2, 7, 9, 7, 5, 9, 0, 2, 9, -1], [2, 11, 3, 7, 0, 8, 7, 1, 0, 7, 5, 1, -1], [2, 11, 1, 11, 7, 1, 7, 5, 1, -1],
  [8, 7, 9, 9, 7, 5, 2, 1, 10, -1], [10, 2, 1, 3, 9, 0, 3, 5, 9, 3, 7, 5, -1], [7, 5, 8, 5, 10, 2, 8, 5, 2, 8, 2, 0, -1], [10, 2, 5, 2, 3, 5, 3, 7, 5, -1],
  [8, 7, 5, 8, 5, 9, 11, 3, 10, 3, 1, 10, -1], [5, 11, 7, 10, 11, 5, 1, 9, 0, -1], [11, 5, 10, 7, 5, 11, 8, 3, 0, -1], [5, 11, 7, 10, 11, 5, -1],
  [6, 7, 11, -1], [7, 11, 6, 3, 8, 0, -1], [6, 7, 11, 0, 9, 1, -1], [9, 1, 8, 8, 1, 3, 6, 7, 11, -1],
  [3, 2, 7, 7, 2, 6, -1], [0, 7, 8, 0, 6, 7, 0, 2, 6, -1], [6, 7, 2, 2, 7, 3, 9, 1, 0, -1], [6, 7, 8, 6, 8, 1, 8, 9, 1, 2, 6, 1, -1],
  [11, 6, 7, 10, 2, 1, -1], [3, 8, 0, 11, 6, 7, 10, 2, 1, -1], [0, 9, 2, 2, 9, 10, 7, 11, 6, -1], [6, 7, 11, 8, 2, 3, 8, 10, 2, 8, 9, 10, -1],
  [7, 10, 6, 7, 1, 10, 7, 3, 1, -1], [8, 0, 7, 7, 0, 6, 6, 0, 1, 6, 1, 10, -1], [7, 3, 6, 3, 0, 9, 6, 3, 9, 6, 9, 10, -1], [6, 7, 10, 7, 8, 10, 8, 9, 10, -1],
  [11, 6, 8, 8, 6, 4, -1], [6, 3, 11, 6, 0, 3, 6, 4, 0, -1], [11, 6, 8, 8, 6, 4, 1, 0, 9, -1], [1, 3, 9, 3, 11, 6, 9, 3, 6, 9, 6, 4, -1],
  [2, 8, 3, 2, 4, 8, 2, 6, 4, -1], [4, 0, 6, 6, 0, 2, -1], [9, 1, 0, 2, 8, 3, 2, 4, 8, 2, 6, 4, -1], [9, 1, 4, 1, 2, 4, 2, 6, 4, -1],
  [4, 8, 6, 6, 8, 11, 1, 10, 2, -1], [1, 10, 2, 6, 3, 11, 6, 0, 3, 6, 4, 0, -1], [11, 6, 4, 11, 4, 8, 10, 2, 9, 2, 0, 9, -1], [10, 4, 9, 6, 4, 10, 11, 2, 3, -1],
  [4, 8, 3, 4, 3, 10, 3, 1, 10, 6, 4, 10, -1], [1, 10, 0, 10, 6, 0, 6, 4, 0, -1], [4, 10, 6, 9, 10, 4, 0, 8, 3, -1], [4, 10, 6, 9, 10, 4, -1],
  [6, 7, 11, 4, 5, 9, -1], [4, 5, 9, 7, 11, 6, 3, 8, 0, -1], [1, 0, 5, 5, 0, 4, 11, 6, 7, -1], [11, 6, 7, 5, 8, 4, 5, 3, 8, 5, 1, 3, -1],
  [3, 2, 7, 7, 2, 6, 9, 4, 5, -1], [5, 9, 4, 0, 7, 8, 0, 6, 7, 0, 2, 6, -1], [3, 2, 6, 3, 6, 7, 1, 0, 5, 0, 4, 5, -1], [6, 1, 2, 5, 1, 6, 4, 7, 8, -1],
  [10, 2, 1, 6, 7, 11, 4, 5, 9, -1], [0, 3, 8, 4, 5, 9, 11, 6, 7, 10, 2, 1, -1], [7, 11, 6, 2, 5, 10, 2, 4, 5, 2, 0, 4, -1], [8, 4, 7, 5, 10, 6, 3, 11, 2, -1],
  [9, 4, 5, 7, 10, 6, 7, 1, 10, 7, 3, 1, -1], [10, 6, 5, 7, 8, 4, 1, 9, 0, -1], [4, 3, 0, 7, 3, 4, 6, 5, 10, -1], [10, 6, 5, 8, 4, 7, -1],
  [9, 6, 5, 9, 11, 6, 9, 8, 11, -1], [11, 6, 3, 3, 6, 0, 0, 6, 5, 0, 5, 9, -1], [11, 6, 5, 11, 5, 0, 5, 1, 0, 8, 11, 0, -1], [11, 6, 3, 6, 5, 3, 5, 1, 3, -1],
  [9, 8, 5, 8, 3, 2, 5, 8, 2, 5, 2, 6, -1], [5, 9, 6, 9, 0, 6, 0, 2, 6, -1], [1, 6, 5, 2, 6, 1, 3, 0, 8, -1], [1, 6, 5, 2, 6, 1, -1],
  [2, 1, 10, 9, 6, 5, 9, 11, 6, 9, 8, 11, -1], [9, 0, 1, 3, 11, 2, 5, 10, 6, -1], [11, 0, 8, 2, 0, 11, 10, 6, 5, -1], [3, 11, 2, 5, 10, 6, -1],
  [1, 8, 3, 9, 8, 1, 5, 10, 6, -1], [6, 5, 10, 0, 1, 9, -1], [8, 3, 0, 5, 10, 6, -1], [6, 5, 10, -1],
  [10, 5, 6, -1], [0, 3, 8, 6, 10, 5, -1], [10, 5, 6, 9, 1, 0, -1], [3, 8, 1, 1, 8, 9, 6, 10, 5, -1],
  [2, 11, 3, 6, 10, 5, -1], [8, 0, 11, 11, 0, 2, 5, 6, 10, -1], [1, 0, 9, 2, 11, 3, 6, 10, 5, -1], [5, 6, 10, 11, 1, 2, 11, 9, 1, 11, 8, 9, -1],
  [5, 6, 1, 1, 6, 2, -1], [5, 6, 1, 1, 6, 2, 8, 0, 3, -1], [6, 9, 5, 6, 0, 9, 6, 2, 0, -1], [6, 2, 5, 2, 3, 8, 5, 2, 8, 5, 8, 9, -1],
  [3, 6, 11, 3, 5, 6, 3, 1, 5, -1], [8, 0, 1, 8, 1, 6, 1, 5, 6, 11, 8, 6, -1], [11, 3, 6, 6, 3, 5, 5, 3, 0, 5, 0, 9, -1], [5, 6, 9, 6, 11, 9, 11, 8, 9, -1],
  [5, 6, 10, 7, 4, 8, -1], [0, 3, 4, 4, 3, 7, 10, 5, 6, -1], [5, 6, 10, 4, 8, 7, 0, 9, 1, -1], [6, 10, 5, 1, 4, 9, 1, 7, 4, 1, 3, 7, -1],
  [7, 4, 8, 6, 10, 5, 2, 11, 3, -1], [10, 5, 6, 4, 11, 7, 4, 2, 11, 4, 0, 2, -1], [4, 8, 7, 6, 10, 5, 3, 2, 11, 1, 0, 9, -1], [1, 2, 10, 11, 7, 6, 9, 5, 4, -1],
  [2, 1, 6, 6, 1, 5, 8, 7, 4, -1], [0, 3, 7, 0, 7, 4, 2, 1, 6, 1, 5, 6, -1], [8, 7, 4, 6, 9, 5, 6, 0, 9, 6, 2, 0, -1], [7, 2, 3, 6, 2, 7, 5, 4, 9, -1],
  [4, 8, 7, 3, 6, 11, 3, 5, 6, 3, 1, 5, -1], [5, 0, 1, 4, 0, 5, 7, 6, 11, -1], [9, 5, 4, 6, 11, 7, 0, 8, 3, -1], [11, 7, 6, 9, 5, 4, -1],
  [6, 10, 4, 4, 10, 9, -1], [6, 10, 4, 4, 10, 9, 3, 8, 0, -1], [0, 10, 1, 0, 6, 10, 0, 4, 6, -1], [6, 10, 1, 6, 1, 8, 1, 3, 8, 4, 6, 8, -1],
  [9, 4, 10, 10, 4, 6, 3, 2, 11, -1], [2, 11, 8, 2, 8, 0, 6, 10, 4, 10, 9, 4, -1], [11, 3, 2, 0, 10, 1, 0, 6, 10, 0, 4, 6, -1], [6, 8, 4, 11, 8, 6, 2, 10, 1, -1],
  [4, 1, 9, 4, 2, 1, 4, 6, 2, -1], [3, 8, 0, 4, 1, 9, 4, 2, 1, 4, 6, 2, -1], [6, 2, 4, 4, 2, 0, -1], [3, 8, 2, 8, 4, 2, 4, 6, 2, -1],
  [4, 6, 9, 6, 11, 3, 9, 6, 3, 9, 3, 1, -1], [8, 6, 11, 4, 6, 8, 9, 0, 1, -1], [11, 3, 6, 3, 0, 6, 0, 4, 6, -1], [8, 6, 11, 4, 6, 8, -1],
  [10, 7, 6, 10, 8, 7, 10, 9, 8, -1], [3, 7, 0, 7, 6, 10, 0, 7, 10, 0, 10, 9, -1], [6, 10, 7, 7, 10, 8, 8, 10, 1, 8, 1, 0, -1], [6, 10, 7, 10, 1, 7, 1, 3, 7, -1],
  [3, 2, 11, 10, 7, 6, 10, 8, 7, 10, 9, 8, -1], [2, 9, 0, 10, 9, 2, 6, 11, 7, -1], [0, 8, 3, 7, 6, 11, 1, 2, 10, -1], [7, 6, 11, 1, 2, 10, -1],
  [2, 1, 9, 2, 9, 7, 9, 8, 7, 6, 2, 7, -1], [2, 7, 6, 3, 7, 2, 0, 1, 9, -1], [8, 7, 0, 7, 6, 0, 6, 2, 0, -1], [7, 2, 3, 6, 2, 7, -1],
  [8, 1, 9, 3, 1, 8, 11, 7, 6, -1], [11, 7, 6, 1, 9, 0, -1], [6, 11, 7, 0, 8, 3, -1], [11, 7, 6, -1],
  [7, 11, 5, 5, 11, 10, -1], [10, 5, 11, 11, 5, 7, 0, 3, 8, -1], [7, 11, 5, 5, 11, 10, 0, 9, 1, -1], [7, 11, 10, 7, 10, 5, 3, 8, 1, 8, 9, 1, -1],
  [5, 2, 10, 5, 3, 2, 5, 7, 3, -1], [5, 7, 10, 7, 8, 0, 10, 7, 0, 10, 0, 2, -1], [0, 9, 1, 5, 2, 10, 5, 3, 2, 5, 7, 3, -1], [9, 7, 8, 5, 7, 9, 10, 1, 2, -1],
  [1, 11, 2, 1, 7, 11, 1, 5, 7, -1], [8, 0, 3, 1, 11, 2, 1, 7, 11, 1, 5, 7, -1], [7, 11, 2, 7, 2, 9, 2, 0, 9, 5, 7, 9, -1], [7, 9, 5, 8, 9, 7, 3, 11, 2, -1],
  [3, 1, 7, 7, 1, 5, -1], [8, 0, 7, 0, 1, 7, 1, 5, 7, -1], [0, 9, 3, 9, 5, 3, 5, 7, 3, -1], [9, 7, 8, 5, 7, 9, -1],
  [8, 5, 4, 8, 10, 5, 8, 11, 10, -1], [0, 3, 11, 0, 11, 5, 11, 10, 5, 4, 0, 5, -1], [1, 0, 9, 8, 5, 4, 8, 10, 5, 8, 11, 10, -1], [10, 3, 11, 1, 3, 10, 9, 5, 4, -1],
  [3, 2, 8, 8, 2, 4, 4, 2, 10, 4, 10, 5, -1], [10, 5, 2, 5, 4, 2, 4, 0, 2, -1], [5, 4, 9, 8, 3, 0, 10, 1, 2, -1], [2, 10, 1, 4, 9, 5, -1],
  [8, 11, 4, 11, 2, 1, 4, 11, 1, 4, 1, 5, -1], [0, 5, 4, 1, 5, 0, 2, 3, 11, -1], [0, 11, 2, 8, 11, 0, 4, 9, 5, -1], [5, 4, 9, 2, 3, 11, -1],
  [4, 8, 5, 8, 3, 5, 3, 1, 5, -1], [0, 5, 4, 1, 5, 0, -1], [5, 4, 9, 3, 0, 8, -1], [5, 4, 9, -1],
  [11, 4, 7, 11, 9, 4, 11, 10, 9, -1], [0, 3, 8, 11, 4, 7, 11, 9, 4, 11, 10, 9, -1], [11, 10, 7, 10, 1, 0, 7, 10, 0, 7, 0, 4, -1], [3, 10, 1, 11, 10, 3, 7, 8, 4, -1],
  [3, 2, 10, 3, 10, 4, 10, 9, 4, 7, 3, 4, -1], [9, 2, 10, 0, 2, 9, 8, 4, 7, -1], [3, 4, 7, 0, 4, 3, 1, 2, 10, -1], [7, 8, 4, 10, 1, 2, -1],
  [7, 11, 4, 4, 11, 9, 9, 11, 2, 9, 2, 1, -1], [1, 9, 0, 4, 7, 8, 2, 3, 11, -1], [7, 11, 4, 11, 2, 4, 2, 0, 4, -1], [4, 7, 8, 2, 3, 11, -1],
  [9, 4, 1, 4, 7, 1, 7, 3, 1, -1], [7, 8, 4, 1, 9, 0, -1], [3, 4, 7, 0, 4, 3, -1], [7, 8, 4, -1],
  [11, 10, 8, 8, 10, 9, -1], [0, 3, 9, 3, 11, 9, 11, 10, 9, -1], [1, 0, 10, 0, 8, 10, 8, 11, 10, -1], [10, 3, 11, 1, 3, 10, -1],
  [3, 2, 8, 2, 10, 8, 10, 9, 8, -1], [9, 2, 10, 0, 2, 9, -1], [8, 3, 0, 10, 1, 2, -1], [2, 10, 1, -1],
  [2, 1, 11, 1, 9, 11, 9, 8, 11, -1], [11, 2, 3, 9, 0, 1, -1], [11, 0, 8, 2, 0, 11, -1], [3, 11, 2, -1],
  [1, 8, 3, 9, 8, 1, -1], [1, 9, 0, -1], [8, 3, 0, -1], [-1],
];

/* ------------------------------------------------------------
   2. SEEDED GRADIENT NOISE
   ------------------------------------------------------------
   Small self-contained 3D gradient (Perlin-style) noise so the
   scalar field is reproducible per "seed" and reseedable on demand.
------------------------------------------------------------- */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRADIENTS_3D = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

class GradientNoise {
  constructor(seed) {
    this.setSeed(seed);
  }
  setSeed(seed) {
    const rand = mulberry32(seed >>> 0);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = perm[i & 255];
  }
  static fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  static lerp(a, b, t) { return a + t * (b - a); }
  grad(hash, x, y, z) {
    const g = GRADIENTS_3D[hash % 12];
    return g[0] * x + g[1] * y + g[2] * z;
  }
  sample(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y), zf = z - Math.floor(z);
    const u = GradientNoise.fade(xf), v = GradientNoise.fade(yf), w = GradientNoise.fade(zf);
    const p = this.perm;
    const a0 = p[X] + Y, aa = p[a0] + Z, ab = p[a0 + 1] + Z;
    const b0 = p[X + 1] + Y, ba = p[b0] + Z, bb = p[b0 + 1] + Z;

    const x1 = GradientNoise.lerp(this.grad(p[aa], xf, yf, zf), this.grad(p[ba], xf - 1, yf, zf), u);
    const x2 = GradientNoise.lerp(this.grad(p[ab], xf, yf - 1, zf), this.grad(p[bb], xf - 1, yf - 1, zf), u);
    const y1 = GradientNoise.lerp(x1, x2, v);

    const x3 = GradientNoise.lerp(this.grad(p[aa + 1], xf, yf, zf - 1), this.grad(p[ba + 1], xf - 1, yf, zf - 1), u);
    const x4 = GradientNoise.lerp(this.grad(p[ab + 1], xf, yf - 1, zf - 1), this.grad(p[bb + 1], xf - 1, yf - 1, zf - 1), u);
    const y2 = GradientNoise.lerp(x3, x4, v);

    return GradientNoise.lerp(y1, y2, w) * 1.4; // roughly normalize to [-1, 1]
  }
  // fractal sum of a few octaves for more organic blobby shapes
  fbm(x, y, z) {
    let total = 0, amp = 1, freq = 1, norm = 0;
    for (let o = 0; o < 4; o++) {
      total += this.sample(x * freq, y * freq, z * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return total / norm;
  }
}

/* ------------------------------------------------------------
   3. GLOBAL STATE
------------------------------------------------------------- */

const state = {
  noise: new GradientNoise(1337),
  resolution: 18,       // sample points per axis
  frequency: 1.0,
  isoValue: 0.0,
  boxSize: 10,           // world-space size of the sampled volume
  field: null,           // Float32Array of scalar values
  showPoints: true,
  showGrid: false,
  wireSurface: false,
  stepMode: false,
  sweeping: false,
  sweepIndex: 0,
  sweepTotal: 0,
  sweepSpeed: 6,          // cells / second
  sweepAccum: 0,
  stepPositions: [],      // accumulated permanent triangle verts (step mode)
  lastFrameTime: performance.now(),
};

/* ------------------------------------------------------------
   4. THREE.JS SCENE BOOTSTRAP
------------------------------------------------------------- */

const viewportEl = document.getElementById("viewport");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewportEl.clientWidth, viewportEl.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewportEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05050c, 0.028);

const camera = new THREE.PerspectiveCamera(
  50, viewportEl.clientWidth / viewportEl.clientHeight, 0.1, 200
);
camera.position.set(13, 10, 15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 6;
controls.maxDistance = 40;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.1;

// lighting — cool key light + warm rim to match the purple/cyan palette
const hemi = new THREE.HemisphereLight(0x8b7bff, 0x0a0612, 0.55);
scene.add(hemi);

const key = new THREE.DirectionalLight(0x7c3aed, 1.4);
key.position.set(8, 12, 6);
scene.add(key);

const rim = new THREE.DirectionalLight(0x06b6d4, 1.0);
rim.position.set(-10, -4, -8);
scene.add(rim);

// bounding box of the sampled volume
const boundsGroup = new THREE.Group();
scene.add(boundsGroup);
const boundsEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(state.boxSize, state.boxSize, state.boxSize)),
  new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.28 })
);
boundsGroup.add(boundsEdges);

// field points (colored by inside/outside)
const pointsGeom = new THREE.BufferGeometry();
const pointsMat = new THREE.PointsMaterial({
  size: 0.09,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  sizeAttenuation: true,
});
const fieldPoints = new THREE.Points(pointsGeom, pointsMat);
scene.add(fieldPoints);

// optional voxel grid wireframe (outline of every sampled cell layer)
const gridGroup = new THREE.Group();
gridGroup.visible = state.showGrid;
scene.add(gridGroup);

// permanent generated surface
const surfaceGeom = new THREE.BufferGeometry();
const surfaceMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.35,
  metalness: 0.15,
  side: THREE.DoubleSide,
  flatShading: false,
});
const surfaceMesh = new THREE.Mesh(surfaceGeom, surfaceMat);
scene.add(surfaceMesh);

const wireMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.5 });
let wireMesh = null;

// --- step-mode helper visuals ---
const sweepCubeGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
const sweepCubeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.9 });
const sweepCube = new THREE.LineSegments(sweepCubeGeom, sweepCubeMat);
sweepCube.visible = false;
scene.add(sweepCube);

const cornerInsideMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
const cornerOutsideMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
const cornerSphereGeo = new THREE.SphereGeometry(0.07, 12, 12);
const cornerSpheres = [];
for (let i = 0; i < 8; i++) {
  const m = new THREE.Mesh(cornerSphereGeo, cornerOutsideMat);
  m.visible = false;
  scene.add(m);
  cornerSpheres.push(m);
}

const edgeMarkerGeo = new THREE.SphereGeometry(0.055, 10, 10);
const edgeMarkerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
const edgeMarkers = [];
for (let i = 0; i < 12; i++) {
  const m = new THREE.Mesh(edgeMarkerGeo, edgeMarkerMat);
  m.visible = false;
  scene.add(m);
  edgeMarkers.push(m);
}

// active-cell triangles (bright highlight, fades into permanent surface)
const activeCellGeom = new THREE.BufferGeometry();
const activeCellMat = new THREE.MeshBasicMaterial({
  color: 0x06b6d4, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
});
const activeCellMesh = new THREE.Mesh(activeCellGeom, activeCellMat);
scene.add(activeCellMesh);

window.addEventListener("resize", () => {
  const w = viewportEl.clientWidth, h = viewportEl.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

/* ------------------------------------------------------------
   5. FIELD GENERATION
------------------------------------------------------------- */

function worldPosOf(i, j, k) {
  const n = state.resolution;
  const half = state.boxSize / 2;
  const step = state.boxSize / (n - 1);
  return new THREE.Vector3(i * step - half, j * step - half, k * step - half);
}

function fieldIndex(i, j, k) {
  const n = state.resolution;
  return i + j * n + k * n * n;
}

function generateField() {
  const n = state.resolution;
  const field = new Float32Array(n * n * n);
  const freq = state.frequency * 0.35;
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const p = worldPosOf(i, j, k);
        field[fieldIndex(i, j, k)] = state.noise.fbm(p.x * freq, p.y * freq, p.z * freq);
      }
    }
  }
  state.field = field;
  rebuildFieldPoints();
  rebuildGridWireframe();
}

function insideColorFor(v) {
  return v > state.isoValue
    ? new THREE.Color(0xf472b6)
    : new THREE.Color(0x38bdf8);
}

function rebuildFieldPoints() {
  const n = state.resolution;
  const positions = new Float32Array(n * n * n * 3);
  const colors = new Float32Array(n * n * n * 3);
  let ptr = 0;
  const c = new THREE.Color();
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const p = worldPosOf(i, j, k);
        positions[ptr] = p.x; positions[ptr + 1] = p.y; positions[ptr + 2] = p.z;
        const v = state.field[fieldIndex(i, j, k)];
        c.copy(insideColorFor(v));
        colors[ptr] = c.r; colors[ptr + 1] = c.g; colors[ptr + 2] = c.b;
        ptr += 3;
      }
    }
  }
  pointsGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointsGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  pointsGeom.attributes.position.needsUpdate = true;
  pointsGeom.attributes.color.needsUpdate = true;
}

function recolorFieldPoints() {
  const attr = pointsGeom.attributes.color;
  if (!attr) return;
  const n = state.resolution;
  const c = new THREE.Color();
  let ptr = 0;
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const v = state.field[fieldIndex(i, j, k)];
        c.copy(insideColorFor(v));
        attr.array[ptr] = c.r; attr.array[ptr + 1] = c.g; attr.array[ptr + 2] = c.b;
        ptr += 3;
      }
    }
  }
  attr.needsUpdate = true;
}

function rebuildGridWireframe() {
  gridGroup.clear();
  if (!state.showGrid) return;
  const n = state.resolution;
  const half = state.boxSize / 2;
  const step = state.boxSize / (n - 1);
  const mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.12 });
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = i * step - half;
    // three axis-aligned line families sampled sparsely for readability
    pts.push(-half, -half, c, half, -half, c);
    pts.push(-half, half, c, half, half, c);
    pts.push(c, -half, -half, c, half, -half);
    pts.push(c, -half, half, c, half, half);
    pts.push(-half, c, -half, -half, c, half);
    pts.push(half, c, -half, half, c, half);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  gridGroup.add(new THREE.LineSegments(geo, mat));
}

/* ------------------------------------------------------------
   6. MARCHING CUBES CORE
------------------------------------------------------------- */

// Interpolated position along an edge crossing the isosurface,
// plus a small height-based color used to shade the surface.
function interpolateEdge(cellOrigin, step, edgeIdx, cornerVals) {
  const [ca, cb] = CUBE_EDGES[edgeIdx];
  const oa = CUBE_CORNERS[ca], ob = CUBE_CORNERS[cb];
  const va = cornerVals[ca], vb = cornerVals[cb];
  let t = 0.5;
  const denom = vb - va;
  if (Math.abs(denom) > 1e-6) t = (state.isoValue - va) / denom;
  t = Math.min(1, Math.max(0, t));

  const ax = cellOrigin.x + oa[0] * step, ay = cellOrigin.y + oa[1] * step, az = cellOrigin.z + oa[2] * step;
  const bx = cellOrigin.x + ob[0] * step, by = cellOrigin.y + ob[1] * step, bz = cellOrigin.z + ob[2] * step;

  return new THREE.Vector3(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
}

function computeCellCase(i, j, k) {
  const n = state.resolution;
  const vals = new Array(8);
  for (let c = 0; c < 8; c++) {
    const [dx, dy, dz] = CUBE_CORNERS[c];
    vals[c] = state.field[fieldIndex(i + dx, j + dy, k + dz)];
  }
  let caseIndex = 0;
  for (let c = 0; c < 8; c++) if (vals[c] > state.isoValue) caseIndex |= (1 << c);
  return { caseIndex, vals };
}

function cellOriginWorld(i, j, k) {
  return worldPosOf(i, j, k);
}

function cellStepWorld() {
  return state.boxSize / (state.resolution - 1);
}

// Height-tinted color: purple near the bottom, cyan near the top.
const _colA = new THREE.Color(0x7c3aed);
const _colB = new THREE.Color(0x06b6d4);
function heightColor(y) {
  const half = state.boxSize / 2;
  const t = THREE.MathUtils.clamp((y + half) / state.boxSize, 0, 1);
  return _colA.clone().lerp(_colB, t);
}

function trianglesForCell(i, j, k) {
  const { caseIndex, vals } = computeCellCase(i, j, k);
  if (caseIndex === 0 || caseIndex === 255) return { verts: [], caseIndex, vals, cutEdges: [] };
  const edgeList = CASE_TRIANGLES[caseIndex];
  const origin = cellOriginWorld(i, j, k);
  const step = cellStepWorld();
  const verts = [];
  const cutEdges = new Set();
  for (let idx = 0; idx < edgeList.length; idx++) {
    const e = edgeList[idx];
    if (e === -1) break;
    cutEdges.add(e);
    verts.push(interpolateEdge(origin, step, e, vals));
  }
  return { verts, caseIndex, vals, cutEdges: [...cutEdges] };
}

/* ---- Live (instant, whole-field) mesh build ---- */
function buildLiveMesh() {
  const n = state.resolution;
  const positions = [];
  const colors = [];
  for (let k = 0; k < n - 1; k++) {
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const { verts } = trianglesForCell(i, j, k);
        for (const v of verts) {
          positions.push(v.x, v.y, v.z);
          const c = heightColor(v.y);
          colors.push(c.r, c.g, c.b);
        }
      }
    }
  }
  applyGeometry(surfaceGeom, positions, colors);
  document.getElementById("chipTris").textContent = String(positions.length / 9 | 0);
  syncWireMesh();
}

function applyGeometry(geom, positions, colors) {
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (colors) geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  geom.attributes.position.needsUpdate = true;
}

function syncWireMesh() {
  if (wireMesh) { scene.remove(wireMesh); wireMesh = null; }
  if (state.wireSurface) {
    wireMesh = new THREE.Mesh(surfaceGeom, wireMat);
    scene.add(wireMesh);
  }
}

/* ------------------------------------------------------------
   7. STEP-BY-STEP SWEEP MODE
------------------------------------------------------------- */

function cellCountPerAxis() { return state.resolution - 1; }

function cellCoordsFromIndex(idx) {
  const m = cellCountPerAxis();
  const i = idx % m;
  const j = Math.floor(idx / m) % m;
  const k = Math.floor(idx / (m * m));
  return [i, j, k];
}

function resetSweep() {
  state.sweeping = false;
  state.sweepIndex = 0;
  const m = cellCountPerAxis();
  state.sweepTotal = m * m * m;
  state.stepPositions = [];
  state.stepColors = [];
  applyGeometry(surfaceGeom, [], []);
  activeCellGeom.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
  hideSweepVisuals();
  updateStepUI();
  document.getElementById("stepPlayBtn").textContent = "▶ Play";
}

function hideSweepVisuals() {
  sweepCube.visible = false;
  cornerSpheres.forEach(s => s.visible = false);
  edgeMarkers.forEach(m => m.visible = false);
}

function stepOnce() {
  if (state.sweepIndex >= state.sweepTotal) {
    state.sweeping = false;
    document.getElementById("stepPlayBtn").textContent = "▶ Play";
    return;
  }
  const [i, j, k] = cellCoordsFromIndex(state.sweepIndex);
  const step = cellStepWorld();
  const origin = cellOriginWorld(i, j, k);
  const center = origin.clone().addScalar(step / 2);

  const { verts, caseIndex, vals, cutEdges } = trianglesForCell(i, j, k);

  // sweep cube wireframe
  sweepCube.visible = true;
  sweepCube.scale.set(step, step, step);
  sweepCube.position.copy(center);

  // corner spheres — colored inside/outside, positioned at this cell's 8 corners
  for (let c = 0; c < 8; c++) {
    const [dx, dy, dz] = CUBE_CORNERS[c];
    const s = cornerSpheres[c];
    s.visible = true;
    s.position.set(origin.x + dx * step, origin.y + dy * step, origin.z + dz * step);
    s.material = vals[c] > state.isoValue ? cornerInsideMat : cornerOutsideMat;
  }

  // edge intersection markers — only for edges the isosurface actually crosses
  edgeMarkers.forEach(m => m.visible = false);
  cutEdges.forEach(e => {
    const p = interpolateEdge(origin, step, e, vals);
    const m = edgeMarkers[e];
    m.position.copy(p);
    m.visible = true;
  });

  // accumulate this cell's triangles into the permanent surface,
  // and show them briefly on the bright "active cell" mesh too
  const activePos = [];
  for (const v of verts) {
    state.stepPositions.push(v.x, v.y, v.z);
    const c = heightColor(v.y);
    state.stepColors.push(c.r, c.g, c.b);
    activePos.push(v.x, v.y, v.z);
  }
  applyGeometry(surfaceGeom, state.stepPositions, state.stepColors);
  activeCellGeom.setAttribute("position", new THREE.Float32BufferAttribute(activePos, 3));
  activeCellGeom.computeVertexNormals();

  updateCaseReadout(caseIndex, cutEdges.length, verts.length / 3);

  state.sweepIndex++;
  updateStepUI();

  if (state.sweepIndex >= state.sweepTotal) {
    state.sweeping = false;
    document.getElementById("stepPlayBtn").textContent = "▶ Play";
    hideSweepVisuals();
  }
}

function updateCaseReadout(caseIndex, edgeCount, triCount) {
  document.getElementById("roCase").textContent = caseIndex;
  document.getElementById("roEdges").textContent = edgeCount;
  document.getElementById("roTris").textContent = Math.round(triCount);
  document.getElementById("chipCase").textContent = caseIndex;
  document.getElementById("chipTris").textContent = String(state.stepPositions.length / 9 | 0);

  const bitsEl = document.getElementById("roBits");
  bitsEl.innerHTML = "";
  for (let b = 7; b >= 0; b--) {
    const on = (caseIndex >> b) & 1;
    const span = document.createElement("span");
    span.className = "bit" + (on ? " on" : "");
    span.textContent = b;
    bitsEl.appendChild(span);
  }
}

function updateStepUI() {
  document.getElementById("statCell").textContent = `${state.sweepIndex} / ${state.sweepTotal}`;
  const pct = state.sweepTotal ? Math.round((state.sweepIndex / state.sweepTotal) * 100) : 0;
  document.getElementById("statProg").textContent = pct + "%";
  document.getElementById("progressPct").textContent = pct + "%";
  document.getElementById("progressFill").style.width = pct + "%";
}

/* ------------------------------------------------------------
   8. UI WIRING
------------------------------------------------------------- */

const el = (id) => document.getElementById(id);

function regenerateEverything({ resetField = false } = {}) {
  if (resetField) generateField();
  if (state.stepMode) {
    resetSweep();
  } else {
    buildLiveMesh();
  }
}

// -- isovalue --
el("isoSlider").addEventListener("input", (e) => {
  state.isoValue = parseFloat(e.target.value);
  el("isoVal").textContent = state.isoValue.toFixed(2);
  el("chipIso").textContent = state.isoValue.toFixed(2);
  recolorFieldPoints();
  if (state.stepMode) {
    resetSweep();
  } else {
    buildLiveMesh();
  }
});

// -- resolution --
el("resSlider").addEventListener("change", (e) => {
  state.resolution = parseInt(e.target.value, 10);
  el("resVal").textContent = `${state.resolution}³`;
  regenerateEverything({ resetField: true });
});
el("resSlider").addEventListener("input", (e) => {
  el("resVal").textContent = `${e.target.value}³`;
});

// -- frequency --
el("freqSlider").addEventListener("input", (e) => {
  state.frequency = parseFloat(e.target.value);
  el("freqVal").textContent = state.frequency.toFixed(1);
  regenerateEverything({ resetField: true });
});

// -- reseed --
el("reseedBtn").addEventListener("click", () => {
  state.noise.setSeed((Math.random() * 1e9) | 0);
  regenerateEverything({ resetField: true });
});

// -- visibility toggles --
el("togglePoints").addEventListener("change", (e) => {
  state.showPoints = e.target.checked;
  fieldPoints.visible = state.showPoints;
});
el("toggleGrid").addEventListener("change", (e) => {
  state.showGrid = e.target.checked;
  gridGroup.visible = state.showGrid;
  rebuildGridWireframe();
});
el("toggleWire").addEventListener("change", (e) => {
  state.wireSurface = e.target.checked;
  syncWireMesh();
});
el("toggleSpin").addEventListener("change", (e) => {
  controls.autoRotate = e.target.checked;
});

// -- step mode --
const stepBackBtn = el("stepBackBtn");
const stepPlayBtn = el("stepPlayBtn");
const stepNextBtn = el("stepNextBtn");

el("toggleStep").addEventListener("change", (e) => {
  state.stepMode = e.target.checked;
  [stepBackBtn, stepPlayBtn, stepNextBtn].forEach(b => b.disabled = !state.stepMode);
  el("progressWrap").style.display = state.stepMode ? "flex" : "none";
  el("caseReadout").style.opacity = state.stepMode ? "1" : "0.4";
  activeCellMesh.visible = state.stepMode;
  if (state.stepMode) {
    resetSweep();
  } else {
    state.sweeping = false;
    hideSweepVisuals();
    buildLiveMesh();
  }
});

stepBackBtn.addEventListener("click", resetSweep);
stepNextBtn.addEventListener("click", () => { state.sweeping = false; stepPlayBtn.textContent = "▶ Play"; stepOnce(); });
stepPlayBtn.addEventListener("click", () => {
  state.sweeping = !state.sweeping;
  stepPlayBtn.textContent = state.sweeping ? "⏸ Pause" : "▶ Play";
});

el("speedSlider").addEventListener("input", (e) => {
  state.sweepSpeed = parseInt(e.target.value, 10);
  el("speedVal").textContent = `${state.sweepSpeed}/s`;
});

// -- header buttons --
let dark = true;
el("themeToggle").addEventListener("click", () => {
  dark = !dark;
  document.body.style.filter = dark ? "" : "invert(1) hue-rotate(180deg)";
  el("themeToggle").textContent = dark ? "🌙" : "☀️";
});

el("infoToggle").addEventListener("click", () => {
  el("toggleStep").checked = true;
  el("toggleStep").dispatchEvent(new Event("change"));
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ------------------------------------------------------------
   9. ANIMATION LOOP
------------------------------------------------------------- */

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - state.lastFrameTime) / 1000, 0.25);
  state.lastFrameTime = now;

  if (state.stepMode && state.sweeping) {
    state.sweepAccum += dt * state.sweepSpeed;
    while (state.sweepAccum >= 1) {
      state.sweepAccum -= 1;
      stepOnce();
      if (!state.sweeping) break;
    }
  }

  if (sweepCube.visible) {
    const pulse = 1 + Math.sin(now * 0.006) * 0.015;
    sweepCube.scale.multiplyScalar(1); // keep set scale; pulse handled via material opacity below
    sweepCubeMat.opacity = 0.75 + Math.sin(now * 0.006) * 0.2;
  }

  controls.update();
  renderer.render(scene, camera);
}

/* ------------------------------------------------------------
   10. BOOT
------------------------------------------------------------- */

function boot() {
  el("resVal").textContent = `${state.resolution}³`;
  el("freqVal").textContent = state.frequency.toFixed(1);
  el("isoVal").textContent = state.isoValue.toFixed(2);
  el("chipIso").textContent = state.isoValue.toFixed(2);
  el("progressWrap").style.display = "none";
  el("caseReadout").style.opacity = "0.4";

  generateField();
  buildLiveMesh();
  animate();

  requestAnimationFrame(() => {
    setTimeout(() => {
      el("loadingVeil").classList.add("hidden");
    }, 350);
  });
}

boot();
