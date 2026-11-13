import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function PedestalStageFallback() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-end justify-center pb-12 overflow-hidden"
    >
      <div className="relative w-72 h-20 rounded-full bg-gradient-to-b from-[#C59B4B]/25 via-[#1A1410] to-[#0D0A08] border border-[#E5C77A]/40 shadow-[0_-20px_70px_rgba(229,199,122,0.28)]" />
    </div>
  );
}

const CATEGORY_GLOWS = {
  Electronics: "#E5C77A",
  Fashion: "#F2B880",
  "Home Appliances": "#D4AF37",
  "Books & Stationery": "#C59B4B",
};

function RoyalPedestalStage({
  activeCategory = "Electronics",
  activeIndex = 0,
  isPaused = false,
}) {
  const stageGroupRef = useRef();
  const outerBevelRef = useRef();
  const backdropHaloRef = useRef();
  const innerHaloRef = useRef();
  const targetTurnRef = useRef(0);

  const accentHex = CATEGORY_GLOWS[activeCategory] || "#E5C77A";
  const accentColor = useMemo(() => new THREE.Color(accentHex), [accentHex]);

  // Smooth rotational flourish when switching products
  useEffect(() => {
    targetTurnRef.current += Math.PI * 0.45;
  }, [activeIndex]);

  const studAngles = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const a = (idx / 12) * Math.PI * 2;
      return [Math.cos(a) * 1.98, -1.36, Math.sin(a) * 1.98];
    });
  }, []);

  useFrame((state, delta) => {
    const pointerX = state.pointer.x * 0.28;
    const pointerY = state.pointer.y * 0.14;

    if (stageGroupRef.current) {
      stageGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        stageGroupRef.current.rotation.y,
        pointerX + targetTurnRef.current * 0.12,
        0.05
      );
      stageGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        stageGroupRef.current.rotation.x,
        -pointerY * 0.5,
        0.05
      );
    }

    if (!isPaused) {
      if (outerBevelRef.current) {
        outerBevelRef.current.rotation.y += delta * 0.32;
      }
      if (backdropHaloRef.current) {
        backdropHaloRef.current.rotation.z += delta * 0.14;
      }
      if (innerHaloRef.current) {
        innerHaloRef.current.rotation.z -= delta * 0.22;
      }
    }
  });

  return (
    <group ref={stageGroupRef}>
      {/* Background Architectural Golden Halos framing the floating Real Product */}
      <group position={[0, 0.32, -1.35]}>
        <mesh ref={backdropHaloRef}>
          <torusGeometry args={[2.18, 0.022, 16, 96]} />
          <meshStandardMaterial
            color="#C59B4B"
            metalness={0.92}
            roughness={0.2}
            emissive="#4A3410"
            emissiveIntensity={0.25}
          />
        </mesh>

        <mesh ref={innerHaloRef} rotation={[0, 0, Math.PI / 6]}>
          <torusGeometry args={[1.76, 0.015, 16, 84]} />
          <meshStandardMaterial
            color={accentColor}
            metalness={0.94}
            roughness={0.16}
            emissive="#5C4012"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Tiered 3D Marble-Obsidian & Brushed Gold Museum Pedestal */}
      <group position={[0, 0.08, 0]}>
        {/* Lower obsidian plinth */}
        <mesh position={[0, -1.72, 0]}>
          <cylinderGeometry args={[2.32, 2.52, 0.24, 64]} />
          <meshStandardMaterial
            color="#110D0A"
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>

        {/* Upper turntable disc */}
        <mesh position={[0, -1.48, 0]}>
          <cylinderGeometry args={[1.88, 2.02, 0.22, 64]} />
          <meshStandardMaterial
            color="#1A1410"
            metalness={0.68}
            roughness={0.25}
          />
        </mesh>

        {/* Illuminated inner reflection mirror on turntable */}
        <mesh position={[0, -1.36, 0]}>
          <cylinderGeometry args={[1.65, 1.65, 0.02, 64]} />
          <meshStandardMaterial
            color="#261C14"
            metalness={0.85}
            roughness={0.14}
            emissive={accentColor}
            emissiveIntensity={0.16}
          />
        </mesh>

        {/* Brushed Gold Metallic Collar Ring */}
        <group ref={outerBevelRef}>
          <mesh position={[0, -1.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.98, 0.045, 20, 96]} />
            <meshStandardMaterial
              color={accentColor}
              metalness={0.95}
              roughness={0.14}
              emissive="#6B4C16"
              emissiveIntensity={0.35}
            />
          </mesh>

          {/* 12 Brass Orbiting Crown Studs on Turntable */}
          {studAngles.map((pos, idx) => (
            <mesh key={idx} position={pos} scale={0.065}>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color="#FFF3D1"
                metalness={0.95}
                roughness={0.1}
                emissive={accentHex}
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>

        {/* Subtle Upward Studio Spotlight Aura Cone */}
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[2.1, 2.85, 48, 1, true]} />
          <meshBasicMaterial
            color={accentHex}
            transparent
            opacity={0.055}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Golden Atmospheric Studio Particles */}
      {!isPaused && (
        <Sparkles
          count={65}
          scale={[5.6, 4.4, 3.6]}
          size={1.85}
          speed={0.3}
          opacity={0.7}
          color={accentHex}
        />
      )}
    </group>
  );
}

