
import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { DragControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/DragControls.js";

const config = window.CONFIG || {};
const containerSizes = config.containerSizes || [];
const catalog = config.catalog || [];
const insulationOptions = config.insulationOptions || [];
const defaultSize =
  containerSizes.find((size) => size.id === "40ft") || containerSizes[0];

let containerLength = defaultSize?.lengthUnits ?? 12;
let containerWidth = defaultSize?.widthUnits ?? 5;
let containerHeight = defaultSize?.heightUnits ?? 5;
const wallThickness = 0.2;

const canvas = document.getElementById("threeStage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f2efe7");

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
camera.position.set(10, 8, 12);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(12, 18, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
fillLight.position.set(-10, 6, -6);
scene.add(fillLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 30),
  new THREE.MeshStandardMaterial({ color: "#e8e1d4", roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.11;
ground.receiveShadow = true;
scene.add(ground);

const containerGroup = new THREE.Group();
scene.add(containerGroup);

const staticGroup = new THREE.Group();
const insulationGroup = new THREE.Group();
const wallsGroup = new THREE.Group();
const windowsGroup = new THREE.Group();
const itemsGroup = new THREE.Group();
containerGroup.add(staticGroup, insulationGroup, wallsGroup, windowsGroup, itemsGroup);

const disposeMesh = (mesh) => {
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => mat.dispose());
    } else {
      mesh.material.dispose();
    }
  }
};

const clearGroup = (group) => {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse((node) => {
      if (node.isMesh) disposeMesh(node);
    });
  }
};

const parseColorAlpha = (input, fallbackAlpha = 1) => {
  if (typeof input !== "string") {
    return { color: "#cccccc", alpha: fallbackAlpha };
  }
  if (input.startsWith("rgba")) {
    const match = input.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
    if (match) {
      const [, r, g, b, a] = match;
      return {
        color: new THREE.Color(Number(r) / 255, Number(g) / 255, Number(b) / 255),
        alpha: Number(a)
      };
    }
  }
  return { color: input, alpha: fallbackAlpha };
};

const createBox = ({ w, h, d, color, alpha = 1, roughness = 0.6, metalness = 0.1 }) => {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent: alpha < 1,
    opacity: alpha
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const buildStaticContainer = () => {
  clearGroup(staticGroup);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(containerLength, 0.2, containerWidth),
    new THREE.MeshStandardMaterial({ color: "#efe7da", roughness: 0.9 })
  );
  floor.position.y = 0;
  floor.receiveShadow = true;
  staticGroup.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({
    color: "#bfa98a",
    transparent: true,
    opacity: 0.4,
    roughness: 0.65,
    metalness: 0.1
  });

  const wallBack = new THREE.Mesh(
    new THREE.BoxGeometry(containerLength - wallThickness * 2, containerHeight, wallThickness),
    wallMat
  );
  wallBack.position.set(0, containerHeight / 2, -(containerWidth / 2 - wallThickness / 2));
  wallBack.castShadow = true;
  staticGroup.add(wallBack);

  const wallFront = new THREE.Mesh(
    new THREE.BoxGeometry(containerLength - wallThickness * 2, containerHeight, wallThickness),
    wallMat
  );
  wallFront.position.set(0, containerHeight / 2, containerWidth / 2 - wallThickness / 2);
  wallFront.castShadow = true;
  staticGroup.add(wallFront);

  const wallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, containerHeight, containerWidth - wallThickness * 2),
    wallMat
  );
  wallLeft.position.set(-(containerLength / 2 - wallThickness / 2), containerHeight / 2, 0);
  wallLeft.castShadow = true;
  staticGroup.add(wallLeft);

  const wallRight = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, containerHeight, containerWidth - wallThickness * 2),
    wallMat
  );
  wallRight.position.set(containerLength / 2 - wallThickness / 2, containerHeight / 2, 0);
  wallRight.castShadow = true;
  staticGroup.add(wallRight);

  const grid = new THREE.GridHelper(containerLength, containerLength, "#cbbfae", "#e2dbcf");
  grid.position.y = 0.01;
  staticGroup.add(grid);
};

