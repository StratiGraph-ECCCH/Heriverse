/**
 * MICRO-HERIVERSE-RMDOC (9 ott 2026) — la trasformazione di una RMDoc letta da
 * chi legge; dal 17 ott 2026 (MICRO le alternative e la trasformazione) quella
 * di OGNI nodo 3D: RM, RMDoc, RMSF.
 *
 * LA FORMA (s3Dgraphy, node datamodel 1.6.31, E.D. 16-17 ott 2026):
 * `data.transform = {position, rotation, rotation_order, angle_unit: "deg",
 * scale, up_axis, pivot?, quaternion}` — numeri, la rotazione in GRADI
 * nell'ordine di Blender (XYZ di default: prima X, poi Y, poi Z sugli assi
 * fissi, R = Rz·Ry·Rx), Z in alto, il PERNO attorno a cui si ruota e si scala
 * (nel sistema dell'oggetto; assente: il centro del suo riquadro), il
 * quaternione calcolato. La matrice, nel sistema del dato:
 *   v' = position + pivot + R·S·(v − pivot)
 * LETTURA TOLLERANTE: la forma vecchia — stringhe («12.5»), radianti, nessun
 * `angle_unit` (EM Tools, s3Dgraphy ed EMStudio fino al 16 ott) — si legge
 * ancora; una trasformazione vecchia che ruota o scala tiene il perno che ha
 * sempre avuto, l'origine (la regola di `s3dgraphy.geometry.transform`).
 *
 * La scena di Heriverse è Y-up, quella delle versioni glTF che l'exporter di
 * Blender scrive: lo stesso cambio di base, C(x, y, z) = (x, z, −y), che
 * l'exporter applica alle mesh si applica qui al posizionamento:
 *   · posizione  (x, y, z)            → (x, z, −y)   (la traslazione effettiva,
 *                                        perno compreso)
 *   · rotazione  R → C·R·Cᵀ; col quaternione q di Blender
 *                (w, x, y, z)         → (w, x, z, −y)
 *   · scala      (sx, sy, sz)         → (sx, sz, sy)
 * Così un punto v del glTF (già Y-up, v = C·v_B) finisce in
 * C·(T + R·S·v_B) = C·T + (C·R·Cᵀ)(C·S·Cᵀ)·v: dove Blender lo mostra. Con
 * `up_axis: "Y"` i numeri sono già Y-up e non si cambia base.
 *
 * Un componente che non è un numero rende nullo il suo campo (e quel campo non
 * si applica).
 */

const num = (v) => {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
};
const vec3 = (a) => {
    if (!Array.isArray(a) || a.length < 3) return null;
    const v = a.slice(0, 3).map(num);
    return v.every((x) => x !== null) ? v : null;
};

const ORDERS = ["XYZ", "XZY", "YXZ", "YZX", "ZXY", "ZYX"];
const deg2rad = (d) => (d * Math.PI) / 180;
const qmul = ([aw, ax, ay, az], [bw, bx, by, bz]) => [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
];

/** Il quaternione `[w, x, y, z]` di un euler XYZ di Blender (radianti):
 *  prima X, poi Y, poi Z sugli assi fissi, cioè R = Rz·Ry·Rx. */
export function quatFromBlenderEulerXYZ(e) {
    return quatFromBlenderEuler(e, "XYZ");
}

/** Il quaternione `[w, x, y, z]` di un euler di Blender (radianti) in uno dei
 *  suoi sei ordini: la prima lettera ruota per prima, sugli assi fissi. */
export function quatFromBlenderEuler(e, order = "XYZ") {
    let q = [1, 0, 0, 0];
    for (const letter of order) {
        const i = "XYZ".indexOf(letter);
        const a = [Math.cos(e[i] / 2), 0, 0, 0];
        a[1 + i] = Math.sin(e[i] / 2);
        q = qmul(a, q);
    }
    return q;
}

/** La matrice 3×3 (righe) di un quaternione `[w, x, y, z]`. */
const qmatrix = ([w, x, y, z]) => [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
];

/** `data.transform` letto nelle due forme → `{position, quaternion [w,x,y,z],
 *  scale, upAxis, pivot | null, old}` nel sistema del dato, oppure null. */
export function readTransform(transform) {
    if (!transform || typeof transform !== "object") return null;
    const p = vec3(transform.position);
    const r = vec3(transform.rotation);
    const s = vec3(transform.scale);
    const unit = transform.angle_unit;
    const text = ["position", "rotation", "scale"].some((k) => Array.isArray(transform[k])
        && transform[k].some((x) => typeof x === "string"));
    const old = unit !== "deg" || text || "rotation_mode" in transform;
    const order = String(transform.rotation_order || transform.rotation_mode || "XYZ").toUpperCase();
    const rad = r ? (unit === "deg" ? r.map(deg2rad) : r) : null;
    const quaternion = rad ? quatFromBlenderEuler(rad, ORDERS.includes(order) ? order : "XYZ") : null;
    let pivot = vec3(transform.pivot);
    const turns = (rad && rad.some((x) => Math.abs(x) > 1e-12)) || (s && s.some((x) => Math.abs(x - 1) > 1e-12));
    if (!pivot && old && turns) pivot = [0, 0, 0];
    return { position: p, quaternion, scale: s, upAxis: String(transform.up_axis || "Z").toUpperCase() === "Y" ? "Y" : "Z",
             pivot, old };
}

/** `data.transform` (Blender, Z-up; o già Y-up) → il posizionamento nella
 *  scena Y-up: `{position: [x,y,z] | null, quaternion: [x,y,z,w] | null
 *  (l'ordine di three), scale: [x,y,z] | null}`. Il perno entra nella
 *  traslazione: position + pivot − R·S·pivot. `pivotDefault` (il centro del
 *  riquadro, se chi chiama lo conosce) vale quando il dato non ne dichiara uno. */
export function yUpPlacement(transform, pivotDefault = null) {
    const t = readTransform(transform);
    if (!t) return null;
    let pos = t.position;
    const piv = t.pivot || pivotDefault;
    if (piv && piv.some((x) => x !== 0) && (t.quaternion || t.scale)) {
        const m = qmatrix(t.quaternion || [1, 0, 0, 0]);
        const sc = t.scale || [1, 1, 1];
        const ps = [piv[0] * sc[0], piv[1] * sc[1], piv[2] * sc[2]];
        const rs = m.map((row) => row[0] * ps[0] + row[1] * ps[1] + row[2] * ps[2]);
        const base = pos || [0, 0, 0];
        pos = [0, 1, 2].map((i) => base[i] + piv[i] - rs[i]);
    }
    if (t.upAxis === "Y") {
        const q = t.quaternion;
        return { position: pos, quaternion: q ? [q[1], q[2], q[3], q[0]] : null, scale: t.scale };
    }
    let quaternion = null;
    if (t.quaternion) {
        const [w, x, y, z] = t.quaternion;
        quaternion = [x, z, -y, w];
    }
    return {
        position: pos ? [pos[0], pos[2], -pos[1]] : null,
        quaternion,
        scale: t.scale ? [t.scale[0], t.scale[2], t.scale[1]] : null,
    };
}

/** Applica `yUpPlacement` a un Object3D di three (position, quaternion, scale). */
export function applyYUpPlacement(object, transform, pivotDefault = null) {
    const t = yUpPlacement(transform, pivotDefault);
    if (!t || !object) return t;
    if (t.position) object.position.set(...t.position);
    if (t.quaternion) object.quaternion.set(...t.quaternion);
    if (t.scale) object.scale.set(...t.scale);
    return t;
}
