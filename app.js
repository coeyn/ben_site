const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const containerSizes = [
  {
    id: "20ft",
    label: "20 pieds - 6.05 m x 2.43 m",
    lengthUnits: 6,
    widthUnits: 5,
    heightUnits: 5,
    lengthMeters: 6.05,
    widthMeters: 2.43,
    heightMeters: 2.59
  },
  {
    id: "40ft",
    label: "40 pieds - 12.19 m x 2.43 m",
    lengthUnits: 12,
    widthUnits: 5,
    heightUnits: 5,
    lengthMeters: 12.19,
    widthMeters: 2.43,
    heightMeters: 2.59
  }
];

const grid = {
  length: containerSizes[1].lengthUnits,
  width: containerSizes[1].widthUnits,
  height: containerSizes[1].heightUnits,
  tileW: 54,
  tileH: 28,
  heightScale: 18
};

const origin = {
  x: canvas.width / 2,
  y: 180
};

const catalog = [
  { id: "desk", name: "Bureau compact", w: 3, d: 2, h: 2, price: 320, color: "#c9a27c" },
  { id: "sofa", name: "Canape droit", w: 4, d: 2, h: 2, price: 680, color: "#9c6b5a" },
  { id: "shelf", name: "Etagere metal", w: 2, d: 1, h: 3, price: 210, color: "#8b8f95" },
  { id: "bed", name: "Lit simple", w: 4, d: 2, h: 2, price: 520, color: "#9e8b6a" },
  { id: "kitchen", name: "Bloc kitchenette", w: 4, d: 2, h: 3, price: 940, color: "#7f6d5a" },
  { id: "light", name: "Suspension", w: 1, d: 1, h: 1, price: 95, color: "#e7c36a" }
];

const wallOptions = [
  { id: "steel", name: "Mur acier plein", w: 4, price: 1200, color: "#c3b7aa", alpha: 0.6 },
  { id: "glass", name: "Mur vitrine", w: 4, price: 1600, color: "#d7c7b4", alpha: 0.5 }
];

const windowOptions = [
  { id: "fixed", name: "Fenetre fixe", w: 2, h: 2, z: 1.5, price: 350, color: "rgba(140,180,210,0.5)" },
  { id: "bay", name: "Baie vitree", w: 4, h: 3, z: 1, price: 900, color: "rgba(120,170,200,0.45)" }
];

const insulationOptions = [
  {
    id: "none",
    label: "Sans isolation",
    thickness: 0,
    color: "rgba(184,171,156,0.15)"
  },
  {
    id: "foam",
    label: "Isolation mousse (0.5u)",
    thickness: 0.5,
    color: "rgba(231,195,106,0.35)"
  },
  {
    id: "panel",
    label: "Isolation panneaux (1u)",
    thickness: 1,
    color: "rgba(156,132,108,0.35)"
  }
];

const state = {
  items: [],
  walls: [],
  windows: [],
  insulation: insulationOptions[1]
};

const wallDepth = 0.4;

const totalPriceEl = document.getElementById("totalPrice");
const catalogEl = document.getElementById("catalog");
const addItemEl = document.getElementById("addItem");
const itemsListEl = document.getElementById("itemsList");
const containerSizeEl = document.getElementById("containerSize");
const lengthDimEl = document.getElementById("lengthDim");
const widthDimEl = document.getElementById("widthDim");
const heightDimEl = document.getElementById("heightDim");
const insulationEl = document.getElementById("insulation");
const steps = Array.from(document.querySelectorAll(".step"));
const prevStepEl = document.getElementById("prevStep");
const nextStepEl = document.getElementById("nextStep");
const wallOptionEl = document.getElementById("wallOption");
const windowOptionEl = document.getElementById("windowOption");
const addWallEl = document.getElementById("addWall");
const addWindowEl = document.getElementById("addWindow");
const structuresListEl = document.getElementById("structuresList");

function isoPoint(x, y, z = 0) {
  return {
    x: origin.x + (x - y) * (grid.tileW / 2),
    y: origin.y + (x + y) * (grid.tileH / 2) - z * grid.heightScale
  };
}