const buildInsulation = (insulation) => {
  clearGroup(insulationGroup);
  if (!insulation || !insulation.thickness) return;

  const t = insulation.thickness;
  const parsed = parseColorAlpha(insulation.color, 0.35);
  const mat = {
    color: parsed.color,
    alpha: parsed.alpha,
    roughness: 0.8,
    metalness: 0
  };

  const front = createBox({
    w: containerLength - t * 2,
    h: containerHeight,
    d: t,
    ...mat
  });
  front.position.set(0, containerHeight / 2, containerWidth / 2 - t / 2);
  insulationGroup.add(front);

  const back = createBox({
    w: containerLength - t * 2,
    h: containerHeight,
    d: t,
    ...mat
  });
  back.position.set(0, containerHeight / 2, -(containerWidth / 2 - t / 2));
  insulationGroup.add(back);

  const left = createBox({
    w: t,
    h: containerHeight,
    d: containerWidth - t * 2,
    ...mat
  });
  left.position.set(-(containerLength / 2 - t / 2), containerHeight / 2, 0);
  insulationGroup.add(left);

  const right = createBox({
    w: t,
    h: containerHeight,
    d: containerWidth - t * 2,
    ...mat
  });
  right.position.set(containerLength / 2 - t / 2, containerHeight / 2, 0);
  insulationGroup.add(right);
};

const syncItems = (items) => {
  clearGroup(itemsGroup);
  items.forEach((item) => {
    const mesh = createBox({
      w: item.w,
      h: item.h,
      d: item.d,
      color: item.color || "#d24b3f",
      alpha: 1,
      roughness: 0.6,
      metalness: 0.15
    });
    mesh.position.set(
      item.x + item.w / 2 - containerLength / 2,
      item.h / 2,
      item.y + item.d / 2 - containerWidth / 2
    );
    itemsGroup.add(mesh);
  });
};

const syncWalls = (walls) => {
  clearGroup(wallsGroup);
  walls.forEach((wall, index) => {
    const orientation = wall.orientation || "x";
    const w = orientation === "y" ? wallThickness : wall.length;
    const d = orientation === "y" ? wall.length : wallThickness;
    const mesh = createBox({
      w,
      h: wall.h || containerHeight,
      d,
      color: wall.color || "#c3b7aa",
      alpha: wall.alpha ?? 0.6,
      roughness: 0.7,
      metalness: 0.05
    });
    mesh.position.set(
      wall.x + w / 2 - containerLength / 2,
      (wall.h || containerHeight) / 2,
      wall.y + d / 2 - containerWidth / 2
    );
    mesh.userData = {
      wallIndex: index,
      w,
      d,
      h: wall.h || containerHeight
    };
    wallsGroup.add(mesh);
  });
};

const syncWindows = (windows) => {
  clearGroup(windowsGroup);
  windows.forEach((win) => {
    const parsed = parseColorAlpha(win.color, 0.6);
    const mesh = createBox({
      w: win.w,
      h: win.h,
      d: Math.max(wallThickness / 3, 0.06),
      color: parsed.color,
      alpha: parsed.alpha,
      roughness: 0.2,
      metalness: 0
    });
    mesh.position.set(
      win.x + win.w / 2 - containerLength / 2,
      win.z + win.h / 2,
      win.y + win.d - containerWidth / 2 - mesh.geometry.parameters.depth / 2
    );
    windowsGroup.add(mesh);
  });
};

const setContainerSize = (size) => {
  containerLength = size?.lengthUnits ?? containerLength;
  containerWidth = size?.widthUnits ?? containerWidth;
  containerHeight = size?.heightUnits ?? containerHeight;
  buildStaticContainer();
};

let dragControls = null;
let draggableWalls = [];
let lastValidPositions = new Map();
let activeWallIndex = null;
let isEditingWalls = false;

const clampWallToContainer = (mesh) => {
  const halfL = containerLength / 2 - wallThickness;
  const halfW = containerWidth / 2 - wallThickness;
  const w = mesh.userData.w || mesh.geometry.parameters.width;
  const d = mesh.userData.d || mesh.geometry.parameters.depth;
  const minX = -halfL + w / 2;
  const maxX = halfL - w / 2;
  const minZ = -halfW + d / 2;
  const maxZ = halfW - d / 2;
  mesh.position.x = Math.min(Math.max(mesh.position.x, minX), maxX);
  mesh.position.z = Math.min(Math.max(mesh.position.z, minZ), maxZ);
  mesh.position.y = (mesh.userData.h || mesh.geometry.parameters.height) / 2;
};

