import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

if (typeof FileReader === "undefined") {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((b) => {
        this.result = b;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((b) => {
        this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      });
    }
  };
}

const OUT = process.argv[2] || join(import.meta.dirname, "../../backend/public/models");
mkdirSync(OUT, { recursive: true });

const M = (v) => v / 1000; // mm -> meters (AR real-world scale)

function std(color, metalness, roughness) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness, roughness });
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function addMesh(group, geo, mat, pos, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  group.add(m);
  return m;
}

function buildPhone(spec, finishHex) {
  const g = new THREE.Group();
  const w = M(spec.width), h = M(spec.height), d = M(spec.depth), r = M(11);

  const shape = roundedRect(w, h, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true, bevelSegments: 6, steps: 2, bevelSize: M(0.4), bevelThickness: M(0.4)
  });
  geo.center();
  addMesh(g, geo, std(finishHex, 0.82, 0.28), [0, 0, 0]);

  addMesh(g, new THREE.PlaneGeometry(w - M(4), h - M(4)), std("#07101f", 0.1, 0.12), [0, 0, d / 2 + M(0.5)]);
  addMesh(g, new THREE.PlaneGeometry(M(12), M(3.7)), std("#000000", 0, 0.4), [0, h / 2 - M(11), d / 2 + M(0.6)]);

  addMesh(g, new THREE.PlaneGeometry(w - M(2), h - M(2)), std(finishHex, 0.35, 0.4), [0, 0, -d / 2 - M(0.5)], [0, Math.PI, 0]);

  const plateW = M(34), plateauH = M(36);
  const plateauGeo = new THREE.ExtrudeGeometry(roundedRect(plateW, plateauH, M(8)), { depth: M(2.5), bevelEnabled: false });
  plateauGeo.center();
  addMesh(g, plateauGeo, std(finishHex, 0.4, 0.3), [-w / 2 + M(22), h / 2 - M(23), -d / 2 - M(1.5)]);

  const lensGeo = new THREE.CylinderGeometry(M(7), M(7), M(2), 24);
  const lensMat = std("#101012", 0.95, 0.1);
  const off = [-w / 2 + M(16), h / 2 - M(15)], off2 = [-w / 2 + M(16), h / 2 - M(31)], off3 = [-w / 2 + M(28), h / 2 - M(23)];
  for (const o of [off, off2, off3]) addMesh(g, lensGeo, lensMat, [o[0], o[1], -d / 2 - M(3)], [Math.PI / 2, 0, 0]);
  return g;
}

function buildMacBook(finishHex) {
  const g = new THREE.Group();
  const baseW = M(355.7), baseD = M(248.1), baseH = M(16.8) * 0.35;
  const body = std(finishHex, 0.85, 0.25);

  const baseGeo = new THREE.ExtrudeGeometry(roundedRect(baseW, baseD, M(6)), { depth: baseH, bevelEnabled: false });
  baseGeo.rotateX(-Math.PI / 2);
  baseGeo.center();
  addMesh(g, baseGeo, body, [0, 0, 0]);

  addMesh(g, new THREE.PlaneGeometry(M(300), M(110)), std("#151515", 0.1, 0.8), [0, baseH / 2 + M(0.1), -M(35)], [-Math.PI / 2, 0, 0]);
  addMesh(g, new THREE.PlaneGeometry(M(140), M(90)), std(finishHex, 0.6, 0.3), [0, baseH / 2 + M(0.1), M(55)], [-Math.PI / 2, 0, 0]);

  const lid = new THREE.Group();
  lid.position.set(0, baseH / 2, -baseD / 2 + M(4));
  lid.rotation.x = 0.35;
  const lidH = M(230);
  addMesh(lid, new THREE.BoxGeometry(baseW, lidH, M(6)), body, [0, lidH / 2, 0]);
  addMesh(lid, new THREE.PlaneGeometry(baseW - M(14), lidH - M(14)), std("#0a1a33", 0.1, 0.15), [0, lidH / 2, M(3.2)]);
  g.add(lid);
  return g;
}

function buildIPad(w, h, d, finishHex) {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(roundedRect(M(w), M(h), M(12)), { depth: M(d), bevelEnabled: true, bevelSegments: 4, bevelSize: M(0.3), bevelThickness: M(0.3) });
  geo.center();
  addMesh(g, geo, std(finishHex, 0.85, 0.25), [0, 0, 0]);
  addMesh(g, new THREE.PlaneGeometry(M(w - 6), M(h - 6)), std("#120a24", 0.1, 0.12), [0, 0, M(d / 2 + 0.5)]);
  const cam = new THREE.ExtrudeGeometry(roundedRect(M(24), M(24), M(6)), { depth: M(2), bevelEnabled: false });
  cam.center();
  addMesh(g, cam, std(finishHex, 0.5, 0.3), [-M(w / 2) + M(18), M(h / 2) - M(18), -M(d / 2 + 1)]);
  return g;
}

