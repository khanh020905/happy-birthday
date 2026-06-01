import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';

export default function BirthdayScene({ started, onFinale }) {
  const [errorMsg, setErrorMsg] = React.useState('');

  useEffect(() => {
    const handleErr = (msg, url, line) => {
      setErrorMsg(prev => prev + `\n${msg} at ${line}`);
    };
    window.addEventListener('error', handleErr);
    return () => window.removeEventListener('error', handleErr);
  }, []);

  const mountRef = useRef(null);
  const initialized = useRef(false);
  const onFinaleRef = useRef(onFinale);
  useEffect(() => { onFinaleRef.current = onFinale; }, [onFinale]);

  const sceneRefs = useRef({
    cakeGroup: null,
    layer1: null,
    layer2: null,
    layer3: null,
    candles: [],
    orbitLight: null,
    confettiData: [],
    confettiMeshes: [],
    confettiParams: { spawnRateMultiplier: 1 },
    stars: null,
    camera: null,
    controls: null,
    mouse: new THREE.Vector2(),
    blownCandles: 0,
    composer: null,
    fireworksData: [],
    textLetters: [],
    textGroup: null,
    ribbons: []
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    sceneRefs.current.confettiData = [];
    sceneRefs.current.confettiMeshes = [];
    sceneRefs.current.candles = [];
    sceneRefs.current.blownCandles = 0;
    sceneRefs.current.fireworksData = [];

    // --- 1. SETUP ---
    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 6, 5);
    camera.lookAt(0, 0, 0);
    sceneRefs.current.camera = camera;
    sceneRefs.current.cameraTarget = { x: 0, y: 0, z: 0 };

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    // Increased threshold from 0.2 to 0.85 so white cake layers don't bloom, only highly emissive objects
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.4, 0.85);
    composer.addPass(bloomPass);
    sceneRefs.current.composer = composer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 8;
    controls.maxDistance = 28;
    controls.minPolarAngle = THREE.MathUtils.degToRad(50);
    controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
    controls.enabled = false;
    sceneRefs.current.controls = controls;

    // --- 2. LIGHTING ---
    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x221133, 0.5);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffccee, 0.5);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xaaddff, 0.3);
    rimLight.position.set(0, 2, -6);
    scene.add(rimLight);

    const orbitLight = new THREE.PointLight(0xff88cc, 0.8, 10);
    scene.add(orbitLight);
    sceneRefs.current.orbitLight = orbitLight;

    // --- 3. TEXTURES ---
    const textureLoader = new THREE.TextureLoader();
    const tPhoto = textureLoader.load('/assets/iamge-1.jpg');

    const cakeBottom = textureLoader.load('/assets/textures/cake-bottom.png');
    const cakeMiddle = textureLoader.load('/assets/textures/cake-middle.png');
    const cakeTop = textureLoader.load('/assets/textures/cake-top.png');
    const frosting = textureLoader.load('/assets/textures/frosting.png');

    [cakeBottom, cakeMiddle, cakeTop].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1);
    });

    // --- 4. CAKE GEOMETRY ---
    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = 0; // Fix group at 0, layers animate individually
    scene.add(cakeGroup);
    sceneRefs.current.cakeGroup = cakeGroup;

    const plateGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.12, 64);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xe8d5b0, roughness: 0.3, metalness: 0.6 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -8;
    plate.receiveShadow = true;
    plate.castShadow = true;
    cakeGroup.add(plate);
    sceneRefs.current.plate = plate;

    const plateRimGeo = new THREE.TorusGeometry(2.2, 0.045, 8, 64);
    const plateRimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.15, metalness: 0.95 });
    const plateRim = new THREE.Mesh(plateRimGeo, plateRimMat);
    plateRim.rotation.x = Math.PI / 2;
    plate.add(plateRim);

    const createLayer = (radius, height, color, sideMap = null, topMap = null) => {
      const geo = new THREE.CylinderGeometry(radius, radius, height, 64);
      const mats = [
        new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, ...(sideMap && { map: sideMap }) }),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, ...(topMap && { map: topMap }) }),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
      ];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.y = -8; // at start — animation handles the reveal
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      return mesh;
    };

    const layer1 = createLayer(1.8, 1.1, 0x4a2e1b, cakeBottom);
    cakeGroup.add(layer1);
    sceneRefs.current.layer1 = layer1;

    const layer2 = createLayer(1.35, 0.95, 0xffaacc, cakeMiddle, frosting);
    cakeGroup.add(layer2);
    sceneRefs.current.layer2 = layer2;

    const dripGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.14, 8);
    const dripMat = new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.4 });
    const addDrips = (layer, radius, height) => {
      for(let i=0; i<8; i++){
        const angle = (i / 8) * Math.PI * 2;
        const drip = new THREE.Mesh(dripGeo, dripMat);
        drip.position.set(Math.cos(angle) * radius, -(height / 2) - 0.07, Math.sin(angle) * radius);
        layer.add(drip);
      }
    };
    addDrips(layer1, 1.8, 1.1);
    addDrips(layer2, 1.35, 0.95);

    const pearlGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xf9c6d0, roughness: 0.2, metalness: 0.1 });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      pearl.position.set(Math.cos(angle) * 1.3, 0.95/2, Math.sin(angle) * 1.3);
      layer2.add(pearl);
    }

    const layer3 = createLayer(0.9, 0.8, 0xfffdd0, cakeTop);
    cakeGroup.add(layer3);
    sceneRefs.current.layer3 = layer3;

    const glowDiscGeo = new THREE.CircleGeometry(3, 64);
    const glowDiscMat = new THREE.MeshBasicMaterial({
      color: 0xff88cc, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
    });
    const glowDisc = new THREE.Mesh(glowDiscGeo, glowDiscMat);
    glowDisc.rotation.x = -Math.PI / 2;
    glowDisc.position.y = 0.02;
    cakeGroup.add(glowDisc);

    const frameGroup = new THREE.Group();
    frameGroup.position.y = 0.8/2 + 0.02;
    frameGroup.rotation.x = -Math.PI / 2;
    layer3.add(frameGroup);

    const photoGeo = new THREE.CircleGeometry(0.7, 64);
    const photoMat = new THREE.MeshBasicMaterial({ map: tPhoto });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    frameGroup.add(photo);

    const ringGeo = new THREE.TorusGeometry(0.7, 0.04, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.1, metalness: 0.9 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    frameGroup.add(ring);

    const photoLight = new THREE.PointLight(0xffddaa, 0.6, 3);
    photoLight.position.set(0, 1.5, 0);
    layer3.add(photoLight);

    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32,32,0, 32,32,32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(c);

    const candleColors = [0xff6b9d, 0xc9b1ff, 0xffda63, 0xff6b9d, 0xc9b1ff];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const cGroup = new THREE.Group();
      cGroup.position.set(Math.cos(angle) * 0.5, 0.8/2 + 0.19, Math.sin(angle) * 0.5);

      const bodyGeo = new THREE.CylinderGeometry(0.035, 0.048, 0.38, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: candleColors[i], roughness: 0.85 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      cGroup.add(body);

      const flameGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
      const flameMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 1.2
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.19 + 0.09;
      cGroup.add(flame);

      const light = new THREE.PointLight(0xffaa44, 0, 1.5);
      light.position.y = 0.19 + 0.09;
      cGroup.add(light);

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: 0xffaa44,
        transparent: true, blending: THREE.AdditiveBlending, opacity: 0
      }));
      glow.scale.set(0.4, 0.4, 1);
      glow.position.y = flame.position.y;
      cGroup.add(glow);

      layer3.add(cGroup);

      const hitboxGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.position.y = 0.2;
      hitbox.userData = { isCandle: true, index: i };
      cGroup.add(hitbox);

      const sparkleGeo = new THREE.SphereGeometry(0.015, 4, 4);
      const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending });
      const sparkles = [];
      for (let j = 0; j < 15; j++) {
        const mesh = new THREE.Mesh(sparkleGeo, sparkleMat);
        mesh.visible = false;
        cGroup.add(mesh);
        sparkles.push({ mesh, active: false, life: 0, vx: 0, vy: 0, vz: 0 });
      }

      sceneRefs.current.candles.push({ group: cGroup, flame, light, glow, hitbox, active: true, baseIntensity: 0, sparkles });
    }

    // --- 5. PARTICLES ---
    // InstancedMesh confetti: 5 draw calls instead of 120-200
    const numConfetti = window.innerWidth < 768 ? 50 : 120;
    const confettiColorHex = [0xff6b9d, 0xffda63, 0xc9b1ff, 0x63d8ff, 0xff9f68];
    const confettiGeo = new THREE.PlaneGeometry(0.09, 0.15);
    const dummy = new THREE.Object3D();
    const perColor = Math.ceil(numConfetti / confettiColorHex.length);

    confettiColorHex.forEach(color => {
      const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const iMesh = new THREE.InstancedMesh(confettiGeo, mat, perColor);
      iMesh.frustumCulled = false;
      scene.add(iMesh);
      sceneRefs.current.confettiMeshes.push(iMesh);

      for (let i = 0; i < perColor; i++) {
        const data = {
          mesh: iMesh, index: i,
          x: (Math.random() - 0.5) * 14,
          y: 8 + Math.random() * 6,
          z: (Math.random() - 0.5) * 5,
          rx: Math.random() * Math.PI * 2,
          ry: Math.random() * Math.PI * 2,
          rz: Math.random() * Math.PI * 2,
          speed: 0.018 + Math.random() * 0.035,
          driftX: (Math.random() - 0.5) * 0.015,
          driftZ: (Math.random() - 0.5) * 0.015,
          rotX: (Math.random() - 0.5) * 0.08,
          rotY: (Math.random() - 0.5) * 0.08,
          rotZ: (Math.random() - 0.5) * 0.08,
        };
        sceneRefs.current.confettiData.push(data);

        dummy.position.set(data.x, data.y, data.z);
        dummy.rotation.set(data.rx, data.ry, data.rz);
        dummy.updateMatrix();
        iMesh.setMatrixAt(i, dummy.matrix);
      }
      iMesh.instanceMatrix.needsUpdate = true;
    });

    // Star field
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 300;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 30;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);
    sceneRefs.current.stars = stars;

    // --- 3D TEXT ---
    const textGroup = new THREE.Group();
    textGroup.position.set(0, 10, 0); // start hidden/high
    scene.add(textGroup);
    sceneRefs.current.textGroup = textGroup;

    const fontLoader = new FontLoader();
    fontLoader.load('/assets/helvetiker_regular.typeface.json', (font) => {
      const textMat = new THREE.MeshStandardMaterial({ 
        color: 0xd4af37, metalness: 0.9, roughness: 0.1, 
        emissive: 0xffaa00, emissiveIntensity: 0.3 
      });
      
      const letters = 'Thanh Nhan'.split('');
      let xOffset = 0;
      letters.forEach((letter) => {
        if (letter === ' ') {
          xOffset += 0.3;
          return;
        }
        const lGeo = new TextGeometry(letter, {
          font: font, size: 0.7, depth: 0.08, curveSegments: 4,
          bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelSegments: 2
        });
        lGeo.computeBoundingBox();
        const lWidth = lGeo.boundingBox.max.x - lGeo.boundingBox.min.x;
        
        const lMesh = new THREE.Mesh(lGeo, textMat);
        lMesh.position.set(xOffset, 10, 0); // hidden
        lMesh.castShadow = true;
        textGroup.add(lMesh);
        sceneRefs.current.textLetters.push(lMesh);
        
        xOffset += lWidth + 0.05;
      });
      
      textGroup.position.x = -xOffset / 2; // center it
    });

    // --- RIBBON STREAMERS ---
    const ribbonColors = [0xff6b9d, 0xffda63, 0xc9b1ff, 0x63d8ff, 0xff9f68, 0xff6b9d];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 6 + Math.random() * 2;
      const points = [];
      for (let j = 0; j < 8; j++) {
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius + (Math.random() - 0.5),
          8 - j * 2 + (Math.random() - 0.5),
          Math.sin(angle) * radius + (Math.random() - 0.5)
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const rGeo = new THREE.TubeGeometry(curve, 30, 0.03, 4, false);
      const rMat = new THREE.MeshStandardMaterial({ color: ribbonColors[i], roughness: 0.4, side: THREE.DoubleSide });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.castShadow = true;
      scene.add(rMesh);
      sceneRefs.current.ribbons.push({ mesh: rMesh, basePoints: points, offset: Math.random() * 10 });
    }

    // --- 6. RAYCASTER & EVENTS ---
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (e) => {
      sceneRefs.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneRefs.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove);

    const onClick = (e) => {
      if (sceneRefs.current.blownCandles >= 5) return;

      raycaster.setFromCamera(sceneRefs.current.mouse, camera);
      const hitboxes = sceneRefs.current.candles.map(c => c.hitbox);
      const intersects = raycaster.intersectObjects(hitboxes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const candleData = sceneRefs.current.candles[hit.userData.index];
        if (candleData.active) {
          candleData.active = false;
          sceneRefs.current.blownCandles++;

          gsap.to(candleData.flame.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3 });
          gsap.to(candleData.light, { intensity: 0, duration: 0.3 });
          gsap.to(candleData.glow.material, { opacity: 0, duration: 0.3 });

          if (sceneRefs.current.blownCandles === 5 && onFinaleRef.current) {
            sceneRefs.current.confettiParams.spawnRateMultiplier = 2;
            setTimeout(() => {
              sceneRefs.current.confettiParams.spawnRateMultiplier = 1;
            }, 5000);
            
            // FIREWORKS FINALE
            const fwColors = [0xff6b9d, 0xffda63, 0xc9b1ff, 0x63d8ff, 0xff9f68];
            const fwGeo = new THREE.PlaneGeometry(0.08, 0.08);
            for (let i = 0; i < 5; i++) {
              setTimeout(() => {
                const fwMat = new THREE.MeshBasicMaterial({ color: fwColors[i], transparent: true, opacity: 1, side: THREE.DoubleSide });
                const iMesh = new THREE.InstancedMesh(fwGeo, fwMat, 40);
                iMesh.frustumCulled = false;
                scene.add(iMesh);
                
                const particles = [];
                for (let j = 0; j < 40; j++) {
                  const u = Math.random();
                  const v = Math.random();
                  const theta = u * 2.0 * Math.PI;
                  const phi = Math.acos(2.0 * v - 1.0);
                  const sinPhi = Math.sin(phi);
                  const vx = sinPhi * Math.cos(theta);
                  const vy = sinPhi * Math.sin(theta);
                  const vz = Math.cos(phi);
                  particles.push({
                    vx: vx * (0.05 + Math.random() * 0.1),
                    vy: vy * (0.05 + Math.random() * 0.1),
                    vz: vz * (0.05 + Math.random() * 0.1),
                    x: 0, y: 0, z: 0
                  });
                }
                
                const rocketProxy = { y: 1.5 };
                const rx = (Math.random() - 0.5) * 3;
                const rz = (Math.random() - 0.5) * 3;
                
                gsap.to(rocketProxy, {
                  y: 4.5 + Math.random() * 2,
                  duration: 0.8,
                  ease: 'power2.out',
                  onComplete() {
                    sceneRefs.current.fireworksData.push({
                      mesh: iMesh,
                      particles,
                      x: rx,
                      y: rocketProxy.y,
                      z: rz,
                      life: 1.5,
                      maxLife: 1.5
                    });
                  }
                });
              }, i * 300);
            }

            onFinaleRef.current();
          }
        }
      }
    };
    window.addEventListener('click', onClick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (sceneRefs.current.composer) {
        sceneRefs.current.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', onResize);

    // --- 7. ANIMATION LOOP ---
    const timer = new THREE.Timer();
    sceneRefs.current.timer = timer;
    let rafId;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      timer.update();
      const time = timer.getElapsed();

      if (sceneRefs.current.cakeGroup) {
        sceneRefs.current.cakeGroup.rotation.y += 0.003;
      }

      if (sceneRefs.current.orbitLight) {
        sceneRefs.current.orbitLight.position.x = Math.cos(time * 0.5) * 4;
        sceneRefs.current.orbitLight.position.z = Math.sin(time * 0.5) * 4;
        sceneRefs.current.orbitLight.position.y = 3;
      }

      // Confetti - InstancedMesh update (5 draw calls total)
      const multiplier = sceneRefs.current.confettiParams.spawnRateMultiplier;
      const cData = sceneRefs.current.confettiData;
      if (cData.length > 0) {
        const dirty = new Set();
        cData.forEach(c => {
          c.y -= c.speed * multiplier;
          c.x += c.driftX;
          c.z += c.driftZ;
          c.rx += c.rotX;
          c.ry += c.rotY;
          c.rz += c.rotZ;
          if (c.y < -4) {
            c.y = 8 + Math.random() * 3;
            c.x = (Math.random() - 0.5) * 14;
          }
          dummy.position.set(c.x, c.y, c.z);
          dummy.rotation.set(c.rx, c.ry, c.rz);
          dummy.updateMatrix();
          c.mesh.setMatrixAt(c.index, dummy.matrix);
          dirty.add(c.mesh);
        });
        dirty.forEach(m => { m.instanceMatrix.needsUpdate = true; });
      }

      sceneRefs.current.candles.forEach(c => {
        if (c.active) {
          const ratio = c.baseIntensity > 0 ? c.baseIntensity / 0.3 : 0;
          c.flame.scale.y = (0.85 + Math.random() * 0.3) * ratio;
          c.flame.scale.x = (0.9 + Math.random() * 0.2) * ratio;
          c.flame.scale.z = c.flame.scale.x;
          c.light.intensity = c.baseIntensity + (c.baseIntensity > 0 ? Math.random() * 0.2 * ratio : 0);
          c.glow.material.opacity = (0.4 + Math.random() * 0.35) * ratio;

          if (c.baseIntensity > 0.1) {
            const dead = c.sparkles.find(s => !s.active || s.life <= 0);
            if (dead) {
              dead.active = true;
              dead.life = 1;
              dead.mesh.visible = true;
              dead.mesh.position.set(c.flame.position.x, c.flame.position.y + 0.1, c.flame.position.z);
              dead.vx = (Math.random() - 0.5) * 0.02;
              dead.vy = 0.04 + Math.random() * 0.03;
              dead.vz = (Math.random() - 0.5) * 0.02;
              dead.mesh.scale.setScalar(1);
            }
          }
        }
        
        c.sparkles.forEach(s => {
          if (s.active && s.life > 0) {
            s.mesh.position.x += s.vx;
            s.mesh.position.y += s.vy;
            s.mesh.position.z += s.vz;
            s.vy -= 0.001;
            s.life -= 0.03;
            s.mesh.scale.setScalar(Math.max(0, s.life));
          } else if (s.active) {
            s.active = false;
            s.mesh.visible = false;
          }
        });
      });

      if (sceneRefs.current.stars) {
        sceneRefs.current.stars.material.opacity = 0.5 + Math.sin(time * 2) * 0.5;
      }

      // Fireworks
      const fwData = sceneRefs.current.fireworksData;
      for (let i = fwData.length - 1; i >= 0; i--) {
        const fw = fwData[i];
        fw.life -= 0.016;
        if (fw.life <= 0) {
          scene.remove(fw.mesh);
          fw.mesh.geometry.dispose();
          fw.mesh.material.dispose();
          fwData.splice(i, 1);
          continue;
        }
        fw.mesh.material.opacity = fw.life / fw.maxLife;
        const dummyFw = new THREE.Object3D();
        fw.particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vy -= 0.002;
          dummyFw.position.set(fw.x + p.x, fw.y + p.y, fw.z + p.z);
          dummyFw.updateMatrix();
          fw.mesh.setMatrixAt(idx, dummyFw.matrix);
        });
        fw.mesh.instanceMatrix.needsUpdate = true;
      }

      // 3D Text Float
      if (sceneRefs.current.textGroup) {
        sceneRefs.current.textGroup.position.y = 4 + Math.sin(time * 1.5) * 0.15;
      }

      // Ribbons
      sceneRefs.current.ribbons.forEach(r => {
        const pts = [];
        r.basePoints.forEach((p, idx) => {
          pts.push(new THREE.Vector3(
            p.x + Math.sin(time * 2 + r.offset + idx) * 0.2,
            p.y + Math.cos(time * 1.5 + r.offset + idx) * 0.2,
            p.z + Math.sin(time * 1.8 + r.offset + idx) * 0.2
          ));
        });
        const curve = new THREE.CatmullRomCurve3(pts);
        r.mesh.geometry.dispose();
        r.mesh.geometry = new THREE.TubeGeometry(curve, 30, 0.03, 4, false);
      });

      if (controls.enabled) {
        controls.update();
      }

      if (sceneRefs.current.composer) {
        sceneRefs.current.composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      initialized.current = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Phase 2 Animation Triggered by `started` prop
  useEffect(() => {
    if (!started || !sceneRefs.current.camera) return;

    const refs = sceneRefs.current;

    const tl = gsap.timeline({ delay: 0.5 });

    const camProxy = { x: 0, y: 6, z: 5 };
    const lookProxy = { x: 0, y: 0, z: 0 };

    tl.to(camProxy, {
      x: 0, y: 2.5, z: 14, duration: 2.2, ease: 'power3.inOut',
      onUpdate() {
        if (refs.camera) {
          refs.camera.position.set(camProxy.x, camProxy.y, camProxy.z);
          refs.camera.lookAt(lookProxy.x, lookProxy.y, lookProxy.z);
        }
      }
    }, 0);

    tl.to(lookProxy, {
      x: 0, y: 1.5, z: 0, duration: 2.2, ease: 'power3.inOut',
      onUpdate() {
        if (refs.camera) refs.camera.lookAt(lookProxy.x, lookProxy.y, lookProxy.z);
      }
    }, 0);

    // 1. Staggered layer entrance
    const pProxy = { y: -8 };
    tl.to(pProxy, {
      y: 0.06,
      duration: 1.2,
      ease: 'back.out(1.4)',
      onUpdate() { if (refs.plate) refs.plate.position.y = pProxy.y; }
    }, 0);

    const l1Proxy = { y: -8, scale: 1.1 };
    tl.to(l1Proxy, {
      y: 0.61, duration: 1.2, ease: 'back.out(1.4)',
      onUpdate() {
        if (refs.layer1) {
          refs.layer1.position.y = l1Proxy.y;
          refs.layer1.scale.setScalar(l1Proxy.scale);
        }
      }
    }, 0);
    tl.to(l1Proxy, {
      scale: 1.0, duration: 0.3, ease: 'elastic.out(1, 0.5)',
      onUpdate() { if (refs.layer1) refs.layer1.scale.setScalar(l1Proxy.scale); }
    }, 1.2);

    const l2Proxy = { y: -8, scale: 1.1 };
    tl.to(l2Proxy, {
      y: 1.66, duration: 1.1, ease: 'back.out(1.3)',
      onUpdate() {
        if (refs.layer2) {
          refs.layer2.position.y = l2Proxy.y;
          refs.layer2.scale.setScalar(l2Proxy.scale);
        }
      }
    }, 0.25);
    tl.to(l2Proxy, {
      scale: 1.0, duration: 0.3, ease: 'elastic.out(1, 0.5)',
      onUpdate() { if (refs.layer2) refs.layer2.scale.setScalar(l2Proxy.scale); }
    }, 1.35);

    const l3Proxy = { y: -8, scale: 1.1 };
    tl.to(l3Proxy, {
      y: 2.56, duration: 1.0, ease: 'back.out(1.2)',
      onUpdate() {
        if (refs.layer3) {
          refs.layer3.position.y = l3Proxy.y;
          refs.layer3.scale.setScalar(l3Proxy.scale);
        }
      }
    }, 0.5);
    tl.to(l3Proxy, {
      scale: 1.0, duration: 0.3, ease: 'elastic.out(1, 0.5)',
      onUpdate() { if (refs.layer3) refs.layer3.scale.setScalar(l3Proxy.scale); }
    }, 1.5);

    // Candles fade in after cake lands (t ≈ 1.5s)
    refs.candles.forEach((c, i) => {
      const cProxy = { intensity: 0 };
      tl.to(cProxy, {
        intensity: 0.3,
        duration: 0.4,
        onUpdate() { c.baseIntensity = cProxy.intensity; }
      }, 1.5 + i * 0.1);
    });

    if (refs.textLetters && refs.textLetters.length > 0) {
      refs.textLetters.forEach((lMesh, i) => {
        const lProxy = { y: 10 };
        tl.to(lProxy, {
          y: 0,
          duration: 1.2,
          ease: 'bounce.out',
          onUpdate() { lMesh.position.y = lProxy.y; }
        }, 2.0 + i * 0.1);
      });
    }

    tl.call(() => {
      if (refs.controls) {
        refs.controls.target.set(0, 1.5, 0);
        refs.controls.update();
        refs.controls.enabled = true;
      }
    }, [], 2.5);

    return () => {
      tl.kill();
    };
  }, [started]);

  return (
    <>
      {errorMsg && (
        <div style={{ position: 'absolute', zIndex: 9999, color: 'red', background: 'white', padding: '10px' }}>
          {errorMsg}
        </div>
      )}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
}
