// MICRO-HERIVERSE-RMDOC (9 ott 2026) · la trasformazione di una RMDoc, da
// Blender (Z-up, euler XYZ in radianti, stringhe) alla scena Y-up di Heriverse
// (`src/HeriverseRMDoc.js`).
//
// Il caso vero è la RMDoc D.06 del banco di Templu Mare v2: un quad messo a
// (12,5, −4, 3,25), rotazione (80°, 0, 30°), scala 1,5. I numeri qui sotto sono
// MISURATI: i quattro vertici del suo glTF (il `.bin` scritto da «Prepare for
// a use…», già Y-up) e i quattro vertici nel mondo di Blender 5.2 col glTF
// importato in una scena vuota e l'oggetto posto con quella `data.transform`
// (lo script del banco è nel referto). Deve finire dove Blender lo mostra,
// a meno di 1 cm e 0,1°.
//
//   node tests/check-rmdoc-transform.mjs
import assert from "node:assert/strict";
import { yUpPlacement, quatFromBlenderEulerXYZ, applyYUpPlacement } from "../src/HeriverseRMDoc.js";

let n = 0;
const eq = (g, e, w) => { assert.deepEqual(g, e, `${w} — ho ${JSON.stringify(g)}`); n++; };
const ok = (c, w) => { assert.ok(c, w); n++; };

// ── un po' di algebra, indipendente dal modulo ────────────────────────────
const qmul = ([aw, ax, ay, az], [bw, bx, by, bz]) => [
  aw * bw - ax * bx - ay * by - az * bz, aw * bx + ax * bw + ay * bz - az * by,
  aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw];
const rotate = (q, v) => qmul(qmul(q, [0, ...v]), [q[0], -q[1], -q[2], -q[3]]).slice(1);
const fromThree = ([x, y, z, w]) => [w, x, y, z];
const place = (t, v) => {           // three: position + quaternion · (scale ∘ v)
  const s = v.map((c, i) => c * t.scale[i]);
  return rotate(fromThree(t.quaternion), s).map((c, i) => c + t.position[i]);
};
const C = ([x, y, z]) => [x, z, -y];  // Blender → Y-up (l'exporter glTF)
const dist = (a, b) => Math.hypot(...a.map((c, i) => c - b[i]));
const angleDeg = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.reduce((s, c, i) => s + c * b[i], 0)))) * 180 / Math.PI;
const mat = ([a, b, c]) => {        // R = Rz·Ry·Rx, matrici scritte a mano
  const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
  const Rx = [[1, 0, 0], [0, ca, -sa], [0, sa, ca]], Ry = [[cb, 0, sb], [0, 1, 0], [-sb, 0, cb]],
        Rz = [[cc, -sc, 0], [sc, cc, 0], [0, 0, 1]];
  const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  return mm(mm(Rz, Ry), Rx);
};
const mv = (M, v) => M.map((r) => r.reduce((s, x, k) => s + x * v[k], 0));

// ── D.06 del banco ────────────────────────────────────────────────────────
const D06 = { position: ["12.5", "-4.0", "3.25"],
              rotation: ["1.3962633609771729", "0.0", "0.5235987901687622"],
              scale: ["1.5", "1.5", "1.5"] };
const gltfVertici = [   // POSITION del glTF (Y-up), dal .bin
  [0.5000017881393433, 0, 0.49999818205833435], [0.49999818205833435, 0, -0.5000017881393433],
  [-0.49999818205833435, 0, 0.5000017881393433], [-0.5000017881393433, 0, -0.49999818205833435]];
const blenderMondo = [  // matrix_world @ co in Blender 5.2.0, stesso ordine
  [13.214639663696289, -3.737786054611206, 2.511396884918213],
  [13.08439826965332, -3.5122132301330566, 3.9886083602905273],
  [11.91560173034668, -4.487786769866943, 2.5113916397094727],
  [11.785360336303711, -4.262213706970215, 3.988603115081787]];
const blenderQuat = [0.7399421334266663, 0.6208851337432861, 0.16636569797992706, 0.1982668936252594]; // wxyz

