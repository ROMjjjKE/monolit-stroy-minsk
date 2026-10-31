/* 3D-сцена стройки: дом собирается по скроллу, камера облетает.
   Three.js (ESM), без внешних ассетов — только геометрия и процедурные материалы. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('scene3d');
if (canvas) init();

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isMobile, alpha: false, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0d0b);
  scene.fog = new THREE.Fog(0x0e0d0b, 55, 135);

  const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 400);
  camera.position.set(-26, 20, 26);

  // окружение для отражений на стекле и металле
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------- свет ---------- */
  const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x2a2620, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe7c9, 2.3);
  sun.position.set(26, 34, 14);
  sun.castShadow = !isMobile;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 110;
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x9fb6d4, 0.5);
  fill.position.set(-18, 12, -20);
  scene.add(fill);

  /* ---------- материалы ---------- */
  const M = {
    ground: new THREE.MeshStandardMaterial({ color: 0x28241e, roughness: 1, metalness: 0 }),
    dirt: new THREE.MeshStandardMaterial({ color: 0x33291f, roughness: 1 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x9e988d, roughness: 0.86, metalness: 0.02 }),
    concreteDark: new THREE.MeshStandardMaterial({ color: 0x6e685f, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6d4a2e, roughness: 0.66, metalness: 0.03 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x14202a, roughness: 0.12, metalness: 0.35, envMapIntensity: 1.5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.42, metalness: 0.75 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d8b86, roughness: 0.55, metalness: 0.6 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x26301f, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x2f2620, roughness: 1 }),
    grass: new THREE.MeshStandardMaterial({ color: 0x3b4432, roughness: 1 })
  };

  const items = [];   // { mesh, from, to, mode }

  function box(w, h, d, mat, x, y, z, opts = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);            // растим от основания
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    m.castShadow = opts.shadow !== false;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  /* ---------- площадка ---------- */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 64), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // котлован
  const pit = box(18, 1.6, 13.6, M.dirt, 0, -1.6, 0);
  items.push({ mesh: pit, from: 0.02, to: 0.12, mode: 'rise' });

  /* ---------- дом ---------- */
  const W = 15, D = 10.4;
  const parts = [];
  const add = (mesh, from, to, mode = 'rise') => { items.push({ mesh, from, to, mode }); };

  // плита
  add(box(W + 1.2, 0.55, D + 1.2, M.concrete, 0, 0, 0), 0.10, 0.20);
  // стены 1 этажа (4 полосы, чтобы читался объём)
  const h1 = 3.1;
  add(box(W, h1, 0.4, M.concrete, 0, 0.55, D / 2), 0.18, 0.30);
  add(box(W, h1, 0.4, M.concrete, 0, 0.55, -D / 2), 0.19, 0.31);
  add(box(0.4, h1, D, M.concrete, W / 2, 0.55, 0), 0.20, 0.32);
  add(box(0.4, h1, D, M.concrete, -W / 2, 0.55, 0), 0.21, 0.33);
  // перекрытие
  add(box(W + 0.5, 0.35, D + 0.5, M.concreteDark, 0, 0.55 + h1, 0), 0.32, 0.42);
  // стены 2 этажа
  const h2 = 2.7;
  add(box(W - 0.4, h2, 0.4, M.concrete, 0, 0.9 + h1, D / 2 - 0.2), 0.40, 0.50);
  add(box(W - 0.4, h2, 0.4, M.concrete, 0, 0.9 + h1, -D / 2 + 0.2), 0.41, 0.51);
  add(box(0.4, h2, D - 0.4, M.concrete, W / 2 - 0.2, 0.9 + h1, 0), 0.42, 0.52);
  add(box(0.4, h2, D - 0.4, M.concrete, -W / 2 + 0.2, 0.9 + h1, 0), 0.43, 0.53);
  // кровля + парапет
  add(box(W - 0.1, 0.3, D - 0.1, M.concreteDark, 0, 0.9 + h1 + h2, 0), 0.52, 0.60);
  add(box(W - 0.1, 0.25, 0.2, M.steel, 0, 1.2 + h1 + h2, D / 2 - 0.2), 0.58, 0.64);
  add(box(W - 0.1, 0.25, 0.2, M.steel, 0, 1.2 + h1 + h2, -D / 2 + 0.2), 0.58, 0.64);

  // окна 1 этажа
  const winY1 = 1.35, winY2 = 4.6;
  [-4.6, 0, 4.6].forEach((x, i) => {
    add(box(3.2, 1.9, 0.18, M.glass, x, winY1, D / 2 + 0.11, { shadow: false }), 0.60 + i * 0.02, 0.68 + i * 0.02, 'pop');
  });
  // окна 2 этажа
  [-3.8, 2.2].forEach((x, i) => {
    add(box(4.4, 1.6, 0.18, M.glass, x, winY2, D / 2 - 0.09, { shadow: false }), 0.64 + i * 0.02, 0.72 + i * 0.02, 'pop');
  });
  // боковое остекление
  add(box(0.18, 2.0, 4.6, M.glass, W / 2 - 0.09, 3.0, -1.2, { shadow: false }), 0.66, 0.74, 'pop');

  // деревянный фасад (правый объём)
  for (let i = 0; i < 9; i++) {
    add(box(0.72, h1 + h2 - 0.2, 0.12, M.wood, -W / 2 + 1.3 + i * 0.78, 0.6, D / 2 + 0.24),
      0.72 + i * 0.008, 0.82 + i * 0.008);
  }

  // входная группа
  add(box(1.5, 2.3, 0.2, M.wood, 5.6, 0.55, D / 2 + 0.2), 0.80, 0.86, 'pop');
  add(box(3.2, 0.14, 1.8, M.concrete, 5.6, 0.55, D / 2 + 1.1), 0.82, 0.88);

  // травa и дорожка в финале
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(46, 40), M.grass);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, -1.55, 0);
  lawn.receiveShadow = true;
  lawn.visible = false;
  scene.add(lawn);
  items.push({ mesh: lawn, from: 0.84, to: 1.0, mode: 'fade' });

  const path = box(5.2, 0.06, 14, M.concrete, 4.2, -1.55, D / 2 + 7);
  items.push({ mesh: path, from: 0.86, to: 1.0, mode: 'fade' });

  /* ---------- башенный кран и леса ---------- */
  const crane = new THREE.Group();
  const mast = box(0.6, 22, 0.6, M.metal, 0, 0, 0);
  const jib = box(16, 0.45, 0.45, M.metal, 7, 22, 0);
  const counter = box(4.5, 0.5, 0.5, M.steel, -3.4, 22, 0);
  const cab = box(1.6, 1.4, 1.6, M.metal, 0.9, 20.4, 0);
  const hook = box(0.16, 7, 0.16, M.steel, 11.5, 15, 0);
  crane.add(mast, jib, counter, cab, hook);
  crane.position.set(-16, 0, -6);
  scene.add(crane);
  items.push({ mesh: crane, from: 0.06, to: 0.16, mode: 'fade' });
  items.push({ mesh: crane, from: 0.76, to: 0.86, mode: 'fadeOut' });

  const scaff = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    scaff.add(box(0.1, 7.4, 0.1, M.steel, -3 + i * 2.4, 0, 0));
  }
  for (let lvl = 0; lvl < 3; lvl++) {
    scaff.add(box(7.4, 0.1, 0.1, M.steel, 0.5, 2.4 + lvl * 2.4, 0));
  }
  scaff.position.set(0, 0, D / 2 + 1.4);
  scene.add(scaff);
  items.push({ mesh: scaff, from: 0.20, to: 0.30, mode: 'fade' });
  items.push({ mesh: scaff, from: 0.66, to: 0.76, mode: 'fadeOut' });

  /* ---------- лес вокруг ---------- */
  const trees = new THREE.Group();
  const rand = (s) => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rand(i) * 0.4;
    const r = 34 + rand(i + 7) * 18;
    const h = 6 + rand(i + 3) * 6;
    const t = new THREE.Group();
    t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, h * 0.35, 6), M.trunk));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(h * 0.26, h, 7), M.tree);
    cone.position.y = h * 0.55;
    cone.castShadow = true;
    t.add(cone);
    t.position.set(Math.cos(a) * r, -0.1, Math.sin(a) * r);
    trees.add(t);
  }
  scene.add(trees);
  items.push({ mesh: trees, from: 0, to: 0.05, mode: 'fade' });

  /* ---------- режимы анимации сборки ---------- */
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function applyProgress(p) {
    for (const it of items) {
      const m = it.mesh;
      const local = clamp01((p - it.from) / Math.max(0.0001, it.to - it.from));

      if (it.mode === 'rise') {
        const e = easeOut(local);
        m.visible = local > 0.001;
        m.scale.y = Math.max(0.001, e);
      } else if (it.mode === 'pop') {
        const e = 0.001 + easeOut(local) * 0.999;
        m.visible = local > 0.001;
        m.scale.set(e, e, e);
      } else if (it.mode === 'fade') {
        // появляется
        const e = easeOut(local);
        m.visible = local > 0.001;
        m.scale.setScalar(Math.max(0.001, e));
      } else if (it.mode === 'fadeOut') {
        const e = 1 - easeOut(local);
        m.visible = local < 0.999;
        m.scale.setScalar(Math.max(0.001, e));
      }
    }

    // камера: медленный облёт + подъём в начале
    const a = -1.05 + p * 2.15;
    const r = 36 - p * 15 - Math.sin(p * Math.PI) * 3;
    const y = 22 - p * 11 + Math.sin(p * Math.PI) * 5.5;
    camera.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    camera.lookAt(0, 3.4, 0);
    renderer.render(scene, camera);
  }

  /* ---------- resize ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    applyProgress(lastProgress);
  }
  window.addEventListener('resize', resize);

  let lastProgress = 0;
  applyProgress(0);

  /* ---------- связь со скроллом ---------- */
  const stage = document.getElementById('stage');
  if (window.gsap && window.ScrollTrigger && !reduce && window.matchMedia('(min-width: 721px)').matches) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: '+=260%',
      pin: '.stage__pin',
      scrub: 0.7,
      onUpdate: (self) => {
        lastProgress = self.progress;
        applyProgress(lastProgress);
        if (window.__onSceneProgress) window.__onSceneProgress(lastProgress);
      }
    });
  } else {
    // фолбэк: прогресс от положения секции
    const onScroll = () => {
      const rect = stage.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.2;
      lastProgress = clamp01((0 - rect.top) / (total || 1));
      applyProgress(lastProgress);
      if (window.__onSceneProgress) window.__onSceneProgress(lastProgress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  window.__sceneStats = function () {
    const vis = items.filter(i => i.mesh.visible);
    const scales = vis.map(i => +(i.mesh.scale.y).toFixed(2));
    return {
      total: items.length,
      visible: vis.length,
      camY: +camera.position.y.toFixed(1),
      camDist: +Math.round(Math.hypot(camera.position.x, camera.position.z)),
      minScale: Math.min.apply(null, scales),
      maxScale: Math.max.apply(null, scales)
    };
  };

  window.__sceneReady = true;
  document.documentElement.classList.add('scene-ready');
}
