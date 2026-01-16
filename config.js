const CONFIG = {
  containerSizes: [
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
  ],
  catalog: [
    { id: "desk", name: "Bureau compact", w: 3, d: 2, h: 2, price: 320, color: "#c9a27c" },
    { id: "sofa", name: "Canape droit", w: 4, d: 2, h: 2, price: 680, color: "#9c6b5a" },
    { id: "shelf", name: "Etagere metal", w: 2, d: 1, h: 3, price: 210, color: "#8b8f95" },
    { id: "bed", name: "Lit simple", w: 4, d: 2, h: 2, price: 520, color: "#9e8b6a" },
    { id: "kitchen", name: "Bloc kitchenette", w: 4, d: 2, h: 3, price: 940, color: "#7f6d5a" },
    { id: "light", name: "Suspension", w: 1, d: 1, h: 1, price: 95, color: "#e7c36a" }
  ],
  wallOptions: [
    { id: "steel", name: "Mur acier plein", w: 4, price: 1200, color: "#c3b7aa", alpha: 0.6 },
    { id: "glass", name: "Mur vitrine", w: 4, price: 1600, color: "#d7c7b4", alpha: 0.5 }
  ],
  windowOptions: [
    { id: "fixed", name: "Fenetre fixe", w: 2, h: 2, z: 1.5, price: 350, color: "rgba(140,180,210,0.5)" },
    { id: "bay", name: "Baie vitree", w: 4, h: 3, z: 1, price: 900, color: "rgba(120,170,200,0.45)" }
  ],
  insulationOptions: [
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
  ],
  wallDepth: 0.4
};

window.CONFIG = CONFIG;