function drawPolygon(points, fill, stroke) {
  ctx.beginPath();
  points.forEach((pt, index) => {
    if (index === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawContainer() {
  const L = grid.length;
  const W = grid.width;
  const H = grid.height;

  const floor = [
    isoPoint(0, 0, 0),
    isoPoint(L, 0, 0),
    isoPoint(L, W, 0),
    isoPoint(0, W, 0)
  ];

  const roof = [
    isoPoint(0, 0, H),
    isoPoint(L, 0, H),
    isoPoint(L, W, H),
    isoPoint(0, W, H)
  ];

  drawPolygon(floor, "#efe7da", null);
  drawPolygon(roof, "rgba(255,255,255,0.5)", null);

  drawInsulation();

  const edges = [
    [floor[0], roof[0]],
    [floor[1], roof[1]],
    [floor[2], roof[2]],
    [floor[3], roof[3]]
  ];

  return { edges, floor, roof, L, W };
}

function drawGridLines(L, W) {
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = "rgba(190,180,165,0.45)";
  for (let x = 1; x < L; x += 1) {
    const p1 = isoPoint(x, 0, 0);
    const p2 = isoPoint(x, W, 0);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let y = 1; y < W; y += 1) {
    const p1 = isoPoint(0, y, 0);
    const p2 = isoPoint(L, y, 0);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function drawInsulation() {
  const thickness = state.insulation.thickness;
  if (!thickness) return;
  const L = grid.length;
  const W = grid.width;
  const color = state.insulation.color;
  const stroke = "#cdbfae";
  const bottomBand = [
    isoPoint(0, 0, 0),
    isoPoint(L, 0, 0),
    isoPoint(L, thickness, 0),
    isoPoint(0, thickness, 0)
  ];
  const topBand = [
    isoPoint(0, W - thickness, 0),
    isoPoint(L, W - thickness, 0),
    isoPoint(L, W, 0),
    isoPoint(0, W, 0)
  ];
  const leftBand = [
    isoPoint(0, thickness, 0),
    isoPoint(thickness, thickness, 0),
    isoPoint(thickness, W - thickness, 0),
    isoPoint(0, W - thickness, 0)
  ];
  const rightBand = [
    isoPoint(L - thickness, thickness, 0),
    isoPoint(L, thickness, 0),
    isoPoint(L, W - thickness, 0),
    isoPoint(L - thickness, W - thickness, 0)
  ];
  drawPolygon(bottomBand, color, stroke);
  drawPolygon(topBand, color, stroke);
  drawPolygon(leftBand, color, stroke);
  drawPolygon(rightBand, color, stroke);
}

function shade(color, percent) {
  const num = parseInt(color.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = ((num >> 8) & 0x00ff) + amt;
  const b = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (r < 255 ? (r < 1 ? 0 : r) : 255) * 0x10000 +
      (g < 255 ? (g < 1 ? 0 : g) : 255) * 0x100 +
      (b < 255 ? (b < 1 ? 0 : b) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

function drawItemBox(item) {
  const { x, y, w, d, h, color } = item;
  const base = [
    isoPoint(x, y, 0),
    isoPoint(x + w, y, 0),
    isoPoint(x + w, y + d, 0),
    isoPoint(x, y + d, 0)
  ];
  const top = [
    isoPoint(x, y, h),
    isoPoint(x + w, y, h),
    isoPoint(x + w, y + d, h),
    isoPoint(x, y + d, h)
  ];

  drawPolygon(base, shade(color, -5), "#bfa98a");
  drawPolygon(
    [base[1], base[2], top[2], top[1]],
    shade(color, -15),
    "#bfa98a"
  );
  drawPolygon(
    [base[2], base[3], top[3], top[2]],
    shade(color, -25),
    "#bfa98a"
  );
  drawPolygon(top, shade(color, 10), "#bfa98a");
}

function drawWallPanel(panel) {
  ctx.save();
  ctx.globalAlpha = panel.alpha ?? 0.6;
  drawItemBox(panel);
  ctx.restore();
}

function drawWindowPanel(panel) {
  const { x, w, h, z, color, y, d } = panel;
  const faceY = y + d;
  const points = [
    isoPoint(x, faceY, z),
    isoPoint(x + w, faceY, z),
    isoPoint(x + w, faceY, z + h),
    isoPoint(x, faceY, z + h)
  ];
  drawPolygon(points, color, "#95a6b3");
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { edges, floor, roof, L, W } = drawContainer();
  ctx.lineWidth = 1.3;
  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = "#b8ad99";
    ctx.stroke();
  });
  drawGridLines(L, W);
  drawPolygon(floor, null, "#d6cdbd");
  state.walls.forEach(drawWallPanel);
  state.windows.forEach(drawWindowPanel);
  state.items.forEach(drawItemBox);
  drawPolygon(roof, null, "#d6cdbd");
}

function setStep(step) {
  state.currentStep = step;
  steps.forEach((el) => {
    const isActive = Number(el.dataset.step) === step;
    el.classList.toggle("is-hidden", !isActive);
  });
  prevStepEl.disabled = step === 1;
  nextStepEl.textContent = step === 4 ? "Exporter devis" : "Suivant";
}

function updateDimensions(size) {
  lengthDimEl.textContent = `${size.lengthMeters} m (${size.lengthUnits}u)`;
  widthDimEl.textContent = `${size.widthMeters} m (${size.widthUnits}u)`;
  heightDimEl.textContent = `${size.heightMeters} m (${size.heightUnits}u)`;
}

function updateTotal() {
  const itemsTotal = state.items.reduce((sum, item) => sum + item.price, 0);
  const wallsTotal = state.walls.reduce((sum, wall) => sum + wall.price, 0);
  const windowsTotal = state.windows.reduce((sum, win) => sum + win.price, 0);
  const total = itemsTotal + wallsTotal + windowsTotal;
  totalPriceEl.textContent = `${total.toLocaleString("fr-FR")} EUR`;
}

function renderItemsList() {
  itemsListEl.innerHTML = "";
  state.items.forEach((item, index) => {
    const li = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "item-meta";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const details = document.createElement("span");
    details.textContent = `${item.w}u x ${item.d}u x ${item.h}u`;
    meta.appendChild(name);
    meta.appendChild(details);
    const price = document.createElement("span");
    price.textContent = `${item.price} EUR`;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "Retirer";
    remove.addEventListener("click", () => {
      state.items.splice(index, 1);
      render();
      updateTotal();
      renderItemsList();
    });

    li.appendChild(meta);
    li.appendChild(price);
    li.appendChild(remove);
    itemsListEl.appendChild(li);
  });
}

function renderStructuresList() {
  structuresListEl.innerHTML = "";
  const merged = [
    ...state.walls.map((item, index) => ({ ...item, kind: "wall", index })),
    ...state.windows.map((item, index) => ({ ...item, kind: "window", index }))
  ];
  merged.forEach((item) => {
    const li = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "item-meta";
    const name = document.createElement("strong");
    name.textContent = item.kind === "wall" ? `Mur: ${item.name}` : `Fenetre: ${item.name}`;
    const details = document.createElement("span");
    details.textContent = `${item.w}u x ${item.h}u`;
    meta.appendChild(name);
    meta.appendChild(details);
    const price = document.createElement("span");
    price.textContent = `${item.price} EUR`;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "Retirer";
    remove.addEventListener("click", () => {
      if (item.kind === "wall") {
        state.walls.splice(item.index, 1);
      } else {
        state.windows.splice(item.index, 1);
      }
      render();
      updateTotal();
      renderStructuresList();
    });

    li.appendChild(meta);
    li.appendChild(price);
    li.appendChild(remove);
    structuresListEl.appendChild(li);
  });
}

function isSpaceFree(x, y, w, d) {
  const t = state.insulation.thickness;
  if (
    x < t ||
    y < t ||
    x + w > grid.length - t ||
    y + d > grid.width - t
  ) {
    return false;
  }
  return !state.items.some((item) => {
    const xOverlap = x < item.x + item.w && x + w > item.x;
    const yOverlap = y < item.y + item.d && y + d > item.y;
    return xOverlap && yOverlap;
  });
}

function findSpot(item) {
  const t = state.insulation.thickness;
  for (let y = t; y <= grid.width - item.d - t; y += 1) {
    for (let x = t; x <= grid.length - item.w - t; x += 1) {
      if (isSpaceFree(x, y, item.w, item.d)) {
        return { x, y };
      }
    }
  }
  return null;
}

function isStructureSpaceFree(list, x, w) {
  const t = state.insulation.thickness;
  if (x < t || x + w > grid.length - t) {
    return false;
  }
  return !list.some((item) => x < item.x + item.w && x + w > item.x);
}

function findStructureSpot(list, w) {
  const t = state.insulation.thickness;
  for (let x = t; x <= grid.length - w - t; x += 1) {
    if (isStructureSpaceFree(list, x, w)) {
      return { x };
    }
  }
  return null;
}

function addItem(itemId) {
  const item = catalog.find((entry) => entry.id === itemId);
  if (!item) return;
  const spot = findSpot(item);
  if (!spot) {
    alert("Plus de place disponible pour cet element.");
    return;
  }
  state.items.push({ ...item, ...spot });
  render();
  updateTotal();
  renderItemsList();
}

function addWall(optionId) {
  const option = wallOptions.find((entry) => entry.id === optionId);
  if (!option) return;
  const spot = findStructureSpot(state.walls, option.w);
  if (!spot) {
    alert("Plus de place disponible pour ce mur.");
    return;
  }
  const t = state.insulation.thickness;
  const y = Math.max(t, grid.width - t - wallDepth);
  state.walls.push({
    ...spot,
    w: option.w,
    d: wallDepth,
    y,
    h: grid.height,
    price: option.price,
    name: option.name,
    color: option.color,
    alpha: option.alpha
  });
  render();
  updateTotal();
  renderStructuresList();
}

function addWindow(optionId) {
  const option = windowOptions.find((entry) => entry.id === optionId);
  if (!option) return;
  const spot = findStructureSpot(state.windows, option.w);
  if (!spot) {
    alert("Plus de place disponible pour cette fenetre.");
    return;
  }
  const t = state.insulation.thickness;
  const y = Math.max(t, grid.width - t - wallDepth);
  state.windows.push({
    ...spot,
    w: option.w,
    h: option.h,
    d: wallDepth,
    y,
    z: option.z,
    price: option.price,
    name: option.name,
    color: option.color
  });
  render();
  updateTotal();
  renderStructuresList();
}

function exportQuote() {
  const items = state.items.map((item) => `${item.name} (${item.price} EUR)`);
  const walls = state.walls.map((item) => `Mur: ${item.name} (${item.price} EUR)`);
  const windows = state.windows.map((item) => `Fenetre: ${item.name} (${item.price} EUR)`);
  const total =
    state.items.reduce((sum, item) => sum + item.price, 0) +
    state.walls.reduce((sum, item) => sum + item.price, 0) +
    state.windows.reduce((sum, item) => sum + item.price, 0);
  const message = [
    "Devis prototype",
    "",
    ...walls,
    ...windows,
    ...items,
    "",
    `Total: ${total} EUR`
  ].join("\n");
  alert(message);
}

function setupCatalog() {
  catalog.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.name} - ${entry.price} EUR`;
    catalogEl.appendChild(option);
  });
}

function setupWallOptions() {
  wallOptions.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.name} - ${entry.price} EUR`;
    wallOptionEl.appendChild(option);
  });
}

function setupWindowOptions() {
  windowOptions.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.name} - ${entry.price} EUR`;
    windowOptionEl.appendChild(option);
  });
}

function setupInsulationOptions() {
  insulationOptions.forEach((option) => {
    const optionEl = document.createElement("option");
    optionEl.value = option.id;
    optionEl.textContent = option.label;
    insulationEl.appendChild(optionEl);
  });
  insulationEl.value = state.insulation.id;
}

function setupContainerSizes() {
  containerSizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = size.id;
    option.textContent = size.label;
    containerSizeEl.appendChild(option);
  });
  containerSizeEl.value = containerSizes[1].id;
  updateDimensions(containerSizes[1]);
}

function applyContainerSize(sizeId) {
  const size = containerSizes.find((entry) => entry.id === sizeId);
  if (!size) return;
  grid.length = size.lengthUnits;
  grid.width = size.widthUnits;
  grid.height = size.heightUnits;
  state.items = [];
  state.walls = [];
  state.windows = [];
  updateDimensions(size);
  render();
  updateTotal();
  renderItemsList();
  renderStructuresList();
}

addItemEl.addEventListener("click", () => addItem(catalogEl.value));
addWallEl.addEventListener("click", () => addWall(wallOptionEl.value));
addWindowEl.addEventListener("click", () => addWindow(windowOptionEl.value));
containerSizeEl.addEventListener("change", () =>
  applyContainerSize(containerSizeEl.value)
);
insulationEl.addEventListener("change", () => {
  const selected = insulationOptions.find((opt) => opt.id === insulationEl.value);
  if (!selected) return;
  state.insulation = selected;
  state.items = [];
  state.walls = [];
  state.windows = [];
  render();
  updateTotal();
  renderItemsList();
  renderStructuresList();
});
prevStepEl.addEventListener("click", () => {
  if (state.currentStep > 1) {
    setStep(state.currentStep - 1);
  }
});
nextStepEl.addEventListener("click", () => {
  if (state.currentStep < 4) {
    setStep(state.currentStep + 1);
    return;
  }
  exportQuote();
});

setupCatalog();
setupContainerSizes();
setupInsulationOptions();
setupWallOptions();
setupWindowOptions();
state.currentStep = 1;
setStep(1);
render();
updateTotal();
renderStructuresList();