function buildWatch(finishHex) {
  const g = new THREE.Group();
  const w = M(44), h = M(49), d = M(14.4);
  const caseGeo = new THREE.ExtrudeGeometry(roundedRect(w, h, M(11)), { depth: d, bevelEnabled: true, bevelSegments: 5, bevelSize: M(0.8), bevelThickness: M(0.8) });
  caseGeo.center();
  addMesh(g, caseGeo, std(finishHex, 0.88, 0.22), [0, 0, 0]);
  addMesh(g, new THREE.PlaneGeometry(w - M(6), h - M(6)), std("#050508", 0.1, 0.1), [0, 0, d / 2 + M(1)]);

  addMesh(g, new THREE.BoxGeometry(M(3), M(18), M(8)), std("#ff5500", 0.2, 0.3), [-w / 2 - M(1.5), M(2), 0]);
  addMesh(g, new THREE.CylinderGeometry(M(6.5), M(6.5), M(6), 24), std(finishHex, 0.9, 0.1), [w / 2 + M(3), M(12), 0], [0, 0, Math.PI / 2]);

  const strapMat = std("#d87d38", 0.05, 0.8);
  addMesh(g, new THREE.BoxGeometry(w - M(8), M(50), M(4)), strapMat, [0, h / 2 + M(25), 0]);
  addMesh(g, new THREE.BoxGeometry(w - M(8), M(50), M(4)), strapMat, [0, -h / 2 - M(25), 0]);
  return g;
}

function buildAirPods() {
  const g = new THREE.Group();
  const w = M(60.6), h = M(45.2), d = M(21.7);
  const caseGeo = new THREE.ExtrudeGeometry(roundedRect(w, h, M(10)), { depth: d, bevelEnabled: true, bevelSegments: 5, bevelSize: M(1), bevelThickness: M(1) });
  caseGeo.center();
  addMesh(g, caseGeo, std("#f5f5f7", 0.05, 0.15), [0, 0, 0]);
  addMesh(g, new THREE.PlaneGeometry(w + M(0.2), M(0.6)), std("#cccccc", 0.2, 0.4), [0, M(7), d / 2 + M(1)]);
  addMesh(g, new THREE.CircleGeometry(M(1.2), 16), std("#34c759", 0, 0.3), [0, M(1), d / 2 + M(1.1)]);

  const budMat = std("#ffffff", 0.05, 0.12);
  const stem = new THREE.CylinderGeometry(M(2.2), M(2.2), M(14), 16);
  const head = new THREE.SphereGeometry(M(5), 24, 16);
  for (const sx of [-M(12), M(12)]) {
    addMesh(g, stem, budMat, [sx, -M(2), d + M(6)], [Math.PI / 2.4, 0, 0]);
    addMesh(g, head, budMat, [sx, M(6), d + M(9)]);
  }
  return g;
}

const DEVICES = [
  { key: "iphone-16-pro-max", build: () => buildPhone({ width: 77.6, height: 163.0, depth: 8.25 }, "#C4A287") },
  { key: "iphone-16-pro", build: () => buildPhone({ width: 71.5, height: 149.6, depth: 8.25 }, "#9E978E") },
  { key: "iphone-16", build: () => buildPhone({ width: 71.6, height: 147.6, depth: 7.8 }, "#4B6CB7") },
  { key: "macbook-pro-16", build: () => buildMacBook("#2E2F32") },
  { key: "ipad-pro-13", build: () => buildIPad(215.5, 281.6, 5.1, "#2E2F32") },
  { key: "apple-watch-ultra-2", build: () => buildWatch("#9E978E") },
  { key: "airpods-pro-2", build: () => buildAirPods() }
];

const exporter = new GLTFExporter();
for (const { key, build } of DEVICES) {
  const scene = new THREE.Scene();
  scene.add(build());
  await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (buffer) => {
        writeFileSync(join(OUT, `${key}.glb`), Buffer.from(buffer));
        console.log(`glb  ${key}.glb  ${Math.round(buffer.byteLength / 1024)} KB`);
        resolve();
      },
      reject,
      { binary: true }
    );
  });
}
console.log("OK ->", OUT);