const t = yUpPlacement(D06);
eq(t.position, [12.5, 3.25, 4], "la posizione: (x, y, z) di Blender → (x, z, −y)");
eq(t.scale, [1.5, 1.5, 1.5], "la scala (uniforme qui)");
const scarti = gltfVertici.map((v, i) => dist(place(t, v), C(blenderMondo[i])));
ok(Math.max(...scarti) < 0.01, `i quattro vertici dove Blender li mostra: scarto massimo ${Math.max(...scarti).toExponential(2)} m (< 1 cm)`);
const [bw, bx, by, bz] = blenderQuat;
const gradi = angleDeg(fromThree(t.quaternion), [bw, bx, bz, -by]);
ok(gradi < 0.1, `l'orientamento è quello di Blender: ${gradi.toExponential(2)}° (< 0,1°)`);
// la normale del piano (in Blender (0.49, −0.85, 0.17)): il quad guarda dove deve
const normale = rotate(fromThree(t.quaternion), [0, 1, 0]);
ok(dist(normale, C([0.49240392446517944, -0.8528684973716736, 0.17364822328090668])) < 1e-5,
   "…e la normale del quad coincide");

// ── numeri e stringhe numeriche valgono uguale ────────────────────────────
eq(yUpPlacement({ position: [12.5, -4, 3.25], rotation: [1.3962633609771729, 0, 0.5235987901687622],
                  scale: [1.5, 1.5, 1.5] }), t, "numeri o stringhe: lo stesso posizionamento");
eq(yUpPlacement({ position: ["12,5", "-4", "3"] }).position, null, "una stringa che non è un numero: il campo non si applica");
eq(yUpPlacement({ scale: ["2", "3", "4"] }), { position: null, quaternion: null, scale: [2, 4, 3] },
   "un campo assente resta assente; la scala scambia y e z");
eq(yUpPlacement(null), null, "nessuna trasformazione: niente");

// ── il caso generale: rotazioni qualsiasi, scala non uniforme ─────────────
{
  let peggio = 0, peggioG = 0;
  let seme = 7;
  const rnd = () => ((seme = (seme * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let k = 0; k < 200; k++) {
    const tr = { position: [rnd() * 50, rnd() * 50, rnd() * 50], rotation: [rnd() * 4, rnd() * 4, rnd() * 4],
                 scale: [1 + rnd() * 0.9, 1 + rnd() * 0.9, 1 + rnd() * 0.9] };
    const y = yUpPlacement(tr);
    const R = mat(tr.rotation);
    for (const vB of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.3, -0.7, 0.2]]) {
      // Blender: T + R·S·v, poi in Y-up; il glTF ha il vertice già in Y-up
      const atteso = C(mv(R, vB.map((c, i) => c * tr.scale[i])).map((c, i) => c + tr.position[i]));
      peggio = Math.max(peggio, dist(place(y, C(vB)), atteso));
    }
    // il quaternione di Blender per l'euler XYZ è la matrice Rz·Ry·Rx
    const q = quatFromBlenderEulerXYZ(tr.rotation);
    const Rq = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => rotate(q, e));
    peggioG = Math.max(peggioG, ...[0, 1, 2].map((j) => dist(Rq[j], [R[0][j], R[1][j], R[2][j]])));
  }
  ok(peggio < 1e-9, `200 trasformazioni a caso, scala non uniforme: scarto ${peggio.toExponential(2)}`);
  ok(peggioG < 1e-12, "il quaternione è la matrice Rz·Ry·Rx (l'euler XYZ di Blender)");
}

// ── su un Object3D ────────────────────────────────────────────────────────
{
  const v3 = () => ({ v: null, set(...a) { this.v = a; } });
  const o = { position: v3(), quaternion: v3(), scale: v3() };
  applyYUpPlacement(o, D06);
  eq([o.position.v, o.quaternion.v, o.scale.v], [t.position, t.quaternion, t.scale],
     "applicata a un nodo di three: posizione, quaternione, scala");
}

console.log(`heriverse rmdoc transform: ${n} controlli passati`);
