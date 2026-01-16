const canvas = document.getElementById("scene");
const ctx = canvas ? canvas.getContext("2d") : null;

const { containerSizes, catalog, wallOptions, windowOptions, insulationOptions, wallDepth } = CONFIG;

const grid = {
  length: containerSizes[1].lengthUnits,
  width: containerSizes[1].widthUnits,
  height: containerSizes[1].heightUnits,
  tileW: 54,
  tileH: 28,
  heightScale: 18
};

const origin = {
  x: canvas ? canvas.width / 2 : 450,
  y: 180
};


const state = {
  items: [],
  walls: [],
  windows: [],
  insulation: insulationOptions[1],
  selectedWallIndex: null,
  editingWalls: false,
  containerSizeId: containerSizes[1]?.id || containerSizes[0]?.id
};


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
const wallLeftEl = document.getElementById("wallLeft");
const wallRightEl = document.getElementById("wallRight");
const wallUpEl = document.getElementById("wallUp");
const wallDownEl = document.getElementById("wallDown");
const wallRotateEl = document.getElementById("wallRotate");
const wallGrowEl = document.getElementById("wallGrow");
const wallShrinkEl = document.getElementById("wallShrink");

function isoPoint(x, y, z = 0) {
  return {
    x: origin.x + (x - y) * (grid.tileW / 2),
    y: origin.y + (x + y) * (grid.tileH / 2) - z * grid.heightScale
  };
}

function drawPolygon(points, fill, stroke) {
  if (!ctx) return;
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
  if (!ctx) {
    return { edges: [], floor: [], roof: [], L: grid.length, W: grid.width };
  }
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
  if (!ctx) return;
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
  if (!ctx) return;
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
  if (!ctx) return;
  const { w, d } = getWallDimensions(panel);
  ctx.save();
  ctx.globalAlpha = panel.alpha ?? 0.6;
  drawItemBox({ ...panel, w, d });
  ctx.restore();
}

function drawWindowPanel(panel) {
  if (!ctx) return;
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
  if (!ctx) return;
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
  state.items.forEach(drawItemBox);
  state.walls.forEach(drawWallPanel);
  state.windows.forEach(drawWindowPanel);
  drawPolygon(roof, null, "#d6cdbd");
}

