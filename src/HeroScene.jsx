import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const JF = "'Josefin Sans',sans-serif";
const MN = "'MariellaNove',sans-serif";

const COL_PRE  = new THREE.Color(0x1e1e28);   // cold blue-gray (unprofitable)
const COL_POST = new THREE.Color(0xe8cda9);    // warm gold (profitable)
const COL_BLACK = new THREE.Color(0x000000);
const PORTAL_X  = 0;
const SPAWN_X   = -18;
const EXIT_X    = 18;
const SPEED     = 1.5;

/* Particle count per cluster — shapes a loose vertical human silhouette */
const CLUSTER_N = 72;

function buildClusterPositions() {
  const pos = new Float32Array(CLUSTER_N * 3);
  for (let i = 0; i < CLUSTER_N; i++) {
    const t = i / CLUSTER_N;
    // vertical distribution: feet at 0, head at ~2.1
    const y = t * 2.1 + (Math.random() - 0.5) * 0.18;
    // radial spread — widest at hips, narrow at head/feet
    const spread = Math.max(0, Math.sin(t * Math.PI) * 0.26);
    const angle = Math.random() * Math.PI * 2;
    const r = spread * (0.4 + Math.random() * 0.6);
    pos[i * 3]     = Math.cos(angle) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(angle) * r * 0.55; // slightly flat front-to-back
  }
  return pos;
}