const HeroScene3D = ({
  activeCategory = "Electronics",
  activeIndex = 0,
  isPaused = false,
}) => {
  const [webglReady, setWebglReady] = useState(true);
  const [isRenderingActive, setIsRenderingActive] = useState(true);
  const stageRef = useRef(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebglReady(false);
    } catch {
      setWebglReady(false);
    }
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const supportsContentVisibility =
      typeof document !== "undefined" &&
      "contentVisibility" in document.documentElement.style;

    // contentvisibilityautostatechange does not bubble reliably across all browsers.
    const handleVisibilityChange = (event) => {
      setIsRenderingActive(!event.skipped);
    };

    if (supportsContentVisibility) {
      el.addEventListener(
        "contentvisibilityautostatechange",
        handleVisibilityChange
      );
    }

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              if (!supportsContentVisibility) {
                setIsRenderingActive(entry.isIntersecting);
              } else if (entry.isIntersecting) {
                setIsRenderingActive(true);
              }
            },
            { rootMargin: "120px" }
          )
        : null;

    observer?.observe(el);

    return () => {
      if (supportsContentVisibility) {
        el.removeEventListener(
          "contentvisibilityautostatechange",
          handleVisibilityChange
        );
      }
      observer?.disconnect();
    };
  }, []);

  if (!webglReady) {
    return <PedestalStageFallback />;
  }

  const shouldAnimate = isRenderingActive && !isPaused;

  return (
    <WebGLErrorBoundary fallback={<PedestalStageFallback />}>
      <div
        ref={stageRef}
        className="bazaro-heavy-stage pointer-events-none absolute inset-0 w-full h-full"
      >
        <Canvas
          frameloop={shouldAnimate ? "always" : "demand"}
          camera={{ position: [0, 0.25, 5.9], fov: 42 }}
          dpr={[1, 1.75]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
        >
          <ambientLight intensity={0.65} color="#FAF5EB" />
          <directionalLight
            position={[4, 6, 5]}
            intensity={2.6}
            color="#FFE7A3"
          />
          <directionalLight
            position={[-4, 2, 3]}
            intensity={1.3}
            color="#C59B4B"
          />
          <pointLight
            position={[0, -0.8, 2.2]}
            intensity={2.2}
            color="#E5C77A"
          />

          <RoyalPedestalStage
            activeCategory={activeCategory}
            activeIndex={activeIndex}
            isPaused={!shouldAnimate}
          />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};

export default HeroScene3D;
