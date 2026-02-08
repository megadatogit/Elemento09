// ele09.js
// Opción A: barras top5 proporcionales al totalMuertes del estado (cantidad / totalMuertes)

// ---------- DOM ----------
const features = document.querySelector("#features");

const entidadNombre = document.querySelector("#entidadNombre");
const totalMuertes = document.querySelector("#totalMuertes");

// Top5 causas
const causasTop5Group = document.querySelector("#causasTop5");
const causasTextNodes = causasTop5Group
  ? Array.from(causasTop5Group.querySelectorAll("text"))
  : [];

// Top5 cantidades
const cantidadesTop5Group = document.querySelector("#cantidadesTop5");
const cantidadesTextNodes = cantidadesTop5Group
  ? Array.from(cantidadesTop5Group.querySelectorAll("text"))
  : [];

// Barras horizontales top5
const barrasGroup = document.querySelector(".barras");
const barItems = barrasGroup ? Array.from(barrasGroup.querySelectorAll(".bar")) : [];

// Género: textos
const muertesHombresEl = document.querySelector("#muertesHombres");
const muertesMujeresEl = document.querySelector("#muertesMujeres");
const muertesNoDefEl = document.querySelector("#muertesNoDef");

const pctHombresEl = document.querySelector("#pctHombres");
const pctMujeresEl = document.querySelector("#pctMujeres");
const pctNoDefEl = document.querySelector("#pctNoDef");

// Género: barras verticales (ids claros en SVG)
const vHombresLine = document.querySelector("#vHombres");
const vMujeresLine = document.querySelector("#vMujeres");
const vNoDefLine = document.querySelector("#vNoDef");

// ---------- STATE ----------
let activePath = null;
let DATA_BY_ID = new Map();

// ---------- UTILS ----------
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const fmt = new Intl.NumberFormat("es-MX");

const formatNumber = (n) => fmt.format(Number(n ?? 0));

/**
 * Fade suave para textos HTML (p)
 * Requiere CSS: .is-changing con opacity/transform/transition
 */
function setTextSuave(el, texto, ms = 180) {
  if (!el) return;
  const t = String(texto ?? "");
  if (el.textContent === t) return;

  el.classList.add("is-changing");
  setTimeout(() => {
    el.textContent = t;
    el.classList.remove("is-changing");
  }, ms);
}

/**
 * Fade suave para <text> del SVG (usa tu CSS en #causasTop5 text.is-changing y similares)
 */
function setSvgTextSuave(textEl, texto, ms = 180) {
  if (!textEl) return;
  const t = String(texto ?? "");
  if (textEl.textContent === t) return;

  textEl.classList.add("is-changing");
  setTimeout(() => {
    textEl.textContent = t;
    textEl.classList.remove("is-changing");
  }, ms);
}

// ---------- CAUSAS ----------
function setCausasSuave(textNodes, muertesTop5) {
  const lista = Array.isArray(muertesTop5) ? muertesTop5.slice(0, 5) : [];
  for (let i = 0; i < textNodes.length; i++) {
    const nombre = lista[i]?.nombre ?? "—";
    setSvgTextSuave(textNodes[i], nombre);
  }
}

// ---------- CANTIDADES TOP5 ----------
function setCantidadesSuave(textNodes, muertesTop5) {
  const lista = Array.isArray(muertesTop5) ? muertesTop5.slice(0, 5) : [];
  for (let i = 0; i < textNodes.length; i++) {
    const cantidad = Number(lista[i]?.cantidad ?? 0);
    setSvgTextSuave(textNodes[i], formatNumber(cantidad));
  }
}

// ---------- BARRAS HORIZONTALES TOP5 ----------
/**
 * Guardamos geometría con la barra "bg" como referencia real.
 * Y ponemos el "fg" en x2 = x1 para que SIEMPRE se note el crecimiento.
 */
function initBarGeometry() {
  for (const bar of barItems) {
    const bg = bar.querySelector(".bar-bg");
    const fg = bar.querySelector(".bar-fg");
    if (!bg || !fg) continue;

    const x1 = Number(bg.getAttribute("x1"));
    const x2 = Number(bg.getAttribute("x2"));
    const wfull = Math.max(1, x2 - x1);

    bar.dataset.x1 = String(x1);
    bar.dataset.wfull = String(wfull);
    bar.dataset.p = "0";

    // clave: arrancar en 0 visual
    fg.setAttribute("x1", String(x1));
    fg.setAttribute("x2", String(x1));
  }
}

