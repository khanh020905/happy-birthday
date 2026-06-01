import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

export default function BirthdayScene({ started, onFinale }) {
  const mountRef = useRef(null);
  const initialized = useRef(false);

  // References to things we need to animate/update in the loop
  const sceneRefs = useRef({
    cakeGroup: null,
    layer1: null,
    layer2: null,
    layer3: null,
    candles: [],
    orbitLight: null,
    confetti: [],
    confettiParams: { spawnRateMultiplier: 1 },
    stars: null,
    camera: null,
    controls: null,
    mouse: new THREE.Vector2(),
    targetCameraOffset: new THREE.Vector3(),
    blownCandles: 0
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // --- 1. SETUP ---
    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.opacity = '0'; // Phase 2 reveal
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Scene background is set via alpha and CSS background, but we can set scene fog or clearColor
    // Using transparent renderer so CSS #0a0010 shows through, or set scene background
    // Requirement says near-black
    // Wait, let's just make the renderer background transparent so the CSS body background shows.
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 10, 0); // Far above looking down
    camera.lookAt(0, 1.5, 0);
    sceneRefs.current.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = THREE.MathUtils.degToRad(20);
    controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
    controls.enabled = false; // Disable until Phase 3
    if (window.innerWidth < 768) {
      // Touch drag only? OrbitControls handles this by default.
    }
    sceneRefs.current.controls = controls;

    // --- 2. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 8, 5);
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
    const tBottom = textureLoader.load('/assets/textures/cake-bottom.jpg');
    const tMiddle = textureLoader.load('/assets/textures/cake-middle.jpg');
    const tTop = textureLoader.load('/assets/textures/cake-top.jpg');
    const tFrosting = textureLoader.load('/assets/textures/frosting.jpg');
    const tPhoto = textureLoader.load('/assets/iamge-1.jpg');

    // --- 4. CAKE GEOMETRY ---
    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = -1.5; // Move the whole cake down
    scene.add(cakeGroup);
    sceneRefs.current.cakeGroup = cakeGroup;

    // Plate
    const plateGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.12, 64);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xe8d5b0, roughness: 0.4, metalness: 0.3 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.06;
    cakeGroup.add(plate);

    // Helper for creating layers
    const createLayer = (radius, height, yPos, sideTex, topTex) => {
      const geo = new THREE.CylinderGeometry(radius, radius, height, 64);
      const mats = [
        new THREE.MeshStandardMaterial({ map: sideTex }), // Side
        new THREE.MeshStandardMaterial({ map: topTex }),  // Top
        new THREE.MeshStandardMaterial({ map: topTex })   // Bottom
      ];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.y = yPos;
      // Initial Y is 0 for reveal animation
      mesh.userData.targetY = yPos;
      mesh.position.y = 0;
      mesh.scale.set(0, 0, 0); // Hide initially
      return mesh;
    };

    // Layer 1
    const layer1 = createLayer(1.8, 1.1, 0.55 + 0.06, tBottom, tFrosting);
    cakeGroup.add(layer1);
    sceneRefs.current.layer1 = layer1;

    // Layer 2
    const layer2 = createLayer(1.35, 0.95, 1.6 + 0.06, tMiddle, tFrosting);
    cakeGroup.add(layer2);
    sceneRefs.current.layer2 = layer2;

    // Pearls for Layer 2
    const pearlGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xf9c6d0, roughness: 0.2, metalness: 0.1 });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      pearl.position.set(Math.cos(angle) * 1.3, 0.95/2, Math.sin(angle) * 1.3);
      layer2.add(pearl);
    }

    // Layer 3
    const layer3 = createLayer(0.9, 0.8, 2.5 + 0.06, tTop, tFrosting);
    cakeGroup.add(layer3);
    sceneRefs.current.layer3 = layer3;

    // Photo frame
    const frameGroup = new THREE.Group();
    frameGroup.position.y = 0.8/2 + 0.02; // On top of layer 3
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
    photoLight.position.set(0, 1.5, 0); // Above the photo
    layer3.add(photoLight);

    // Candles
    const candleColors = [0xff6b9d, 0xc9b1ff, 0xffda63, 0xff6b9d, 0xc9b1ff];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const cGroup = new THREE.Group();
      cGroup.position.set(Math.cos(angle) * 0.5, 0.8/2 + 0.19, Math.sin(angle) * 0.5);
      
      const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.38, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: candleColors[i] });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      cGroup.add(body);

      const flameGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
      const flameMat = new THREE.MeshStandardMaterial({ 
        color: 0xffaa00, 
        emissive: 0xff6600, 
        emissiveIntensity: 1.2 
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.19 + 0.09;
      // Start hidden
      flame.scale.set(0,0,0);
      cGroup.add(flame);

      const light = new THREE.PointLight(0xffaa44, 0.0, 1.5); // Intensity 0 initially
      light.position.y = 0.19 + 0.09;
      cGroup.add(light);

      layer3.add(cGroup);

      // Raycast target block
      const hitboxGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.position.y = 0.2;
      hitbox.userData = { isCandle: true, index: i };
      cGroup.add(hitbox);

      sceneRefs.current.candles.push({ group: cGroup, flame, light, hitbox, active: true });
    }

    // --- 5. PARTICLES ---
    // Confetti
    const numConfetti = window.innerWidth < 768 ? 80 : 200;
    const confettiColors = ['#ff6b9d', '#ffda63', '#c9b1ff', '#63d8ff', '#ff9f68'];
    const confettiGeo = new THREE.PlaneGeometry(0.08, 0.14);
    
    for (let i = 0; i < numConfetti; i++) {
      const mat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(confettiColors[Math.floor(Math.random() * confettiColors.length)]),
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(confettiGeo, mat);
      
      mesh.position.set(
        (Math.random() - 0.5) * 12,
        8 + Math.random() * 5,
        (Math.random() - 0.5) * 4
      );
      
      mesh.userData = {
        speed: 0.02 + Math.random() * 0.04,
        driftX: (Math.random() - 0.5) * 0.02,
        driftZ: (Math.random() - 0.5) * 0.02,
        rotSpeedX: (Math.random() - 0.5) * 0.1,
        rotSpeedY: (Math.random() - 0.5) * 0.1,
        rotSpeedZ: (Math.random() - 0.5) * 0.1
      };
      
      scene.add(mesh);
      sceneRefs.current.confetti.push(mesh);
    }

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

    // --- 6. RAYCASTER & EVENTS ---
    const raycaster = new THREE.Raycaster();
    
    const onPointerMove = (e) => {
      sceneRefs.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneRefs.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      // Parallax target
      sceneRefs.current.targetCameraOffset.x = sceneRefs.current.mouse.x * 0.5;
      sceneRefs.current.targetCameraOffset.y = sceneRefs.current.mouse.y * 0.5;
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
          
          gsap.to(candleData.flame.scale, { x: 0, y: 0, z: 0, duration: 0.3 });
          gsap.to(candleData.light, { intensity: 0, duration: 0.3 });

          // check finale
          if (sceneRefs.current.blownCandles === 5 && onFinale) {
            sceneRefs.current.confettiParams.spawnRateMultiplier = 2;
            setTimeout(() => {
              sceneRefs.current.confettiParams.spawnRateMultiplier = 1;
            }, 5000);
            onFinale();
          }
        }
      }
    };
    window.addEventListener('click', onClick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // --- 7. ANIMATION LOOP ---
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Idle Rotation
      if (sceneRefs.current.cakeGroup) {
        sceneRefs.current.cakeGroup.rotation.y += 0.003;
      }

      // Orbit Light
      if (sceneRefs.current.orbitLight) {
        sceneRefs.current.orbitLight.position.x = Math.cos(time * 0.5) * 4;
        sceneRefs.current.orbitLight.position.z = Math.sin(time * 0.5) * 4;
        sceneRefs.current.orbitLight.position.y = 3;
      }

      // Confetti
      const multiplier = sceneRefs.current.confettiParams.spawnRateMultiplier;
      sceneRefs.current.confetti.forEach(c => {
        c.position.y -= c.userData.speed * multiplier;
        c.position.x += c.userData.driftX;
        c.position.z += c.userData.driftZ;
        c.rotation.x += c.userData.rotSpeedX;
        c.rotation.y += c.userData.rotSpeedY;
        c.rotation.z += c.userData.rotSpeedZ;

        if (c.position.y < -3) {
          c.position.y = 8 + Math.random() * 2;
          c.position.x = (Math.random() - 0.5) * 12;
        }
      });

      // Candles flicker
      sceneRefs.current.candles.forEach(c => {
        if (c.active && c.flame.scale.y > 0.5) { // If ignited
          c.flame.scale.y = 0.85 + Math.random() * 0.3;
          c.flame.scale.x = 0.9 + Math.random() * 0.2;
          c.flame.scale.z = c.flame.scale.x;
          c.light.intensity = 0.3 + Math.random() * 0.2;
        }
      });

      // Stars twinkle
      if (sceneRefs.current.stars) {
        sceneRefs.current.stars.material.opacity = 0.5 + Math.sin(time * 2) * 0.5;
      }

      // Camera Parallax
      if (controls.enabled) {
        controls.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onFinale]);

  // Phase 2 Animation Triggered by `started` prop
  useEffect(() => {
    if (started && sceneRefs.current.camera) {
      const { camera, controls, layer1, layer2, layer3, candles } = sceneRefs.current;
      const rendererDom = mountRef.current.querySelector('canvas');

      const tl = gsap.timeline({ delay: 2 }); // Start at 2s (Phase 2)

      // Canvas fade in
      tl.to(rendererDom, { opacity: 1, duration: 1.5 }, 0);

      // Camera dolly
      tl.to(camera.position, {
        x: 0,
        y: 2.5,
        z: 8,
        duration: 3,
        ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(0, 0, 0),
        onComplete: () => { 
          controls.target.set(0, 0, 0);
          controls.enabled = true; 
        } // Enable orbit after intro
      }, 0);

      // Cake layers rise and scale up
      const layers = [layer1, layer2, layer3];
      layers.forEach((layer, i) => {
        tl.to(layer.scale, {
          x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.5)'
        }, 1.5 + i * 0.3);

        tl.to(layer.position, {
          y: layer.userData.targetY, duration: 1, ease: 'elastic.out(1, 0.6)'
        }, 1.5 + i * 0.3);
      });

      // Ignite candles around 4.5s
      candles.forEach((c) => {
        tl.to(c.flame.scale, {
          x: 1, y: 1, z: 1, duration: 0.2, ease: 'back.out(2)'
        }, 2.5); // 2 + 2.5 = 4.5s
        tl.to(c.light, {
          intensity: 0.4, duration: 0.2
        }, 2.5);
      });
    }
  }, [started]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
