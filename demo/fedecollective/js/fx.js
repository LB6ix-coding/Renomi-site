// FedeCollective motion layer: 3D barber pole (spins with scroll speed) + micro-motion.
// Everything is progressive: without JS or WebGL the page is complete and readable.
import * as THREE from './three.module.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* ---------- scroll velocity (shared) ---------- */
let lastY = scrollY, vel = 0;
addEventListener('scroll', () => { const y = scrollY; vel += (y - lastY); lastY = y; }, { passive: true });

/* ---------- 3D barber pole ---------- */
function pole() {
  const host = document.getElementById('pole');
  if (!host) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.remove(); return; }
  const W = 64, H = 230;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(22, W / H, 0.1, 100);
  cam.position.set(0, 0, 15);

  // stripes texture: red / white / thin black, diagonal
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 256, 256);
  g.save(); g.translate(128, 128); g.rotate(-Math.PI / 4.2); g.translate(-256, -256);
  for (let x = -512; x < 1024; x += 128) {
    g.fillStyle = '#d42a22'; g.fillRect(x, 0, 52, 512);
    g.fillStyle = '#111'; g.fillRect(x + 52, 0, 8, 512);
  }
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2.2);
  tex.anisotropy = 4;

  const grp = new THREE.Group(); scene.add(grp);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 4.2, 48, 1, true),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0 }));
  grp.add(stripe);

  // glass tube with a hard specular streak
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4.3, 48, 1, true),
    new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, shininess: 140, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false }));
  grp.add(glass);

  // chrome caps
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: 0.22 });
  const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.32, 48), chrome); capT.position.y = 2.3;
  const domeT = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), chrome); domeT.position.y = 2.46;
  const capB = capT.clone(); capB.position.y = -2.3;
  const domeB = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), chrome); domeB.position.y = -2.46;
  grp.add(capT, domeT, capB, domeB);

  // simple studio environment so chrome reads as chrome
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(10, 32, 16);
  const ec = document.createElement('canvas'); ec.width = 16; ec.height = 256;
  const eg = ec.getContext('2d'); const grd = eg.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.45, '#7a7a7a'); grd.addColorStop(0.5, '#151515'); grd.addColorStop(1, '#2a2a2a');
  eg.fillStyle = grd; eg.fillRect(0, 0, 16, 256);
  const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.SRGBColorSpace;
  envScene.add(new THREE.Mesh(envGeo, new THREE.MeshBasicMaterial({ map: et, side: THREE.BackSide })));
  scene.environment = pm.fromScene(envScene, 0.02).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6a5a, 0.6); rim.position.set(-4, -1, -2); scene.add(rim);

  grp.rotation.z = 0.0;
  let spin = 0, hover = 0, visible = true, running = false;
  host.addEventListener('pointerenter', () => hover = 1);
  host.addEventListener('pointerleave', () => hover = 0);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) loop(); });

  function frame() {
    const v = Math.max(-80, Math.min(80, vel)); vel *= 0.86;
    const target = (reduce ? 0 : 0.0025) + Math.abs(v) * 0.0011 + hover * 0.01;
    spin += (target - spin) * 0.12;
    tex.offset.y -= spin * (v < -0.5 ? -1 : 1);
    grp.rotation.y += spin * 0.6;
    renderer.render(scene, cam);
  }
  function loop() { if (running) return; running = true; (function t() { if (!visible) { running = false; return; } frame(); requestAnimationFrame(t); })(); }
  if (reduce) { frame(); } else { loop(); }
}