function setBarProportionSmooth(fgLine, p, { boost = 1.12, minPx = 5 } = {}) {
  if (!fgLine) return;

  const parentBar = fgLine.closest(".bar");
  if (!parentBar) return;

  const x1 = Number(parentBar.dataset.x1);
  const wfull = Number(parentBar.dataset.wfull);

  const pBase = clamp01(Number(p));
  const minP = clamp01(minPx / Math.max(1, wfull));

  // boost + mínimo visible si hay dato
  let pTarget = clamp01(pBase * boost);
  if (pBase > 0) pTarget = Math.max(pTarget, minP);

  const pFrom = clamp01(Number(parentBar.dataset.p ?? 0));
  if (Math.abs(pTarget - pFrom) < 0.0001) return;

  const duration = 260;
  const t0 = performance.now();

  parentBar._animToken = (parentBar._animToken ?? 0) + 1;
  const token = parentBar._animToken;

  const step = (now) => {
    if (parentBar._animToken !== token) return;

    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic

    const pNow = pFrom + (pTarget - pFrom) * eased;
    const x2Now = x1 + wfull * pNow;

    fgLine.setAttribute("x2", String(x2Now));

    if (t < 1) requestAnimationFrame(step);
    else parentBar.dataset.p = String(pTarget);
  };

  requestAnimationFrame(step);
}

function updateBarrasTop5(muertesTop5, totalMuertesEstado) {
  const lista = Array.isArray(muertesTop5) ? muertesTop5.slice(0, 5) : [];
  const total = Math.max(1, Number(totalMuertesEstado ?? 0));

  for (let i = 0; i < barItems.length; i++) {
    const fg = barItems[i].querySelector(".bar-fg");
    const cantidad = Number(lista[i]?.cantidad ?? 0);

    // Opción A: proporción respecto al total del estado
    const p = (cantidad*4) / total;

    setBarProportionSmooth(fg, p, { boost: 1.12, minPx: 5 });
  }
}

// ---------- BARRAS VERTICALES (GÉNERO) ----------
function initVBarGeometry(lineEl) {
  if (!lineEl) return;

  const y1 = Number(lineEl.getAttribute("y1"));
  const y2 = Number(lineEl.getAttribute("y2"));
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  const h = Math.max(1, bottom - top);

  lineEl.dataset.top = String(top);
  lineEl.dataset.bottom = String(bottom);
  lineEl.dataset.h = String(h);
  lineEl.dataset.p = String(clamp01(Number(lineEl.dataset.p ?? 0)));

  // arrancar en 0 (crece desde abajo por default)
  const anchor = (lineEl.dataset.anchor || "bottom").toLowerCase();
  if (anchor === "bottom") {
    lineEl.setAttribute("y1", String(bottom));
    lineEl.setAttribute("y2", String(bottom));
  } else {
    lineEl.setAttribute("y1", String(top));
    lineEl.setAttribute("y2", String(top));
  }
  lineEl.dataset.p = "0";
}

function setVBarProportionSmooth(lineEl, p, { boost = 1.10, minPx = 5 } = {}) {
  if (!lineEl) return;

  const top = Number(lineEl.dataset.top);
  const bottom = Number(lineEl.dataset.bottom);
  const h = Number(lineEl.dataset.h);

  const anchor = (lineEl.dataset.anchor || "bottom").toLowerCase();

  const pBase = clamp01(Number(p));
  const minP = clamp01(minPx / Math.max(1, h));

  let pTarget = clamp01(pBase * boost);
  if (pBase > 0) pTarget = Math.max(pTarget, minP);

  const pFrom = clamp01(Number(lineEl.dataset.p ?? 0));
  if (Math.abs(pTarget - pFrom) < 0.0001) return;

  const duration = 260;
  const t0 = performance.now();

  lineEl._animToken = (lineEl._animToken ?? 0) + 1;
  const token = lineEl._animToken;

  const step = (now) => {
    if (lineEl._animToken !== token) return;

    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3);

    const pNow = pFrom + (pTarget - pFrom) * eased;

    if (anchor === "bottom") {
      const y1Now = bottom - h * pNow;
      lineEl.setAttribute("y1", String(y1Now));
      lineEl.setAttribute("y2", String(bottom));
    } else {
      const y2Now = top + (h) * pNow;
      lineEl.setAttribute("y1", String(top));
      lineEl.setAttribute("y2", String(y2Now));
    }

    if (t < 1) requestAnimationFrame(step);
    else lineEl.dataset.p = String(pTarget);
  };

  requestAnimationFrame(step);
}

