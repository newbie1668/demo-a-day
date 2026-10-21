"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import * as THREE from "three";
import { LONDON_CITY, type CityBuilding, type CityLandmark } from "@/lib/london-city";
import { DISTRICTS, districtIdFromIndex, type DistrictId } from "@/lib/london-districts";

export type Mood = "dusk" | "day";
export type LondonVariant = "hero" | "demo";
export type CameraPose = "vista" | "district";

export type ZoomTick = {
  dir: 1 | -1;
  n: number;
};

type SceneProps = {
  variant: LondonVariant;
  selectedId: DistrictId;
  hoveredId: DistrictId | null;
  mood: Mood;
  pose: CameraPose;
  zoomTick: ZoomTick | null;
  resetTick: number;
  onSelect: (id: DistrictId) => void;
  onHover: (id: DistrictId | null) => void;
  onReady: () => void;
};

const DUSK = {
  bg: "#0c1018",
  fog: "#10151e",
  fogNear: 420,
  fogFar: 7800,
  hemiSky: "#3d4e68",
  hemiGround: "#1a1714",
  sun: "#ffb070",
  sunPos: [-900, 420, 200] as const,
  sunInt: 1.7,
  river: "#4aa3b4",
  park: "#243f2e",
  ground: "#1a1f28",
};

const DAY = {
  bg: "#9eb6c8",
  fog: "#b7c6d4",
  fogNear: 1400,
  fogFar: 11000,
  hemiSky: "#d7e5f2",
  hemiGround: "#8a8478",
  sun: "#fff1d0",
  sunPos: [700, 1100, 500] as const,
  sunInt: 2.2,
  river: "#4f96aa",
  park: "#4a6d42",
  ground: "#7f7a70",
};

const VISTA_TARGET = new THREE.Vector3(4680, 16, 300);
const VISTA_POSITION = {
  hero: new THREE.Vector3(6380, 300, 480),
  demo: new THREE.Vector3(6240, 280, 430),
};

const DISTRICT_OFFSET = new THREE.Vector3(480, 340, 980);

function palette(mood: Mood) {
  switch (mood) {
    case "dusk":
      return DUSK;
    case "day":
      return DAY;
    default: {
      const _exhaustive: never = mood;
      return _exhaustive;
    }
  }
}

function riverWidth(x: number, z: number) {
  const dx = x - 5000;
  const dz = z - 400;
  return Math.hypot(dx, dz) < 2800 ? 420 : 260;
}

function makeWindowMaterial(night: boolean, highlight: boolean, base: string) {
  const wall = new THREE.Color(base).multiplyScalar(night ? 0.42 : 0.78);
  const material = new THREE.MeshStandardMaterial({
    color: wall,
    roughness: night ? 0.44 : 0.56,
    metalness: night ? 0.22 : 0.1,
    emissive: new THREE.Color(highlight ? "#c9a56a" : night ? "#120e0a" : "#000000"),
    emissiveIntensity: highlight ? 0.55 : night ? 0.06 : 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = { value: night ? 1 : 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vBuildingPos;
         varying vec3 vBuildingNormal;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vec3 instScale = vec3(1.0);
         #ifdef USE_INSTANCING
           instScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
         #endif
         vBuildingPos = position * instScale;
         vBuildingNormal = normal;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uNight;
         varying vec3 vBuildingPos;
         varying vec3 vBuildingNormal;`,
      )
      .replace(
        "#include <opaque_fragment>",
        `if (uNight > 0.5 && abs(vBuildingNormal.y) < 0.35) {
           vec2 grid = vec2(vBuildingPos.x + vBuildingPos.z, vBuildingPos.y) * 0.22;
           vec2 cell = floor(grid);
           vec2 f = fract(grid);
           float n = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
           float lit = step(0.34, n);
           float windowPane = step(0.2, f.x) * step(f.x, 0.8) * step(0.16, f.y) * step(f.y, 0.84);
           outgoingLight += vec3(1.0, 0.84, 0.52) * windowPane * lit * 0.55;
         }
         #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => `windows-${night ? "n" : "d"}-${highlight ? "h" : "x"}-${base}`;
  return material;
}

function Ground({ mood }: { mood: Mood }) {
  const colors = palette(mood);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[1200, 0, 200]}>
      <circleGeometry args={[14000, 80]} />
      <meshStandardMaterial color={colors.ground} roughness={0.96} metalness={0} />
    </mesh>
  );
}

function Horizon({ mood }: { mood: Mood }) {
  const band = mood === "dusk" ? "#c56a3a" : "#d5e4f0";
  const sky = mood === "dusk" ? "#121722" : "#9eb6c8";
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[9800, 9800, 1800, 48, 1, true]} />
        <meshBasicMaterial color={sky} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 40, 0]}>
        <cylinderGeometry args={[9700, 9700, 220, 48, 1, true]} />
        <meshBasicMaterial color={band} side={THREE.BackSide} transparent opacity={mood === "dusk" ? 0.42 : 0.22} />
      </mesh>
    </group>
  );
}

