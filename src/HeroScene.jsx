import { useEffect, useRef } from "react";
import * as THREE from "three";

const JF = "'Josefin Sans',sans-serif";
const MN = "'MariellaNove',sans-serif";

export default function HeroScene({ openAuth }) {
  const mountRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0b0b, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b);
    scene.fog = new THREE.FogExp2(0x0b0b0b, 0.042);

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 80);
    camera.position.set(3, 5.5, 13);
    camera.lookAt(0, 0.9, 0);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0x0d0d1a, 3.5));

    const portalLight = new THREE.PointLight(0xe8cda9, 10, 15);
    portalLight.position.set(0, 2, 0);
    scene.add(portalLight);

    const rimLight = new THREE.DirectionalLight(0x1a2035, 1.8);
    rimLight.position.set(-8, 7, -3);
    scene.add(rimLight);

    /* ── Conveyor belt (floor) ── */
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(34, 0.1, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.92, metalness: 0.12 })
    );
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── Lane dividers ── */
    for (const z of [-0.6, 0, 0.6]) {
      const lane = new THREE.Mesh(
        new THREE.BoxGeometry(34, 0.005, 0.016),
        new THREE.MeshBasicMaterial({ color: 0x21212a })
      );
      lane.position.set(0, 0.055, z);
      scene.add(lane);
    }

    /* ── Moving conveyor markers (scrolling arrows feel) ── */
    const MARKER_N = 24;
    const markerMeshes = [];
    for (let i = 0; i < MARKER_N; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.005, 0.055),
        new THREE.MeshBasicMaterial({ color: 0x222228 })
      );
      m.position.set(-14 + (i / MARKER_N) * 28, 0.062, (Math.random() - 0.5) * 2.6);
      scene.add(m);
      markerMeshes.push(m);
    }

    /* ── Portal position ── */
    const PORTAL_X = 0;

    /* ── Portal ring ── */
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe8cda9,
      emissive: new THREE.Color(0xe8cda9),
      emissiveIntensity: 2.0,
      roughness: 0.12,
      metalness: 0.9,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.062, 22, 90), ringMat);
    ring.position.set(PORTAL_X, 1.72, 0);
    ring.rotation.y = Math.PI / 2;
    scene.add(ring);

    /* ── Portal disk (translucent fill) ── */
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0xe8cda9, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    });
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1.44, 52), diskMat);
    disk.position.set(PORTAL_X, 1.72, 0);
    disk.rotation.y = Math.PI / 2;
    scene.add(disk);

    /* ── Portal outer halo ── */
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xe8cda9, transparent: true, opacity: 0.038,
    });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.32, 8, 52), haloMat);
    halo.position.set(PORTAL_X, 1.72, 0);
    halo.rotation.y = Math.PI / 2;
    scene.add(halo);

    /* ── Ground glow under portal ── */
    const gGlow = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 36),
      new THREE.MeshBasicMaterial({ color: 0xe8cda9, transparent: true, opacity: 0.03 })
    );
    gGlow.rotation.x = -Math.PI / 2;
    gGlow.position.set(PORTAL_X, 0.008, 0);
    scene.add(gGlow);

    /* ── Portal orbiting particles ── */
    const PART_N = 240;
    const partPos = new Float32Array(PART_N * 3);
    const partData = Array.from({ length: PART_N }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 1.3 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.14 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.003,
    }));
    const partGeom = new THREE.BufferGeometry();
    partGeom.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
    scene.add(new THREE.Points(partGeom, new THREE.PointsMaterial({
      color: 0xe8cda9, size: 0.033, transparent: true, opacity: 0.72, sizeAttenuation: true,
    })));

    /* ── Ambient dust ── */
    const DUST_N = 320;
    const dustPos = new Float32Array(DUST_N * 3);
    const dustVel = Array.from({ length: DUST_N }, () => ({
      vx: (Math.random() - 0.5) * 0.003,
      vy: 0.001 + Math.random() * 0.002,
    }));
    for (let i = 0; i < DUST_N; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 30;
      dustPos[i * 3 + 1] = Math.random() * 4.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustGeom, new THREE.PointsMaterial({
      color: 0xf5f2ea, size: 0.016, transparent: true, opacity: 0.16, sizeAttenuation: true,
    })));

    /* ── People ── */
    const COL_GRAY = new THREE.Color(0x2b2b33);
    const COL_GOLD = new THREE.Color(0xe8cda9);
    const COL_BLACK = new THREE.Color(0x000000);
    const SPAWN_X = -15;
    const EXIT_X  = 15;
    const SPEED   = 1.3;
    const people  = [];

    const bodyGeomBase = new THREE.CapsuleGeometry(0.19, 0.58, 4, 10);
    const headGeomBase = new THREE.SphereGeometry(0.19, 10, 10);
    const armGeomBase  = new THREE.CapsuleGeometry(0.053, 0.38, 4, 6);
    const legGeomBase  = new THREE.CapsuleGeometry(0.063, 0.42, 4, 6);

    function createPerson(startX, profitable) {
      const group = new THREE.Group();
      const bMat = new THREE.MeshStandardMaterial({
        color: profitable ? COL_GOLD.clone() : COL_GRAY.clone(),
        emissive: profitable ? COL_GOLD.clone() : COL_BLACK.clone(),
        emissiveIntensity: profitable ? 0.28 : 0,
        roughness: profitable ? 0.32 : 0.82,
        metalness: profitable ? 0.5 : 0.05,
      });

      const body     = new THREE.Mesh(bodyGeomBase, bMat);
      const head     = new THREE.Mesh(headGeomBase, bMat);
      const leftArm  = new THREE.Mesh(armGeomBase, bMat);
      const rightArm = new THREE.Mesh(armGeomBase, bMat);
      const leftLeg  = new THREE.Mesh(legGeomBase, bMat);
      const rightLeg = new THREE.Mesh(legGeomBase, bMat);

      body.position.y = 0.73;
      head.position.y = 1.38;
      leftArm.position.set(-0.27, 0.71, 0);  leftArm.rotation.z = 0.24;
      rightArm.position.set(0.27, 0.71, 0); rightArm.rotation.z = -0.24;
      leftLeg.position.set(-0.11, 0.26, 0);
      rightLeg.position.set(0.11, 0.26, 0);

      [body, head, leftArm, rightArm, leftLeg, rightLeg].forEach(m => {
        m.castShadow = true;
        group.add(m);
      });

      group.position.set(startX + (Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 1.9);
      scene.add(group);

      people.push({
        group, bMat, body, head, leftArm, rightArm, leftLeg, rightLeg,
        profitable, transformed: profitable,
        phase: Math.random() * Math.PI * 2,
      });
    }

    /* Pre-populate */
    for (let x = SPAWN_X + 0.5; x < EXIT_X; x += 2.3) {
      createPerson(x + Math.random() * 0.5, x > PORTAL_X + 1.2);
    }

    /* ── Resize ── */
    const onResize = () => {
      W = mount.clientWidth; H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    /* ── Animate ── */
    let raf, lastT = 0;
    const tmpVec = new THREE.Vector3();

    const animate = (time) => {
      raf = requestAnimationFrame(animate);
      const t = time * 0.001;
      const dt = Math.min(t - lastT, 0.05);
      lastT = t;

      /* Camera gentle sway */
      camera.position.x = 3 + Math.sin(t * 0.07) * 1.8;
      camera.position.y = 5.5 + Math.sin(t * 0.044) * 0.4;
      camera.lookAt(0, 0.9, 0);

      /* Portal pulse */
      const pulse = 1 + Math.sin(t * 2.3) * 0.055;
      ring.scale.set(pulse, pulse, 1);
      halo.scale.set(pulse * 1.05, pulse * 1.05, 1);
      portalLight.intensity = 8 + Math.sin(t * 3.0) * 3.5;
      diskMat.opacity = 0.045 + Math.sin(t * 2.3) * 0.018;

      /* Orbiting particles */
      for (let i = 0; i < PART_N; i++) {
        const d = partData[i];
        d.angle += d.speed * dt;
        d.phase += dt * 0.45;
        d.r = Math.max(0.8, Math.min(2.3, d.r + d.drift));
        if (d.r < 0.8 || d.r > 2.3) d.drift *= -1;
        partPos[i * 3]     = Math.sin(d.phase * 0.7) * 0.18;
        partPos[i * 3 + 1] = 1.72 + Math.cos(d.angle) * d.r;
        partPos[i * 3 + 2] = Math.sin(d.angle) * d.r;
      }
      partGeom.attributes.position.needsUpdate = true;

      /* Dust drift */
      for (let i = 0; i < DUST_N; i++) {
        dustPos[i * 3]     += dustVel[i].vx;
        dustPos[i * 3 + 1] += dustVel[i].vy;
        if (dustPos[i * 3 + 1] > 5) { dustPos[i * 3 + 1] = 0; }
        if (Math.abs(dustPos[i * 3]) > 15) { dustPos[i * 3] *= -1; }
      }
      dustGeom.attributes.position.needsUpdate = true;

      /* Conveyor markers scroll */
      for (const m of markerMeshes) {
        m.position.x += SPEED * dt;
        if (m.position.x > EXIT_X) m.position.x = SPAWN_X;
      }

      /* People update */
      for (let i = people.length - 1; i >= 0; i--) {
        const p = people[i];
        p.group.position.x += SPEED * dt;
        const px = p.group.position.x;

        /* Smooth color transition inside portal zone */
        const zone = 0.9;
        if (!p.profitable && px > PORTAL_X - zone && px < PORTAL_X + zone) {
          const prog = Math.max(0, Math.min(1, (px - (PORTAL_X - zone)) / (zone * 2)));
          p.bMat.color.lerpColors(COL_GRAY, COL_GOLD, prog);
          p.bMat.emissive.lerpColors(COL_BLACK, COL_GOLD, prog);
          p.bMat.emissiveIntensity = prog * 0.3;
          p.bMat.roughness = 0.82 - prog * 0.5;
          p.bMat.metalness = 0.05 + prog * 0.45;
        }
        if (!p.transformed && px > PORTAL_X + zone) {
          p.transformed = true;
          p.profitable = true;
        }

        /* Walk animation */
        const ws = 3.1;
        const leg = Math.sin(t * ws + p.phase) * 0.36;
        const arm = Math.sin(t * ws + p.phase) * 0.26;
        p.leftLeg.rotation.x  =  leg;
        p.rightLeg.rotation.x = -leg;
        p.leftArm.rotation.x  = -arm;
        p.rightArm.rotation.x =  arm;
        p.body.rotation.z     = Math.sin(t * ws + p.phase) * 0.022;
        p.head.rotation.y     = Math.sin(t * ws * 0.5 + p.phase) * 0.07;

        /* Recycle */
        if (px > EXIT_X + 1) {
          scene.remove(p.group);
          p.bMat.dispose();
          people.splice(i, 1);
          createPerson(SPAWN_X, false);
        }
      }

      /* Project portal position to screen for CSS label */
      if (labelRef.current) {
        tmpVec.set(PORTAL_X, 3.55, 0);
        tmpVec.project(camera);
        const sx = ((tmpVec.x + 1) * 0.5 * W);
        const sy = ((-tmpVec.y + 1) * 0.5 * H);
        labelRef.current.style.left = `${sx}px`;
        labelRef.current.style.top  = `${sy}px`;
      }

      renderer.render(scene, camera);
    };

    animate(0);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      [bodyGeomBase, headGeomBase, armGeomBase, legGeomBase, partGeom, dustGeom].forEach(g => g.dispose());
      scene.traverse(obj => {
        if (obj.material) {
          Array.isArray(obj.material) ? obj.material.forEach(m => m.dispose()) : obj.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#0b0b0b" }}>

      {/* Three.js canvas */}
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {/* Left gradient so text is readable */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(11,11,11,0.9) 0%, rgba(11,11,11,0.55) 38%, rgba(11,11,11,0.1) 62%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />

      {/* Hero text */}
      <div style={{ position: "absolute", left: "8vw", top: "50%", transform: "translateY(-50%)", maxWidth: 500, zIndex: 10 }}>
        <div style={{ fontSize: 10, color: "rgba(245,242,234,0.32)", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 24, fontFamily: JF, fontWeight: 600 }}>
          Trading Journal
        </div>
        <h1 style={{ fontFamily: JF, fontWeight: 700, fontSize: "clamp(34px,4.6vw,60px)", letterSpacing: "-0.04em", lineHeight: 1.06, color: "#f5f2ea", marginBottom: 22 }}>
          Your trading<br />deserves{" "}
          <em style={{ fontStyle: "italic", color: "#e8cda9" }}>structure.</em>
        </h1>
        <p style={{ fontFamily: JF, fontWeight: 300, fontSize: 15, color: "rgba(245,242,234,0.48)", lineHeight: 1.72, marginBottom: 36, maxWidth: 370 }}>
          Fyltra is the trading journal designed to help you analyze, improve and stay consistent.
        </p>
        <button
          onClick={() => openAuth && openAuth("signup")}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#f5f2ea", color: "#0b0b0b", border: "none", borderRadius: 100, padding: "15px 30px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: JF, transition: "opacity 0.2s", marginBottom: 14 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.86"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          START JOURNALING
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <div style={{ fontSize: 10, color: "rgba(245,242,234,0.2)", fontFamily: JF, fontWeight: 300, letterSpacing: "0.04em" }}>
          No credit card required.
        </div>
      </div>

      {/* Portal FYLTRA label — tracks 3D position */}
      <div
        ref={labelRef}
        style={{ position: "absolute", transform: "translate(-50%, -100%)", zIndex: 10, pointerEvents: "none", textAlign: "center" }}
      >
        <div style={{ fontFamily: MN, fontSize: "clamp(26px, 2.8vw, 40px)", color: "#e8cda9", textShadow: "0 0 28px rgba(232,205,169,0.95), 0 0 55px rgba(232,205,169,0.55), 0 0 90px rgba(232,205,169,0.28)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          FYLTRA
        </div>
        <div style={{ fontSize: 8, color: "rgba(232,205,169,0.45)", letterSpacing: "0.24em", textTransform: "uppercase", fontFamily: JF, fontWeight: 600, marginTop: 3 }}>
          THE PORTAL
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 10, textAlign: "center" }}>
        <div style={{ width: 1, height: 38, background: "linear-gradient(to bottom, transparent, rgba(245,242,234,0.22))", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 8, color: "rgba(245,242,234,0.22)", letterSpacing: "0.2em", fontFamily: JF, fontWeight: 600, textTransform: "uppercase" }}>Scroll</div>
      </div>
    </div>
  );
}
