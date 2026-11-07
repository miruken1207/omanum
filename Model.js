.pragma library

// Pure helpers for omanum. Nothing here touches QML objects, so the logic
// can be exercised with node (see tests/model.test.js).

var HOUSE_GLYPH = String.fromCodePoint(0xF02DC) // nf-md-home_variant

var DEFAULTS = {
  duration: 1000,           // ms the card stays up after the last switch
  position: "bottom",       // "bottom" | "center" | "top"
  offset: 140,              // distance from the screen edge (ignored when centered)
  size: 112,                // card edge length
  homeWorkspace: "home",    // named workspace shown as the home icon ("" = none)
  homeIcon: "",             // text or glyph for home ("" = house glyph)
  lastWorkspace: 10,        // last numbered workspace, for wraparound direction
  animations: true,
  animationSpeed: "normal"  // "slow" | "normal" | "fast"
}

var LIMITS = {
  duration: [200, 5000],
  offset: [0, 1000],
  size: [48, 320],
  lastWorkspace: [1, 99]
}

var POSITIONS = ["bottom", "center", "top"]
var SPEEDS = { slow: 1.5, normal: 1, fast: 0.6 }

function clampInt(value, range, fallback) {
  var n = Number(value)
  if (!isFinite(n)) return fallback
  return Math.min(range[1], Math.max(range[0], Math.round(n)))
}

function asBool(value, fallback) {
  if (value === true || value === "true") return true
  if (value === false || value === "false") return false
  return fallback
}

function asString(value, fallback) {
  return typeof value === "string" ? value : fallback
}

// Settings live inline on the plugin's shell.json entry. Unknown or broken
// values fall back to the defaults instead of breaking the overlay.
function resolveSettings(entry) {
  var e = entry && typeof entry === "object" ? entry : {}
  var speed = SPEEDS.hasOwnProperty(e.animationSpeed) ? e.animationSpeed : DEFAULTS.animationSpeed
  var animations = asBool(e.animations, DEFAULTS.animations)
  return {
    duration: clampInt(e.duration, LIMITS.duration, DEFAULTS.duration),
    position: POSITIONS.indexOf(e.position) !== -1 ? e.position : DEFAULTS.position,
    offset: clampInt(e.offset, LIMITS.offset, DEFAULTS.offset),
    size: clampInt(e.size, LIMITS.size, DEFAULTS.size),
    homeWorkspace: asString(e.homeWorkspace, DEFAULTS.homeWorkspace).trim(),
    homeIcon: asString(e.homeIcon, DEFAULTS.homeIcon) || HOUSE_GLYPH,
    lastWorkspace: clampInt(e.lastWorkspace, LIMITS.lastWorkspace, DEFAULTS.lastWorkspace),
    animations: animations,
    animationSpeed: speed,
    // Multiplier for every animation duration; 0 snaps instead of animating.
    timeScale: animations ? SPEEDS[speed] : 0
  }
}

// Finds this plugin's entry in the raw shell.json text.
function findEntry(text, pluginId) {
  var config
  try { config = JSON.parse(String(text || "")) } catch (e) { return {} }
  var list = config && Array.isArray(config.plugins) ? config.plugins : []
  for (var i = 0; i < list.length; i++)
    if (list[i] && String(list[i].id || "") === pluginId) return list[i]
  return {}
}

// What to show for a Hyprland workspace, or null when it should stay quiet.
// `index` orders workspaces for the slide direction: home is 0, numbered
// workspaces use their id, other named workspaces have no position.
function slotFor(id, name, cfg) {
  name = String(name || "")
  // Special workspaces (scratchpads) come and go on top of the real one.
  if (name.indexOf("special") === 0) return null
  if (cfg.homeWorkspace && name === cfg.homeWorkspace)
    return { key: "name:" + name, index: 0, label: cfg.homeIcon }
  if (id > 0) return { key: "id:" + id, index: id, label: String(id) }
  if (name) return { key: "name:" + name, index: -1, label: name }
  return null
}

// +1 slides the new label in from the right, -1 from the left. Stepping off
// either end of the row wraps, so last -> first still reads as "next".
function direction(previous, next, lastWorkspace) {
  if (!previous || !next || previous.index < 0 || next.index < 0) return 1
  if (lastWorkspace < 2) return next.index >= previous.index ? 1 : -1
  var first = next.index <= 1 && previous.index === lastWorkspace
  var last = previous.index <= 1 && next.index === lastWorkspace
  if (first && !last) return 1
  if (last && !first) return -1
  return next.index >= previous.index ? 1 : -1
}

// Long labels (named workspaces) shrink to stay inside the card.
function labelScale(label) {
  var length = String(label || "").length
  if (length <= 2) return 1
  if (length <= 4) return 0.6
  return 0.36
}