function River({ mood }: { mood: Mood }) {
  const colors = palette(mood);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(() => {
    const points = LONDON_CITY.river;
    const verts: number[] = [];
    const index: number[] = [];
    for (let i = 0; i < points.length; i += 1) {
      const [x, z] = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const dx = next[0] - prev[0];
      const dz = next[1] - prev[1];
      const len = Math.hypot(dx, dz) || 1;
      const half = riverWidth(x, z) * 0.5;
      const nx = (-dz / len) * half;
      const nz = (dx / len) * half;
      verts.push(x + nx, 2.2, z + nz, x - nx, 2.2, z - nz);
    }
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(index);
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
  }, []);

  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
    const pulse = Math.sin(clock.elapsedTime * 0.45) * 0.1;
    mat.emissiveIntensity = mood === "dusk" ? 0.95 + pulse : 0.22 + pulse * 0.4;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <meshStandardMaterial
        ref={materialRef}
        color={colors.river}
        roughness={0.16}
        metalness={0.58}
        emissive={mood === "dusk" ? "#2a8a9c" : "#133844"}
        emissiveIntensity={mood === "dusk" ? 0.95 : 0.22}
      />
    </mesh>
  );
}

function Docks({ mood }: { mood: Mood }) {
  const colors = palette(mood);
  return (
    <group>
      {LONDON_CITY.docks.map((poly, i) => {
        const shape = new THREE.Shape();
        poly.forEach(([x, z], idx) => {
          if (idx === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]} frustumCulled={false}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial
              color={colors.river}
              roughness={0.18}
              metalness={0.5}
              emissive={mood === "dusk" ? "#1a5a68" : "#000000"}
              emissiveIntensity={mood === "dusk" ? 0.45 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Parks({ mood }: { mood: Mood }) {
  const colors = palette(mood);
  return (
    <group>
      {LONDON_CITY.parks.map((park, i) => (
        <mesh key={i} position={[park.x, 0.5, park.z]} rotation={[-Math.PI / 2, 0, park.r]} receiveShadow>
          <circleGeometry args={[Math.max(park.w, park.d) * 0.48, 24]} />
          <meshStandardMaterial color={colors.park} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function Gherkin({ item, mood }: { item: CityLandmark; mood: Mood }) {
  const geometry = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(18, item.h * 0.04),
      new THREE.Vector2(30, item.h * 0.16),
      new THREE.Vector2(34, item.h * 0.42),
      new THREE.Vector2(26, item.h * 0.72),
      new THREE.Vector2(13, item.h * 0.92),
      new THREE.Vector2(2.8, item.h),
    ];
    return new THREE.LatheGeometry(pts, 28);
  }, [item.h]);
  return (
    <mesh geometry={geometry} position={[item.x, 0, item.z]} castShadow>
      <meshStandardMaterial
        color={mood === "dusk" ? "#8ea89c" : "#c5d4cb"}
        metalness={0.72}
        roughness={0.16}
        emissive={mood === "dusk" ? "#24332c" : "#000000"}
        emissiveIntensity={mood === "dusk" ? 0.28 : 0}
      />
    </mesh>
  );
}

function LandmarkMesh({ item, mood }: { item: CityLandmark; mood: Mood }) {
  const glass = mood === "dusk" ? "#c5d0dc" : "#d9e2ea";
  const stone = mood === "dusk" ? "#d2c6b0" : "#e6decc";
  switch (item.kind) {
    case "shard":
      return (
        <mesh position={[item.x, item.h / 2, item.z]} castShadow>
          <coneGeometry args={[38, item.h, 4]} />
          <meshStandardMaterial color={glass} metalness={0.78} roughness={0.14} />
        </mesh>
      );
    case "gherkin":
      return <Gherkin item={item} mood={mood} />;
    case "tower":
      return (
        <group position={[item.x, 0, item.z]}>
          <mesh position={[0, item.h * 0.46, 0]} castShadow>
            <boxGeometry args={[48, item.h * 0.92, 48]} />
            <meshStandardMaterial color={glass} metalness={0.62} roughness={0.2} />
          </mesh>
          <mesh position={[0, item.h * 0.96, 0]} castShadow>
            <coneGeometry args={[24, item.h * 0.12, 4]} />
            <meshStandardMaterial color={stone} metalness={0.35} roughness={0.38} />
          </mesh>
        </group>
      );
    case "eye":
      return (
        <group position={[item.x, 72, item.z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[68, 3.6, 10, 48]} />
            <meshStandardMaterial color={stone} metalness={0.55} roughness={0.28} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} rotation={[(i / 8) * Math.PI, 0, 0]}>
              <boxGeometry args={[2, 136, 2]} />
              <meshStandardMaterial color={stone} />
            </mesh>
          ))}
        </group>
      );
    case "bridge":
      return (
        <group position={[item.x, 0, item.z]}>
          <mesh position={[0, 12, 0]}>
            <boxGeometry args={[40, 4, 280]} />
            <meshStandardMaterial color={stone} roughness={0.55} />
          </mesh>
          {item.id === "tower-bridge" ? (
            <>
              <mesh position={[0, 42, -48]} castShadow>
                <boxGeometry args={[22, 84, 22]} />
                <meshStandardMaterial color="#8f3d3d" roughness={0.48} />
              </mesh>
              <mesh position={[0, 42, 48]} castShadow>
                <boxGeometry args={[22, 84, 22]} />
                <meshStandardMaterial color="#8f3d3d" roughness={0.48} />
              </mesh>
              <mesh position={[0, 78, 0]}>
                <boxGeometry args={[10, 6, 96]} />
                <meshStandardMaterial color="#8f3d3d" roughness={0.48} />
              </mesh>
            </>
          ) : null}
        </group>
      );
    case "spire":
      return (
        <group position={[item.x, 0, item.z]}>
          <mesh position={[0, item.h * 0.32, 0]} castShadow>
            <cylinderGeometry args={[18, 22, item.h * 0.64, 12]} />
            <meshStandardMaterial color={stone} roughness={0.48} />
          </mesh>
          <mesh position={[0, item.h * 0.78, 0]} castShadow>
            <coneGeometry args={[14, item.h * 0.48, 8]} />
            <meshStandardMaterial color={stone} metalness={0.25} roughness={0.4} />
          </mesh>
        </group>
      );
    default: {
      const _exhaustive: never = item.kind;
      return _exhaustive;
    }
  }
}

function BuildingGroup({
  list,
  districtIndex,
  mood,
  active,
  onSelect,
  onHover,
}: {
  list: CityBuilding[];
  districtIndex: number;
  mood: Mood;
  active: boolean;
  onSelect: (id: DistrictId) => void;
  onHover: (id: DistrictId | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const district = DISTRICTS[districtIndex - 1];
  const base = district ? (mood === "dusk" ? district.color : district.accent) : mood === "dusk" ? "#4a5160" : "#8d8a84";
  const material = useMemo(() => makeWindowMaterial(mood === "dusk", active, base), [mood, active, base]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    list.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, b.r, 0);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(base);
      if (b.h > 70) color.lerp(new THREE.Color(mood === "dusk" ? "#8a97a8" : "#c5ced8"), 0.45);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [base, list, mood]);

  if (list.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, list.length]}
      material={material}
      receiveShadow
      frustumCulled={false}
      onClick={(event) => {
        event.stopPropagation();
        const id = districtIdFromIndex(districtIndex);
        if (id) onSelect(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        const id = districtIdFromIndex(districtIndex);
        if (id) onHover(id);
        document.body.style.cursor = id ? "pointer" : "default";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "default";
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function CityMassing({
  mood,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  mood: Mood;
  selectedId: DistrictId;
  hoveredId: DistrictId | null;
  onSelect: (id: DistrictId) => void;
  onHover: (id: DistrictId | null) => void;
}) {
  const groups = useMemo(() => {
    const byK: CityBuilding[][] = Array.from({ length: 9 }, () => []);
    for (const building of LONDON_CITY.buildings) {
      const k = building.k >= 0 && building.k < 9 ? building.k : 0;
      byK[k].push(building);
    }
    return byK;
  }, []);

  return (
    <group>
      {groups.map((list, k) => (
        <BuildingGroup
          key={k}
          list={list}
          districtIndex={k}
          mood={mood}
          active={
            (hoveredId !== null && DISTRICTS[k - 1]?.id === hoveredId) || DISTRICTS[k - 1]?.id === selectedId
          }
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function Lights({ mood }: { mood: Mood }) {
  const colors = palette(mood);
  return (
    <>
      <hemisphereLight args={[colors.hemiSky, colors.hemiGround, mood === "dusk" ? 0.48 : 0.88]} />
      <directionalLight
        color={colors.sun}
        position={[...colors.sunPos]}
        intensity={colors.sunInt}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={40}
        shadow-camera-far={7000}
        shadow-camera-left={-2200}
        shadow-camera-right={2200}
        shadow-camera-top={2200}
        shadow-camera-bottom={-2200}
      />
      {mood === "dusk" ? (
        <>
          <pointLight position={[4550, 180, 80]} color="#ffb25a" intensity={160} distance={1100} />
          <pointLight position={[80, 160, -80]} color="#9bbcff" intensity={80} distance={900} />
          <pointLight position={[-3200, 140, -200]} color="#ffd09a" intensity={60} distance={800} />
        </>
      ) : (
        <ambientLight intensity={0.24} />
      )}
    </>
  );
}

function districtPoint(id: DistrictId) {
  const row = LONDON_CITY.districts.find((d) => d.id === id);
  const k = row?.k ?? 0;
  const members = LONDON_CITY.buildings.filter((b) => b.k === k);
  if (members.length > 0) {
    const x = members.reduce((sum, b) => sum + b.x, 0) / members.length;
    const z = members.reduce((sum, b) => sum + b.z, 0) / members.length;
    const tallest = members.reduce((h, b) => Math.max(h, b.h), 20);
    return new THREE.Vector3(x, Math.min(tallest * 0.18, 40), z);
  }
  return new THREE.Vector3(row?.x ?? 0, 36, row?.z ?? 0);
}

type OrbitApi = {
  target: THREE.Vector3;
  update: () => void;
  dollyIn: (scale: number) => void;
  dollyOut: (scale: number) => void;
};

function Rig({
  variant,
  selectedId,
  pose,
  zoomTick,
  resetTick,
}: {
  variant: LondonVariant;
  selectedId: DistrictId;
  pose: CameraPose;
  zoomTick: ZoomTick | null;
  resetTick: number;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const desiredTarget = useRef(VISTA_TARGET.clone());
  const desiredPos = useRef(VISTA_POSITION[variant].clone());
  const flyFrames = useRef(0);

  useEffect(() => {
    if (variant === "hero" || pose === "vista") {
      desiredTarget.current.copy(VISTA_TARGET);
      desiredPos.current.copy(VISTA_POSITION[variant]);
      return;
    }
    const look = districtPoint(selectedId);
    desiredTarget.current.copy(look);
    desiredPos.current.copy(look).add(DISTRICT_OFFSET);
    flyFrames.current = 90;
  }, [pose, selectedId, variant]);

  useEffect(() => {
    desiredTarget.current.copy(VISTA_TARGET);
    desiredPos.current.copy(VISTA_POSITION[variant]);
    camera.position.copy(VISTA_POSITION[variant]);
    const ctrl = controls.current as unknown as OrbitApi | null;
    if (ctrl) {
      ctrl.target.copy(VISTA_TARGET);
      ctrl.update();
    }
  }, [camera, resetTick, variant]);

  useEffect(() => {
    const ctrl = controls.current as unknown as OrbitApi | null;
    if (!zoomTick || !ctrl) return;
    if (zoomTick.dir === 1) ctrl.dollyIn(1.16);
    else ctrl.dollyOut(1.16);
    ctrl.update();
  }, [zoomTick]);

  useFrame(() => {
    const ctrl = controls.current as unknown as OrbitApi | null;
    if (!ctrl) return;
    ctrl.target.lerp(desiredTarget.current, 0.07);
    if (variant === "demo" && flyFrames.current > 0) {
      camera.position.lerp(desiredPos.current, 0.06);
      flyFrames.current -= 1;
    }
    ctrl.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      autoRotate={variant === "hero"}
      autoRotateSpeed={0.28}
      minDistance={240}
      maxDistance={4200}
      minPolarAngle={0.5}
      maxPolarAngle={Math.PI / 2.12}
      enablePan={variant === "demo"}
    />
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current) return;
    frames.current += 1;
    if (frames.current < 3) return;
    sent.current = true;
    onReady();
  });
  return null;
}

function World(props: SceneProps) {
  const colors = palette(props.mood);
  return (
    <>
      <color attach="background" args={[colors.bg]} />
      <fog attach="fog" args={[colors.fog, colors.fogNear, colors.fogFar]} />
      <Horizon mood={props.mood} />
      <Lights mood={props.mood} />
      <Ground mood={props.mood} />
      <River mood={props.mood} />
      <Docks mood={props.mood} />
      <Parks mood={props.mood} />
      <CityMassing
        mood={props.mood}
        selectedId={props.selectedId}
        hoveredId={props.hoveredId}
        onSelect={props.onSelect}
        onHover={props.onHover}
      />
      {LONDON_CITY.landmarks.map((item) => (
        <LandmarkMesh key={item.id} item={item} mood={props.mood} />
      ))}
      <Rig
        variant={props.variant}
        selectedId={props.selectedId}
        pose={props.pose}
        zoomTick={props.zoomTick}
        resetTick={props.resetTick}
      />
      <Ready onReady={props.onReady} />
    </>
  );
}

function startCamera(variant: LondonVariant): [number, number, number] {
  const pos = VISTA_POSITION[variant];
  return [pos.x, pos.y, pos.z];
}

export function LondonCanvas(props: SceneProps) {
  const start = startCamera(props.variant);
  return (
    <Canvas
      data-testid="london-canvas"
      camera={{ position: start, fov: props.variant === "hero" ? 42 : 38, near: 2, far: 16000 }}
      dpr={1}
      shadows
      className="h-full w-full"
      style={{ touchAction: "none" }}
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = props.mood === "dusk" ? 1.08 : 1.18;
        camera.lookAt(VISTA_TARGET);
      }}
      onPointerMissed={() => props.onHover(null)}
    >
      <World {...props} />
    </Canvas>
  );
}
