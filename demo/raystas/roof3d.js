import * as THREE from './js/three.module.min.js';

const canvas = document.getElementById('roof3d');
const stage = canvas.parentElement;
const hint = stage.querySelector('.cfg-hint');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

function fallback() {
  canvas.hidden = true; hint.hidden = true;
  stage.querySelector('.cfg-fallback').hidden = false;
  stage.querySelector('.cfg-fallback-note').hidden = false;
  stage.querySelector('.cfg-zoom').hidden = true;
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
} catch (e) { fallback(); }

if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 200);
  const target = new THREE.Vector3(0, 2.6, 0);

  /* ---------- procedural textures ---------- */
  const tex = (w, h, draw, rep) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (rep) t.repeat.set(rep[0], rep[1]); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const noise = (g, w, h, a, base = 128) => { const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - .5) * a; d.data[i] = clampB(d.data[i] + n); d.data[i + 1] = clampB(d.data[i + 1] + n); d.data[i + 2] = clampB(d.data[i + 2] + n); } g.putImageData(d, 0, 0); };
  const clampB = v => v < 0 ? 0 : v > 255 ? 255 : v;

  const cladding = tex(512, 256, (g, w, h) => {
    g.fillStyle = '#c9cdc8'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, 0, 1, h); }
    noise(g, w, h, 10);
  });
  cladding.repeat.set(3, 1);
  const grass = tex(256, 256, (g, w, h) => { g.fillStyle = '#4c5d3c'; g.fillRect(0, 0, w, h); noise(g, w, h, 40); }, [14, 14]);
  const gravel = tex(256, 256, (g, w, h) => { g.fillStyle = '#8b8a84'; g.fillRect(0, 0, w, h); noise(g, w, h, 70); }, [6, 3]);
  const metalTex = tex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#e9e9e9'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(1, '#e4e4e4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); noise(g, w, h, 6); });
  const feltTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h); noise(g, w, h, 46);
    for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 3, 0, 2, h); }
  }, [3, 1.2]);
  const tileTex = tex(256, 256, (g, w, h) => { g.fillStyle = '#efefef'; g.fillRect(0, 0, w, h); noise(g, w, h, 30); });

  /* ---------- lights & environment ---------- */
  const hemi = new THREE.HemisphereLight(0xdfe9f2, 0x3b3a33, 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sun.position.set(14, 20, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -16; sun.shadow.camera.right = 16; sun.shadow.camera.top = 16; sun.shadow.camera.bottom = -16; sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9db7d4, .5); fill.position.set(-10, 6, -8); scene.add(fill);

  /* ---------- ground ---------- */
  const groundMat = new THREE.MeshStandardMaterial({map: grass, roughness: 1, color: 0xffffff});
  const ground = new THREE.Mesh(new THREE.CircleGeometry(34, 64), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 14), new THREE.MeshStandardMaterial({map: gravel, roughness: 1}));
  drive.rotation.x = -Math.PI / 2; drive.position.set(-3.2, .01, 10.5); drive.receiveShadow = true; scene.add(drive);
  const plinthMat = new THREE.MeshStandardMaterial({color: 0x6f716e, roughness: .95});

  /* ---------- house ---------- */
  const W = 10, D = 7, WH = 3.1, PITCH = 30 * Math.PI / 180, OVX = .55, OVZ = .65;
  const ridgeY = WH + (D / 2) * Math.tan(PITCH);
  const house = new THREE.Group(); scene.add(house);
  const wallMat = new THREE.MeshStandardMaterial({map: cladding, roughness: .85});
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, WH, D), wallMat);
  body.position.y = WH / 2 + .35; body.castShadow = body.receiveShadow = true; house.add(body);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + .1, .35, D + .1), plinthMat); plinth.position.y = .175; plinth.receiveShadow = true; house.add(plinth);
  // gables
  const gShape = new THREE.Shape(); gShape.moveTo(-D / 2, 0); gShape.lineTo(D / 2, 0); gShape.lineTo(0, (D / 2) * Math.tan(PITCH)); gShape.closePath();
  const gGeo = new THREE.ShapeGeometry(gShape);
  const gableMat = new THREE.MeshStandardMaterial({map: cladding, roughness: .85, side: THREE.DoubleSide});
  [-1, 1].forEach(s => { const g = new THREE.Mesh(gGeo, gableMat); g.rotation.y = s * Math.PI / 2; g.position.set(s * W / 2, WH + .35, 0); g.castShadow = true; house.add(g); });
  // trims, windows, door
  const trim = new THREE.MeshStandardMaterial({color: 0xf4f4f0, roughness: .6});
  const glass = new THREE.MeshStandardMaterial({color: 0x1c2730, roughness: .15, metalness: .4, emissive: 0xffb15c, emissiveIntensity: 0});
  const addWin = (x, y, z, w, h, rotY = 0) => {
    const g = new THREE.Group();
    const f = new THREE.Mesh(new THREE.BoxGeometry(w + .18, h + .18, .08), trim); g.add(f);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); p.position.z = .045; g.add(p);
    const m = new THREE.Mesh(new THREE.BoxGeometry(.06, h, .03), trim); m.position.z = .06; g.add(m);
    g.position.set(x, y, z); g.rotation.y = rotY; house.add(g);
  };
  const zF = D / 2 + .02;
  addWin(-3.2, 2.1, zF, 1.5, 1.2); addWin(3.2, 2.1, zF, 1.5, 1.2); addWin(.9, 2.1, zF, 1.1, 1.2);
  addWin(-2.5, 2.1, -zF, 1.5, 1.2, Math.PI); addWin(2.5, 2.1, -zF, 1.5, 1.2, Math.PI);
  addWin(W / 2 + .02, 2.1, -1.2, 1.2, 1.2, Math.PI / 2); addWin(W / 2 + .02, 4.25, 0, .8, .6, Math.PI / 2);
  addWin(-W / 2 - .02, 2.1, 1.2, 1.2, 1.2, -Math.PI / 2);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2.1, .1), new THREE.MeshStandardMaterial({color: 0x2a3a46, roughness: .5}));
  door.position.set(-1, 1.4, zF); house.add(door);
  const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, .3, 1), plinthMat); step.position.set(-1, .15, zF + .5); step.receiveShadow = step.castShadow = true; house.add(step);
  // corner boards
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.14, WH, .14), trim); b.position.set(sx * (W / 2), WH / 2 + .35, sz * (D / 2)); house.add(b); });

  /* ---------- roof ---------- */
  const slopeLen = (D / 2 + OVZ) / Math.cos(PITCH);
  const roofLen = W + OVX * 2;
  const roofGroup = new THREE.Group(); roofGroup.position.y = .35; house.add(roofGroup);
  const roofMat = new THREE.MeshStandardMaterial({color: 0x1f2124, roughness: .38, metalness: .55, map: metalTex});
  const edgeMat = new THREE.MeshStandardMaterial({color: 0x1f2124, roughness: .5, metalness: .4});
  const seamMat = roofMat;
  const geoCache = {};
  function surfaceGeo(kind) {
    if (geoCache[kind]) return geoCache[kind];
    let segX = 4, segV = 4, h = () => 0;
    if (kind === 'tiilikuvio') { segX = Math.round(roofLen / .05); segV = Math.round(slopeLen / .036); h = (x, v) => .022 * (.5 + .5 * Math.cos(2 * Math.PI * x / .2)) + .04 * ((v / .36) % 1); }
    if (kind === 'tiili') { segX = Math.round(roofLen / .05); segV = Math.round(slopeLen / .04); h = (x, v) => { const row = Math.floor(v / .34), off = (row % 2) * .15; return .055 * Math.abs(Math.sin(Math.PI * (x + off) / .3)) + .045 * ((v / .34) % 1); }; }
    const g = new THREE.PlaneGeometry(roofLen, slopeLen, segX, segV);
    // plane lies in XY; map local y -> slope direction v (0 at ridge)
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), v = slopeLen / 2 - y;
      pos.setZ(i, h(x + roofLen / 2, v));
    }
    g.computeVertexNormals();
    return geoCache[kind] = g;
  }
  const halves = [];
  function makeHalf(sign) {
    const g = new THREE.Group();
    // pivot at ridge; slope goes down toward +z after rotation
    const base = new THREE.Mesh(new THREE.BoxGeometry(roofLen, .12, slopeLen), edgeMat);
    base.position.set(0, -.07, slopeLen / 2); base.castShadow = true; base.receiveShadow = true; g.add(base);
    const surf = new THREE.Mesh(surfaceGeo('sauma'), roofMat);
    surf.rotation.x = -Math.PI / 2; surf.position.set(0, 0, slopeLen / 2); surf.castShadow = true; surf.receiveShadow = true; g.add(surf);
    const seams = new THREE.Group(); g.add(seams);
    for (let x = -roofLen / 2 + .3; x < roofLen / 2; x += .52) { const s = new THREE.Mesh(new THREE.BoxGeometry(.035, .055, slopeLen), seamMat); s.position.set(x, .03, slopeLen / 2); s.castShadow = true; seams.add(s); }
    const snow = new THREE.Mesh(new THREE.PlaneGeometry(roofLen - .1, slopeLen - .1, 30, 12), new THREE.MeshStandardMaterial({color: 0xf7fbff, roughness: .95, transparent: true, opacity: 0}));
    { const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .08 + Math.random() * .05); snow.geometry.computeVertexNormals(); }
    snow.rotation.x = -Math.PI / 2; snow.position.set(0, .02, slopeLen / 2); snow.receiveShadow = true; snow.visible = false; g.add(snow);
    // gutter
    const gut = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, roofLen, 12, 1, true, 0, Math.PI), edgeMat);
    gut.rotation.z = Math.PI / 2; gut.rotation.x = Math.PI; gut.position.set(0, -.12, slopeLen + .04); g.add(gut);
    // snow guard
    const guard = new THREE.Group(); g.add(guard);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, roofLen * .86, 8), edgeMat); rail.rotation.z = Math.PI / 2; rail.position.set(0, .16, slopeLen - .9); guard.add(rail);
    const rail2 = rail.clone(); rail2.position.y = .26; guard.add(rail2);
    g.rotation.x = PITCH;
    g.position.set(0, ridgeY, 0);
    if (sign < 0) { const w = new THREE.Group(); w.add(g); w.rotation.y = Math.PI; roofGroup.add(w); }
    else roofGroup.add(g);
    halves.push({g, surf, seams, snow, guard});
  }
  makeHalf(1); makeHalf(-1);
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, roofLen + .02, 14, 1, false, Math.PI * .25, Math.PI * 1.5), edgeMat);
  ridge.rotation.z = Math.PI / 2; ridge.rotation.y = 0; ridge.position.y = ridgeY + .02; ridge.castShadow = true; roofGroup.add(ridge);
  // chimney
  const chim = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.6, .7), new THREE.MeshStandardMaterial({color: 0x2b2d2f, roughness: .8}));
  chim.position.set(2.4, ridgeY + .25, -.6); chim.castShadow = true; roofGroup.add(chim);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.9, .12, .9), edgeMat); cap.position.set(2.4, ridgeY + 1.1, -.6); roofGroup.add(cap);
  // roof bridge (kattosilta) on back slope near chimney
  // downspouts
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, WH + .2, 10), edgeMat);
    p.position.set(sx * (W / 2 + .25), (WH + .35) / 2, sz * (D / 2 + .55)); house.add(p);
  });

  /* ---------- trees ---------- */
  const trunkMat = new THREE.MeshStandardMaterial({color: 0xe8e4dc, roughness: .9});
  const leafMat = new THREE.MeshStandardMaterial({color: 0x6f7f3c, roughness: .9, flatShading: true});
  const pineMat = new THREE.MeshStandardMaterial({color: 0x2f4630, roughness: .9, flatShading: true});
  const trees = [];
  const birch = (x, z, s) => { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(.09 * s, .14 * s, 4 * s, 7), trunkMat); t.position.y = 2 * s; g.add(t); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), leafMat); c.position.y = 4.4 * s; c.scale.set(1, 1.35, 1); g.add(c); g.position.set(x, 0, z); g.traverse(o => o.castShadow = true); scene.add(g); trees.push(c); };
  const pine = (x, z, s) => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.6 - i * .4) * s, 2.2 * s, 7), pineMat); c.position.y = (1.4 + i * 1.3) * s; g.add(c); } g.position.set(x, 0, z); g.traverse(o => o.castShadow = true); scene.add(g); trees.push(g); };
  birch(-9, -4, 1.1); birch(9.5, 4.5, .9); pine(-11, 5, 1.2); pine(10, -6, 1.4); pine(-6, -10, 1.3); birch(4, -11, 1);

  /* ---------- weather particles ---------- */
  const N = 2600, area = 34, top = 22;
  const rainGeo = new THREE.BufferGeometry(); const rp = new Float32Array(N * 6); const rs = new Float32Array(N);
  for (let i = 0; i < N; i++) { const x = (Math.random() - .5) * area, y = Math.random() * top, z = (Math.random() - .5) * area; rp.set([x, y, z, x - .06, y + .7, z], i * 6); rs[i] = 16 + Math.random() * 8; }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({color: 0xc6d8e6, transparent: true, opacity: .55})); rain.visible = false; rain.frustumCulled = false; scene.add(rain);
  const snowGeo = new THREE.BufferGeometry(); const sp = new Float32Array(N * 3); const sph = new Float32Array(N);
  for (let i = 0; i < N; i++) { sp.set([(Math.random() - .5) * area, Math.random() * top, (Math.random() - .5) * area], i * 3); sph[i] = Math.random() * 6.28; }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const flake = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({size: .16, map: flake, transparent: true, depthWrite: false})); snowPts.visible = false; snowPts.frustumCulled = false; scene.add(snowPts);

  /* ---------- state ---------- */
  const WEATHER = {
    sun: {bg: [0x8fb6d8, 0xf1d7b8], fog: 0xcfd9e2, sunI: 2.7, sunC: 0xfff0d6, hemiI: 1.05, exp: 1.05, rough: 0},
    rain: {bg: [0x56616c, 0x7b858e], fog: 0x6d7780, sunI: .55, sunC: 0xd9e3ec, hemiI: .95, exp: .95, rough: -.2},
    snow: {bg: [0xaebccb, 0xe4e9ee], fog: 0xd4dce4, sunI: 1.1, sunC: 0xeef4ff, hemiI: 1.2, exp: 1.0, rough: .1}
  };
  const bgCanvas = document.createElement('canvas'); bgCanvas.width = 4; bgCanvas.height = 256;
  const bgTex = new THREE.CanvasTexture(bgCanvas); bgTex.colorSpace = THREE.SRGBColorSpace; scene.background = bgTex;
  scene.fog = new THREE.Fog(0xcfd9e2, 34, 80);
  const cur = {top: new THREE.Color(0x8fb6d8), bot: new THREE.Color(0xf1d7b8), fog: new THREE.Color(0xcfd9e2), sunI: 2.7, sunC: new THREE.Color(0xfff0d6), hemiI: 1.05, rough: 0, snowAmt: 0, groundSnow: 0};
  let want = WEATHER.sun, weather = 'sun', snowTarget = 0;
  const paintBg = () => { const g = bgCanvas.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#' + cur.top.getHexString()); gr.addColorStop(1, '#' + cur.bot.getHexString()); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); bgTex.needsUpdate = true; };
  paintBg();

  const MAT = {
    sauma: {kind: 'sauma', rough: .36, metal: .6, map: metalTex, seams: true},
    tiilikuvio: {kind: 'tiilikuvio', rough: .4, metal: .55, map: metalTex, seams: false},
    kermi: {kind: 'kermi', rough: .92, metal: 0, map: feltTex, seams: false},
    tiili: {kind: 'tiili', rough: .78, metal: 0, map: tileTex, seams: false}
  };
  let matKey = 'sauma', baseRough = .36;
  const swap = {t: 1, from: 0};
  function applyMat(key) {
    const m = MAT[key]; matKey = key; baseRough = m.rough;
    halves.forEach(h => { h.surf.geometry = surfaceGeo(m.kind); h.seams.visible = m.seams; h.guard.visible = key !== 'kermi'; });
    roofMat.map = m.map; roofMat.metalness = m.metal; roofMat.needsUpdate = true;
    edgeMat.metalness = m.metal ? .4 : 0;
    swap.t = 0; // drop-in animation
  }
  function applyCol(hex) { roofMat.color.set(hex); edgeMat.color.set(hex).multiplyScalar(.9); }
  function applyWeather(w) {
    weather = w; want = WEATHER[w];
    rain.visible = w === 'rain'; snowPts.visible = w === 'snow';
    snowTarget = w === 'snow' ? 1 : 0;
    halves.forEach(h => h.snow.visible = true);
  }
  addEventListener('roof:set', e => { const d = e.detail; if (d.mat !== matKey) applyMat(d.mat); applyCol(d.col); if (d.weather !== weather) applyWeather(d.weather); wake(); });
  const st = window.roofState || {mat: 'sauma', col: '#1f2124', weather: 'sun'};
  applyMat(st.mat); applyCol(st.col); applyWeather(st.weather); swap.t = 1;

  /* ---------- orbit ---------- */
  let az = .78, pol = 1.12, rad = 25, tAz = az, tPol = pol, tRad = rad, dragging = false, lastX = 0, lastY = 0, idle = 0, touched = false;
  const setCam = () => { camera.position.set(target.x + rad * Math.sin(pol) * Math.sin(az), target.y + rad * Math.cos(pol), target.z + rad * Math.sin(pol) * Math.cos(az)); camera.lookAt(target); };
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; idle = 0; if (e.pointerType !== 'touch') canvas.setPointerCapture(e.pointerId); hideHint(); wake(); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    tAz -= dx * .008; if (e.pointerType !== 'touch') tPol = Math.min(1.42, Math.max(.62, tPol - dy * .006)); idle = 0; wake();
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);
  canvas.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); tRad = Math.min(32, Math.max(15, tRad + e.deltaY * .02)); wake(); }, {passive: false});
  canvas.addEventListener('keydown', e => {
    const k = e.key; if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(k)) return; e.preventDefault(); hideHint(); idle = 0;
    if (k === 'ArrowLeft') tAz -= .25; if (k === 'ArrowRight') tAz += .25;
    if (k === 'ArrowUp') tPol = Math.max(.62, tPol - .12); if (k === 'ArrowDown') tPol = Math.min(1.42, tPol + .12);
    if (k === '+') tRad = Math.max(15, tRad - 2.5); if (k === '-') tRad = Math.min(32, tRad + 2.5); wake();
  });
  stage.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => { tRad = Math.min(32, Math.max(15, tRad + (+b.dataset.zoom) * 3)); idle = 0; wake(); }));
  function hideHint() { if (!touched) { touched = true; hint.classList.add('off'); } }

  /* ---------- size & loop ---------- */
  function size() { const r = stage.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.fov = camera.aspect < 1 ? 46 : 34; camera.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(stage); size();
  let visible = false, running = false, prev = 0, sleepAt = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }, {threshold: .05}).observe(stage);
  function wake() { if (visible && !running) { running = true; prev = 0; requestAnimationFrame(frame); } sleepAt = performance.now() + 4000; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });

  const tmpC = new THREE.Color();
  function frame(t) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min((t - (prev || t)) / 1000, .05); prev = t;
    const k = 1 - Math.pow(.002, dt);
    // auto-rotate
    idle += dt; if (!dragging && idle > 3 && !reduce.matches) tAz += dt * .12;
    az += (tAz - az) * k * 1.2; pol += (tPol - pol) * k; rad += (tRad - rad) * k; setCam();
    // weather blend
    const wk = 1 - Math.pow(.03, dt);
    cur.top.lerp(tmpC.set(want.bg[0]), wk); cur.bot.lerp(tmpC.set(want.bg[1]), wk); cur.fog.lerp(tmpC.set(want.fog), wk); scene.fog.color.copy(cur.fog); paintBg();
    cur.sunI += (want.sunI - cur.sunI) * wk; sun.intensity = cur.sunI; sun.color.lerp(tmpC.set(want.sunC), wk);
    cur.hemiI += (want.hemiI - cur.hemiI) * wk; hemi.intensity = cur.hemiI;
    renderer.toneMappingExposure += (want.exp - renderer.toneMappingExposure) * wk;
    cur.rough += (want.rough - cur.rough) * wk; roofMat.roughness = Math.min(1, Math.max(.08, baseRough + cur.rough * (matKey === 'kermi' || matKey === 'tiili' ? 1.4 : 1)));
    cur.snowAmt += (snowTarget - cur.snowAmt) * (1 - Math.pow(.25, dt));
    halves.forEach(h => { h.snow.material.opacity = cur.snowAmt * .92; h.snow.visible = cur.snowAmt > .01; });
    groundMat.color.setRGB(1 + cur.snowAmt * 2.2, 1 + cur.snowAmt * 2.2, 1 + cur.snowAmt * 2.4);
    leafMat.color.setHex(0x6f7f3c).lerp(tmpC.set(0xdfe6ea), cur.snowAmt * .7);
    glass.emissiveIntensity = weather === 'sun' ? 0 : .55 * (1 - Math.abs(cur.sunI - .55) / 2.2) + .25;
    // particles
    if (rain.visible) { const a = rainGeo.attributes.position.array; for (let i = 0; i < N; i++) { const o = i * 6, d = rs[i] * dt; a[o + 1] -= d; a[o + 4] -= d; a[o] -= d * .08; a[o + 3] -= d * .08; if (a[o + 1] < 0) { const x = (Math.random() - .5) * area, z = (Math.random() - .5) * area, y = top; a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = x - .06; a[o + 4] = y + .7; a[o + 5] = z; } } rainGeo.attributes.position.needsUpdate = true; }
    if (snowPts.visible) { const a = snowGeo.attributes.position.array; for (let i = 0; i < N; i++) { const o = i * 3; sph[i] += dt; a[o + 1] -= dt * (1.1 + (i % 7) * .12); a[o] += Math.sin(sph[i]) * dt * .4; a[o + 2] += Math.cos(sph[i] * .7) * dt * .3; if (a[o + 1] < 0) { a[o] = (Math.random() - .5) * area; a[o + 1] = top; a[o + 2] = (Math.random() - .5) * area; } } snowGeo.attributes.position.needsUpdate = true; }
    // material drop-in
    if (swap.t < 1) { swap.t = Math.min(1, swap.t + dt * 2.2); const e = 1 - Math.pow(1 - swap.t, 3); halves.forEach(h => { h.surf.position.y = (1 - e) * 1.4; h.seams.position.y = (1 - e) * 1.4; }); }
    // gentle tree sway
    trees.forEach((tr, i) => tr.rotation.z = Math.sin(t / 1000 * (weather === 'rain' ? 1.6 : .8) + i) * (weather === 'rain' ? .03 : .012));
    renderer.render(scene, camera);
    const moving = dragging || Math.abs(tAz - az) > .001 || Math.abs(tRad - rad) > .01 || weather !== 'sun' || swap.t < 1 || (idle > 3 && !reduce.matches) || performance.now() < sleepAt;
    if (moving) requestAnimationFrame(frame); else running = false;
  }
  setCam(); renderer.render(scene, camera);
  window.__roofReady = true;
}