// ---------- GÉNERO (textos + barras) ----------
function updateGenero({ masculino, femenino, indefinido, total }) {
  const tot = Math.max(1, Number(total ?? 0));

  const m = Math.max(0, Number(masculino ?? 0));
  const f = Math.max(0, Number(femenino ?? 0));
  const n = Math.max(0, Number(indefinido ?? 0));

  const pm = Math.round((m / tot) * 100);
  const pf = Math.round((f / tot) * 100);
  const pn = Math.round((n / tot) * 100);

  setSvgTextSuave(muertesHombresEl, formatNumber(m));
  setSvgTextSuave(muertesMujeresEl, formatNumber(f));
  setSvgTextSuave(muertesNoDefEl, formatNumber(n));

  setSvgTextSuave(pctHombresEl, `${pm}%`);
  setSvgTextSuave(pctMujeresEl, `${pf}%`);
  setSvgTextSuave(pctNoDefEl, `${pn}%`);

  // barras verticales proporcionales al total del estado
  setVBarProportionSmooth(vHombresLine, m / tot, { boost: 1.10, minPx: 5 });
  setVBarProportionSmooth(vMujeresLine, f / tot, { boost: 1.10, minPx: 5 });
  setVBarProportionSmooth(vNoDefLine, n / tot, { boost: 1.10, minPx: 5 });
}

// ---------- CARGA DATOS ----------
async function loadDatos() {
  const res = await fetch("../json/datos.json");
  if (!res.ok) throw new Error("No se pudo cargar datos.json");

  const json = await res.json();
  const estados = Array.isArray(json?.estados) ? json.estados : [];
  DATA_BY_ID = new Map(estados.map((e) => [e.id, e]));
}

// ---------- FALLBACK / RESET ----------
function resetPanelConNombre(nombreFallback = "Seleccione entidad") {
  setTextSuave(entidadNombre, nombreFallback);
  setTextSuave(totalMuertes, "—");

  setCausasSuave(causasTextNodes, []);
  setCantidadesSuave(cantidadesTextNodes, []);
  updateBarrasTop5([], 1);

  updateGenero({ masculino: 0, femenino: 0, indefinido: 0, total: 1 });
}

// ---------- RENDER POR SELECCIÓN ----------
function onEstadoSelected(path) {
  const id = path?.id || "";
  const estadoData = DATA_BY_ID.get(id);

  // nombre: primero JSON, si no hay JSON, usar name del path
  const nombreEntidad =
    estadoData?.estado ||
    path.getAttribute("name") ||
    "Seleccione entidad";

  if (!estadoData) {
    resetPanelConNombre(nombreEntidad);
    return;
  }

  setTextSuave(entidadNombre, nombreEntidad);
  setTextSuave(totalMuertes, formatNumber(estadoData.totalMuertes));

  const muertesTop5 = estadoData?.muertes ?? [];
  setCausasSuave(causasTextNodes, muertesTop5);
  setCantidadesSuave(cantidadesTextNodes, muertesTop5);
  updateBarrasTop5(muertesTop5, estadoData?.totalMuertes);

  updateGenero({
    masculino: estadoData?.masculinoMuertes,
    femenino: estadoData?.femeninoMuertes,
    indefinido: estadoData?.indefinidoMuertes,
    total: estadoData?.totalMuertes,
  });
}

// ---------- EVENTOS MAPA ----------
features?.addEventListener("click", (e) => {
  const path = e.target.closest("path");
  if (!path || !features.contains(path)) return;

  if (activePath) activePath.classList.remove("is-active");
  path.classList.add("is-active");
  activePath = path;

  onEstadoSelected(path);
});

// ---------- INIT ----------
(async function init() {
  try {
    await loadDatos();

    initBarGeometry();

    initVBarGeometry(vHombresLine);
    initVBarGeometry(vMujeresLine);
    initVBarGeometry(vNoDefLine);

    // estado inicial (si quieres dejarlo limpio al cargar):
    resetPanelConNombre("Seleccione entidad");
  } catch (err) {
    console.error(err);
  }
})();