function getWallDimensions(wall) {
  if (wall.orientation === "y") {
    return { w: wallDepth, d: wall.length };
  }
  return { w: wall.length, d: wallDepth };
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

function updateWallEditState() {
  const controls = [
    wallLeftEl,
    wallRightEl,
    wallUpEl,
    wallDownEl,
    wallRotateEl,
    wallGrowEl,
    wallShrinkEl
  ];
  controls.forEach((btn) => {
    btn.disabled = !state.editingWalls;
  });
  if (!state.editingWalls) {
    state.selectedWallIndex = null;
  }
  renderStructuresList();
  sync3d();
}

function sync3d() {
  const payload = {
    containerSizeId: state.containerSizeId,
    items: state.items,
    walls: state.walls,
    windows: state.windows,
    insulation: state.insulation,
    selectedWallIndex: state.selectedWallIndex,
    editingWalls: state.editingWalls
  };
  if (window.threeApi && typeof window.threeApi.sync === "function") {
    window.threeApi.sync(payload);
  } else {
    window.pendingThreeSync = payload;
  }
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

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const price = document.createElement("span");
    price.textContent = `${item.price} EUR`;

    const remove = document.createElement("button");
    remove.className = "remove-x";
    remove.type = "button";
    remove.setAttribute("aria-label", "Retirer");
    remove.textContent = "x";
    remove.addEventListener("click", () => {
      state.items.splice(index, 1);
      render();
      updateTotal();
      renderItemsList();
      sync3d();
    });

    actions.appendChild(price);
    li.appendChild(meta);
    li.appendChild(actions);
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
    if (item.kind === "wall" && item.index === state.selectedWallIndex && state.editingWalls) {
      li.classList.add("is-selected");
    }
    const meta = document.createElement("div");
    meta.className = "item-meta";
    const name = document.createElement("strong");
    name.textContent = item.kind === "wall" ? `Mur: ${item.name}` : `Fenetre: ${item.name}`;
    const details = document.createElement("span");
    if (item.kind === "wall") {
      details.textContent = `${item.length}u (${item.orientation === "y" ? "vertical" : "horizontal"})`;
    } else {
      details.textContent = `${item.w}u x ${item.h}u`;
    }
    meta.appendChild(name);
    meta.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const price = document.createElement("span");
    price.textContent = `${item.price} EUR`;

    const remove = document.createElement("button");
    remove.className = "remove-x";
    remove.type = "button";
    remove.setAttribute("aria-label", "Retirer");
    remove.textContent = "x";
    remove.addEventListener("click", () => {
      if (item.kind === "wall") {
        state.walls.splice(item.index, 1);
        if (state.selectedWallIndex === item.index) {
          state.selectedWallIndex = null;
        } else if (state.selectedWallIndex > item.index) {
          state.selectedWallIndex -= 1;
        }
      } else {
        state.windows.splice(item.index, 1);
      }
      render();
      updateTotal();
      renderStructuresList();
      sync3d();
    });

    if (item.kind === "wall") {
      const edit = document.createElement("button");
      edit.className = "edit-wall";
      edit.type = "button";
      edit.textContent =
        state.editingWalls && item.index === state.selectedWallIndex ? "Terminer" : "Modifier";
      edit.addEventListener("click", () => {
        if (state.editingWalls && state.selectedWallIndex === item.index) {
          state.editingWalls = false;
          state.selectedWallIndex = null;
        } else {
          state.editingWalls = true;
          state.selectedWallIndex = item.index;
        }
        updateWallEditState();
      });
      actions.appendChild(edit);
    }

    actions.appendChild(price);
    li.appendChild(meta);
    li.appendChild(actions);
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

function isWallPositionFree(x, y, length, orientation, ignoreIndex) {
  const t = state.insulation.thickness;
  const { w, d } = orientation === "y" ? { w: wallDepth, d: length } : { w: length, d: wallDepth };
  if (x < t || y < t || x + w > grid.length - t || y + d > grid.width - t) {
    return false;
  }
  return !state.walls.some((wall, index) => {
    if (index === ignoreIndex) return false;
    const other = getWallDimensions(wall);
    const xOverlap = x < wall.x + other.w && x + w > wall.x;
    const yOverlap = y < wall.y + other.d && y + d > wall.y;
    return xOverlap && yOverlap;
  });
}

function findWallSpot(length, orientation, y) {
  const { w } = orientation === "y" ? { w: wallDepth } : { w: length };
  const t = state.insulation.thickness;
  for (let x = t; x <= grid.length - w - t; x += 1) {
    if (isWallPositionFree(x, y, length, orientation, null)) {
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
  sync3d();
}

function addWall(optionId) {
  const option = wallOptions.find((entry) => entry.id === optionId);
  if (!option) return;
  const t = state.insulation.thickness;
  const y = Math.max(t, grid.width - t - wallDepth);
  const spot = findWallSpot(option.w, "x", y);
  if (!spot) {
    alert("Plus de place disponible pour ce mur.");
    return;
  }
  state.walls.push({
    ...spot,
    y,
    length: option.w,
    orientation: "x",
    h: grid.height,
    price: option.price,
    name: option.name,
    color: option.color,
    alpha: option.alpha
  });
  render();
  updateTotal();
  renderStructuresList();
  sync3d();
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
  sync3d();
}

function updateSelectedWall(updater) {
  const index = state.selectedWallIndex;
  if (!state.editingWalls) {
    alert("Active d'abord le mode modification.");
    return;
  }
  if (index === null || index === undefined) {
    alert("Selectionne d'abord un mur.");
    return;
  }
  const current = state.walls[index];
  const updated = { ...current };
  updater(updated);
  if (!isWallPositionFree(updated.x, updated.y, updated.length, updated.orientation, index)) {
    alert("Placement impossible pour ce mur.");
    return;
  }
  state.walls[index] = updated;
  render();
  updateTotal();
  renderStructuresList();
  sync3d();
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
  const defaultSize = containerSizes[1] || containerSizes[0];
  if (defaultSize) {
    containerSizeEl.value = defaultSize.id;
    state.containerSizeId = defaultSize.id;
    updateDimensions(defaultSize);
  }
}

function applyContainerSize(sizeId) {
  const size = containerSizes.find((entry) => entry.id === sizeId);
  if (!size) return;
  state.containerSizeId = size.id;
  grid.length = size.lengthUnits;
  grid.width = size.widthUnits;
  grid.height = size.heightUnits;
  state.items = [];
  state.walls = [];
  state.windows = [];
  state.selectedWallIndex = null;
  state.editingWalls = false;
  updateDimensions(size);
  render();
  updateTotal();
  renderItemsList();
  renderStructuresList();
  updateWallEditState();
  sync3d();
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
  state.selectedWallIndex = null;
  state.editingWalls = false;
  render();
  updateTotal();
  renderItemsList();
  renderStructuresList();
  updateWallEditState();
  sync3d();
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

window.addEventListener("wall-moved", (event) => {
  const detail = event.detail || {};
  const index = detail.index;
  if (!Number.isFinite(index)) return;
  const wall = state.walls[index];
  if (!wall) return;
  wall.x = Math.round(detail.x);
  wall.y = Math.round(detail.y);
  render();
  renderStructuresList();
  sync3d();
});

wallLeftEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.x -= 1;
  })
);
wallRightEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.x += 1;
  })
);
wallUpEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.y -= 1;
  })
);
wallDownEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.y += 1;
  })
);
wallRotateEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.orientation = wall.orientation === "y" ? "x" : "y";
  })
);
wallGrowEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.length += 1;
  })
);
wallShrinkEl.addEventListener("click", () =>
  updateSelectedWall((wall) => {
    wall.length = Math.max(1, wall.length - 1);
  })
);

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
updateWallEditState();
sync3d();