/* ---------- headline reveal: letters rise into place ---------- */
function reveal() {
  if (reduce || !('IntersectionObserver' in window)) return;
  const heads = document.querySelectorAll('main h2');
  heads.forEach(h => {
    const html = h.innerHTML;
    // split text nodes into letter spans, keep <br> and child elements
    const walk = (node) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(word => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'rw';
            [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'rl'; s.textContent = ch; w.appendChild(s); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h);
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    h.querySelectorAll('.rl').forEach((s, i) => { s.style.transitionDelay = (i * 22) + 'ms'; s.setAttribute('aria-hidden', 'true'); });
    h.classList.add('rv');
    h.dataset.src = html;
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  heads.forEach(h => io.observe(h));
  // safety: anything already on screen shows immediately
  requestAnimationFrame(() => heads.forEach(h => { if (h.getBoundingClientRect().top < innerHeight) h.classList.add('in'); }));
}

/* ---------- hero lines slide in on load ---------- */
function heroIn() {
  if (reduce) return;
  document.querySelectorAll('.hero h1 span').forEach((s, i) => { s.classList.add('hin'); });
}

/* ---------- magnetic buttons (mouse only) ---------- */
function magnetic() {
  if (!fine || reduce) return;
  document.querySelectorAll('.btn-red, .hero .btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
      b.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}


/* ---------- liquid hero: the real shop video ripples around the cursor / finger ---------- */
function liquid() {
  const hero = document.querySelector('.hero'), video = hero && hero.querySelector('video');
  if (!video || reduce) return;
  const cv = document.createElement('canvas'); cv.className = 'liquid'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (!gl) return;
  // trail: a small 2D canvas where the pointer paints soft blobs that fade out
  const TW = 128, TH = 72, trail = document.createElement('canvas'); trail.width = TW; trail.height = TH;
  const tg = trail.getContext('2d'); tg.fillStyle = '#808080'; tg.fillRect(0, 0, TW, TH);
  const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0,1);}';
  const fs = `precision mediump float;varying vec2 uv;uniform sampler2D v,t;uniform vec2 tx,cover;uniform float k;
    vec2 cv(vec2 u){return (u-.5)*cover+.5;}
    void main(){
      float a=texture2D(t,uv+vec2(tx.x,0.)).r-texture2D(t,uv-vec2(tx.x,0.)).r;
      float b=texture2D(t,uv+vec2(0.,tx.y)).r-texture2D(t,uv-vec2(0.,tx.y)).r;
      vec2 d=vec2(a,b)*k;
      float r=texture2D(v,cv(uv+d*1.15)).r, g=texture2D(v,cv(uv+d)).g, bl=texture2D(v,cv(uv+d*.85)).b;
      gl_FragColor=vec4(r,g,bl,1.);
    }`;
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const mk = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(w => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); return t; };
  const tv = mk(0), tt = mk(1);
  gl.uniform1i(gl.getUniformLocation(pr, 'v'), 0); gl.uniform1i(gl.getUniformLocation(pr, 't'), 1);
  gl.uniform2f(gl.getUniformLocation(pr, 'tx'), 1.5 / TW, 1.5 / TH);
  const uk = gl.getUniformLocation(pr, 'k'), uc = gl.getUniformLocation(pr, 'cover');
  let ok = false, strength = 0;
  function size() {
    const w = hero.clientWidth, h = hero.clientHeight, dpr = Math.min(devicePixelRatio, 1.5);
    cv.width = w * dpr; cv.height = h * dpr; gl.viewport(0, 0, cv.width, cv.height);
    const va = (video.videoWidth || 16) / (video.videoHeight || 9), ca = w / h;
    gl.uniform2f(uc, ca < va ? ca / va : 1, ca < va ? 1 : va / ca); // object-fit: cover
  }
  let px = -1, py = -1;
  const move = (x, y) => { const r = hero.getBoundingClientRect(); px = (x - r.left) / r.width; py = (y - r.top) / r.height; strength = 1; };
  hero.addEventListener('pointermove', e => move(e.clientX, e.clientY), { passive: true });
  hero.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
  function paint() {
    tg.fillStyle = 'rgba(128,128,128,.08)'; tg.fillRect(0, 0, TW, TH); // fade back to neutral
    if (px >= 0) {
      const x = px * TW, y = py * TH, rad = 11, gr = tg.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      tg.fillStyle = gr; tg.beginPath(); tg.arc(x, y, rad, 0, 6.283); tg.fill();
    }
  }
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(hero);
  let running = false;
  function loop() { if (running) return; running = true; (function f() {
    if (!visible || document.hidden) { running = false; return; }
    if (video.readyState >= 2) {
      try {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tv);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      } catch (e) { cv.remove(); running = false; return; } // cross-origin video: keep the plain video
      if (!ok) { ok = true; size(); video.after(cv); hero.classList.add('has-liquid'); }
      paint(); strength *= 0.985;
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tt);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, trail);
      gl.uniform1f(uk, 0.09);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(f);
  })(); }
  addEventListener('resize', () => ok && size());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
  loop();
}

pole(); reveal(); heroIn(); magnetic(); liquid();