export default function HeroScene({ openAuth }) {
  const mountRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0b0b, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b);
    scene.fog = new THREE.FogExp2(0x0b0b0b, 0.038);

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 80);
    camera.position.set(0, 6, 15);
    camera.lookAt(0, 1, 0);

    /* ── PostProcessing — Bloom ── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.4, 0.55, 0.08);
    composer.addPass(bloom);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0x080810, 4));

    const portalLight = new THREE.PointLight(0xe8cda9, 14, 18);
    portalLight.position.set(PORTAL_X, 2.2, 0);
    scene.add(portalLight);

    const rimL = new THREE.DirectionalLight(0x0a0a18, 2);
    rimL.position.set(-10, 8, -4);
    scene.add(rimL);

    /* ── Floor — dark, slightly reflective ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 8),
      new THREE.MeshStandardMaterial({
        color: 0x0d0d10,
        roughness: 0.08,
        metalness: 0.85,
        envMapIntensity: 0.6,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── Thin floor glow lines (conveyor feel) ── */
    for (const z of [-0.65, 0, 0.65]) {
      const g = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 0.012),
        new THREE.MeshBasicMaterial({ color: 0x1c1c24 })
      );
      g.rotation.x = -Math.PI / 2;
      g.position.set(0, 0.001, z);
      scene.add(g);
    }

    /* ── Portal ring — single, clean ── */
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe8cda9,
      emissive: new THREE.Color(0xe8cda9),
      emissiveIntensity: 3.5,
      roughness: 0.05,
      metalness: 1.0,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.048, 24, 100),
      ringMat
    );
    ring.position.set(PORTAL_X, 1.6, 0);
    ring.rotation.y = Math.PI / 2;
    scene.add(ring);

    /* ── Portal inner disk (very faint) ── */
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0xe8cda9, transparent: true, opacity: 0.04, side: THREE.DoubleSide,
    });
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1.5, 60), diskMat);
    disk.position.set(PORTAL_X, 1.6, 0);
    disk.rotation.y = Math.PI / 2;
    scene.add(disk);

    /* ── Ground halo under portal ── */
    const groundHalo = new THREE.Mesh(
      new THREE.CircleGeometry(3.0, 48),
      new THREE.MeshBasicMaterial({ color: 0xe8cda9, transparent: true, opacity: 0.025 })
    );
    groundHalo.rotation.x = -Math.PI / 2;
    groundHalo.position.set(PORTAL_X, 0.002, 0);
    scene.add(groundHalo);

    /* ── Ambient floating dust ── */
    const DUST_N = 400;
    const dustPos = new Float32Array(DUST_N * 3);
    const dustVel = [];
    for (let i = 0; i < DUST_N; i++) {
      dustPos[i*3]     = (Math.random() - 0.5) * 36;
      dustPos[i*3 + 1] = Math.random() * 5;
      dustPos[i*3 + 2] = (Math.random() - 0.5) * 6;
      dustVel.push({ vx: (Math.random() - 0.5) * 0.003, vy: 0.001 + Math.random() * 0.002 });
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustGeom, new THREE.PointsMaterial({
      color: 0xf5f2ea, size: 0.014, transparent: true, opacity: 0.14, sizeAttenuation: true,
    })));

    /* ── Portal sparkle ring particles ── */
    const SPARK_N = 180;
    const sparkPos = new Float32Array(SPARK_N * 3);
    const sparkData = Array.from({ length: SPARK_N }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: 1.45 + (Math.random() - 0.5) * 0.9,
      speed: 0.12 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.004,
      phase: Math.random() * Math.PI * 2,
    }));
    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    scene.add(new THREE.Points(sparkGeom, new THREE.PointsMaterial({
      color: 0xe8cda9, size: 0.045, transparent: true, opacity: 0.9, sizeAttenuation: true,
    })));

    /* ── Person clusters ── */
    const clusters = [];

    function spawnCluster(startX, profitable) {
      const basePos = buildClusterPositions();
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(basePos.slice(), 3));

      const mat = new THREE.PointsMaterial({
        color: profitable ? COL_POST.clone() : COL_PRE.clone(),
        size: profitable ? 0.075 : 0.062,
        transparent: true,
        opacity: profitable ? 0.92 : 0.7,
        sizeAttenuation: true,
      });

      const pts = new THREE.Points(geom, mat);
      const group = new THREE.Group();
      group.add(pts);
      group.position.set(startX, 0, (Math.random() - 0.5) * 1.9);
      scene.add(group);

      clusters.push({
        group, pts, mat, geom,
        basePos,
        profitable,
        transformed: profitable,
        phase: Math.random() * Math.PI * 2,
      });
    }

    /* Pre-populate scene */
    for (let x = SPAWN_X + 1; x < EXIT_X; x += 2.6) {
      spawnCluster(x + (Math.random() - 0.5) * 0.6, x > PORTAL_X + 1.8);
    }

    /* ── Resize ── */
    const onResize = () => {
      W = mount.clientWidth; H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      composer.setSize(W, H);
      bloom.resolution.set(W, H);
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

      /* Camera slow orbit */
      camera.position.x = Math.sin(t * 0.055) * 2.5;
      camera.position.y = 6 + Math.sin(t * 0.038) * 0.5;
      camera.position.z = 15 + Math.cos(t * 0.028) * 1.0;
      camera.lookAt(0, 1.1, 0);

      /* Portal pulse */
      const pulse = 1 + Math.sin(t * 2.2) * 0.04;
      ring.scale.set(pulse, pulse, 1);
      ringMat.emissiveIntensity = 3.2 + Math.sin(t * 2.8) * 0.8;
      portalLight.intensity = 12 + Math.sin(t * 2.8) * 4;
      diskMat.opacity = 0.035 + Math.sin(t * 2.2) * 0.012;

      /* Sparkles orbit */
      for (let i = 0; i < SPARK_N; i++) {
        const d = sparkData[i];
        d.angle += d.speed * dt;
        d.r = Math.max(0.7, Math.min(2.4, d.r + d.drift));
        if (d.r < 0.7 || d.r > 2.4) d.drift *= -1;
        d.phase += dt * 0.4;
        sparkPos[i*3]     = Math.sin(d.phase * 0.6) * 0.22;
        sparkPos[i*3 + 1] = 1.6 + Math.cos(d.angle) * d.r;
        sparkPos[i*3 + 2] = Math.sin(d.angle) * d.r;
      }
      sparkGeom.attributes.position.needsUpdate = true;

      /* Dust drift */
      for (let i = 0; i < DUST_N; i++) {
        dustPos[i*3]     += dustVel[i].vx;
        dustPos[i*3 + 1] += dustVel[i].vy;
        if (dustPos[i*3 + 1] > 5.5) dustPos[i*3 + 1] = 0;
        if (Math.abs(dustPos[i*3]) > 18) dustPos[i*3] *= -1;
      }
      dustGeom.attributes.position.needsUpdate = true;

      /* Clusters */
      for (let i = clusters.length - 1; i >= 0; i--) {
        const c = clusters[i];
        c.group.position.x += SPEED * dt;
        const cx = c.group.position.x;

        /* Subtle breathing */
        const pp = c.geom.attributes.position;
        const breathe = Math.sin(t * 1.4 + c.phase) * 0.012;
        for (let j = 0; j < CLUSTER_N; j++) {
          pp.array[j*3 + 1] = c.basePos[j*3 + 1] + breathe + Math.sin(t * 2.1 + c.phase + j * 0.18) * 0.006;
        }
        pp.needsUpdate = true;

        /* Smooth color & size transition through portal */
        const zone = 1.1;
        if (!c.profitable && cx > PORTAL_X - zone && cx < PORTAL_X + zone) {
          const prog = Math.max(0, Math.min(1, (cx - (PORTAL_X - zone)) / (zone * 2)));
          c.mat.color.lerpColors(COL_PRE, COL_POST, prog);
          c.mat.opacity = 0.7 + prog * 0.22;
          c.mat.size = 0.062 + prog * 0.013;
          c.mat.emissive = COL_POST.clone().multiplyScalar(prog * 0.4);
        }
        if (!c.transformed && cx > PORTAL_X + zone) {
          c.transformed = true;
          c.profitable = true;
        }

        /* Recycle */
        if (cx > EXIT_X + 1) {
          scene.remove(c.group);
          c.geom.dispose();
          c.mat.dispose();
          clusters.splice(i, 1);
          spawnCluster(SPAWN_X, false);
        }
      }

      /* Project portal to 2D for CSS label */
      if (labelRef.current) {
        tmpVec.set(PORTAL_X, 3.65, 0);
        tmpVec.project(camera);
        labelRef.current.style.left = `${((tmpVec.x + 1) * 0.5 * W)}px`;
        labelRef.current.style.top  = `${((-tmpVec.y + 1) * 0.5 * H)}px`;
      }

      composer.render();
    };

    animate(0);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      composer.dispose();
      renderer.dispose();
      dustGeom.dispose();
      sparkGeom.dispose();
      clusters.forEach(c => { c.geom.dispose(); c.mat.dispose(); });
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          Array.isArray(obj.material)
            ? obj.material.forEach(m => m.dispose())
            : obj.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#0b0b0b" }}>

      {/* Three.js canvas */}
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {/* Left gradient — hero text readability */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(11,11,11,0.92) 0%, rgba(11,11,11,0.6) 36%, rgba(11,11,11,0.12) 58%, transparent 72%)", pointerEvents: "none", zIndex: 2 }} />

      {/* Hero text */}
      <div style={{ position: "absolute", left: "8vw", top: "50%", transform: "translateY(-50%)", maxWidth: 500, zIndex: 10 }}>
        <div style={{ fontSize: 10, color: "rgba(245,242,234,0.3)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 26, fontFamily: JF, fontWeight: 600 }}>
          Trading Journal
        </div>
        <h1 style={{ fontFamily: JF, fontWeight: 700, fontSize: "clamp(34px,4.5vw,60px)", letterSpacing: "-0.04em", lineHeight: 1.06, color: "#f5f2ea", marginBottom: 22 }}>
          Your trading<br />deserves{" "}
          <em style={{ fontStyle: "italic", color: "#e8cda9" }}>structure.</em>
        </h1>
        <p style={{ fontFamily: JF, fontWeight: 300, fontSize: 15, color: "rgba(245,242,234,0.45)", lineHeight: 1.75, marginBottom: 38, maxWidth: 360 }}>
          Fyltra is the trading journal designed to help you analyze, improve and stay consistent.
        </p>
        <button
          onClick={() => openAuth && openAuth("signup")}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#f5f2ea", color: "#0b0b0b", border: "none", borderRadius: 100, padding: "15px 30px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: JF, transition: "opacity 0.2s", marginBottom: 14 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
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

      {/* Portal label — tracked to 3D position */}
      <div
        ref={labelRef}
        style={{ position: "absolute", transform: "translate(-50%, -100%)", zIndex: 10, pointerEvents: "none", textAlign: "center" }}
      >
        <div style={{ fontFamily: MN, fontSize: "clamp(24px, 2.6vw, 38px)", color: "#e8cda9", textShadow: "0 0 24px rgba(232,205,169,1), 0 0 50px rgba(232,205,169,0.65), 0 0 90px rgba(232,205,169,0.32)", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
          FYLTRA
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 10, textAlign: "center" }}>
        <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, transparent, rgba(245,242,234,0.2))", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 8, color: "rgba(245,242,234,0.2)", letterSpacing: "0.22em", fontFamily: JF, fontWeight: 600, textTransform: "uppercase" }}>Scroll</div>
      </div>
    </div>
  );
}