const isOverlapping = (a, b) => {
  const aw = a.userData.w || a.geometry.parameters.width;
  const ad = a.userData.d || a.geometry.parameters.depth;
  const bw = b.userData.w || b.geometry.parameters.width;
  const bd = b.userData.d || b.geometry.parameters.depth;
  return (
    Math.abs(a.position.x - b.position.x) < aw / 2 + bw / 2 &&
    Math.abs(a.position.z - b.position.z) < ad / 2 + bd / 2
  );
};

const updateWallDrag = () => {
  if (dragControls) {
    dragControls.dispose();
    dragControls = null;
  }
  if (!isEditingWalls || activeWallIndex === null) return;
  const target = wallsGroup.children.find(
    (mesh) => mesh.userData.wallIndex === activeWallIndex
  );
  if (!target) return;
  draggableWalls = [target];
  lastValidPositions = new Map([[target, target.position.clone()]]);
  dragControls = new DragControls(draggableWalls, camera, renderer.domElement);
  dragControls.addEventListener("dragstart", () => {
    controls.enabled = false;
  });
  dragControls.addEventListener("drag", (event) => {
    const obj = event.object;
    clampWallToContainer(obj);
    const blocked = wallsGroup.children.some(
      (other) => other !== obj && isOverlapping(obj, other)
    );
    if (blocked) {
      const fallback = lastValidPositions.get(obj);
      if (fallback) {
        obj.position.copy(fallback);
      }
    } else {
      lastValidPositions.set(obj, obj.position.clone());
    }
  });
  dragControls.addEventListener("dragend", (event) => {
    controls.enabled = true;
    const obj = event.object;
    clampWallToContainer(obj);
    const w = obj.userData.w || obj.geometry.parameters.width;
    const d = obj.userData.d || obj.geometry.parameters.depth;
    const snappedX = Math.round(obj.position.x + containerLength / 2 - w / 2);
    const snappedY = Math.round(obj.position.z + containerWidth / 2 - d / 2);
    obj.position.x = snappedX + w / 2 - containerLength / 2;
    obj.position.z = snappedY + d / 2 - containerWidth / 2;
    clampWallToContainer(obj);
    lastValidPositions.set(obj, obj.position.clone());
    window.dispatchEvent(
      new CustomEvent("wall-moved", {
        detail: { index: obj.userData.wallIndex, x: snappedX, y: snappedY }
      })
    );
  });
};

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 8;
controls.maxDistance = 28;
controls.target.set(0, 2, 0);
controls.update();

const resize = () => {
  const rect = canvas.parentElement?.getBoundingClientRect();
  const width = rect?.width || window.innerWidth;
  const height = rect?.height || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

window.addEventListener("resize", resize);
resize();

const currentState = {
  containerSizeId: defaultSize?.id,
  items: [],
  walls: [],
  windows: [],
  insulation: insulationOptions[0],
  selectedWallIndex: null,
  editingWalls: false
};

const sync = (state) => {
  const nextState = { ...currentState, ...state };
  const size = containerSizes.find((entry) => entry.id === nextState.containerSizeId) || defaultSize;
  if (size && size.id !== currentState.containerSizeId) {
    setContainerSize(size);
  }
  buildInsulation(nextState.insulation);
  syncWalls(nextState.walls || []);
  syncWindows(nextState.windows || []);
  syncItems(nextState.items || []);
  isEditingWalls = nextState.editingWalls === true;
  activeWallIndex =
    Number.isFinite(nextState.selectedWallIndex) ? nextState.selectedWallIndex : null;
  updateWallDrag();
  currentState.containerSizeId = size?.id;
  currentState.items = nextState.items || [];
  currentState.walls = nextState.walls || [];
  currentState.windows = nextState.windows || [];
  currentState.insulation = nextState.insulation;
  currentState.selectedWallIndex = activeWallIndex;
  currentState.editingWalls = isEditingWalls;
  resize();
};

buildStaticContainer();

const seedItems = catalog.slice(0, 3).map((item, index) => ({
  ...item,
  x: 1 + index * 2,
  y: 1 + index,
  w: item.w,
  d: item.d,
  h: item.h
}));

sync({
  containerSizeId: defaultSize?.id,
  items: seedItems,
  walls: [],
  windows: [],
  insulation: insulationOptions[0],
  selectedWallIndex: null,
  editingWalls: false
});

window.threeApi = { sync };
if (window.pendingThreeSync) {
  sync(window.pendingThreeSync);
  window.pendingThreeSync = null;
}

const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};

animate();
