/**
 * MICRO-HERIVERSE-RMDOC (9 ott 2026) — la trasformazione di una RMDoc letta da
 * chi legge.
 *
 * EM Tools scrive sul nodo RMDoc `data.transform = {position, rotation, scale}`
 * (misurato: `version_recipe.placement`, `anastylosis_manager._build_transform`):
 *   · stringhe («12.5»), una per componente;
 *   · nel sistema di Blender: Z in alto, destrorso;
 *   · `obj.location`, `obj.rotation_euler` in RADIANTI nell'ordine XYZ di
 *     Blender (un quaternione è scritto come euler XYZ), `obj.scale`.
 * Niente dichiara l'asse né l'ordine: questo è il default. La scena di
 * Heriverse è Y-up, quella delle versioni glTF che l'exporter di Blender
 * scrive: lo stesso cambio di base, C(x, y, z) = (x, z, −y), che l'exporter
 * applica alle mesh si applica qui al posizionamento:
 *   · posizione  (x, y, z)            → (x, z, −y)
 *   · rotazione  R → C·R·Cᵀ; col quaternione q = qz(γ)·qy(β)·qx(α) di Blender
 *                (w, x, y, z)         → (w, x, z, −y)
 *   · scala      (sx, sy, sz)         → (sx, sz, sy)
 * Così un punto v del glTF (già Y-up, v = C·v_B) finisce in
 * C·(T + R·S·v_B) = C·T + (C·R·Cᵀ)(C·S·Cᵀ)·v: dove Blender lo mostra.
 *
 * Numeri e stringhe numeriche valgono uguale; un componente che non è un
 * numero rende nullo il suo campo (e quel campo non si applica).
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

/** Il quaternione `[w, x, y, z]` di un euler XYZ di Blender (radianti):
 *  prima X, poi Y, poi Z sugli assi fissi, cioè R = Rz·Ry·Rx. */
export function quatFromBlenderEulerXYZ([a, b, c]) {
    const [ca, sa] = [Math.cos(a / 2), Math.sin(a / 2)];
    const [cb, sb] = [Math.cos(b / 2), Math.sin(b / 2)];
    const [cc, sc] = [Math.cos(c / 2), Math.sin(c / 2)];
    // qz ⊗ qy ⊗ qx (Hamilton)
    return [
        cc * cb * ca + sc * sb * sa,
        cc * cb * sa - sc * sb * ca,
        cc * sb * ca + sc * cb * sa,
        sc * cb * ca - cc * sb * sa,
    ];
}

/** `data.transform` di una RMDoc (Blender, Z-up) → il posizionamento nella
 *  scena Y-up: `{position: [x,y,z] | null, quaternion: [x,y,z,w] | null
 *  (l'ordine di three), scale: [x,y,z] | null}`. */
export function yUpPlacement(transform) {
    if (!transform || typeof transform !== "object") return null;
    const p = vec3(transform.position);
    const r = vec3(transform.rotation);
    const s = vec3(transform.scale);
    let quaternion = null;
    if (r) {
        const [w, x, y, z] = quatFromBlenderEulerXYZ(r);
        quaternion = [x, z, -y, w];
    }
    return {
        position: p ? [p[0], p[2], -p[1]] : null,
        quaternion,
        scale: s ? [s[0], s[2], s[1]] : null,
    };
}

/** Applica `yUpPlacement` a un Object3D di three (position, quaternion, scale). */
export function applyYUpPlacement(object, transform) {
    const t = yUpPlacement(transform);
    if (!t || !object) return t;
    if (t.position) object.position.set(...t.position);
    if (t.quaternion) object.quaternion.set(...t.quaternion);
    if (t.scale) object.scale.set(...t.scale);
    return t;
}
