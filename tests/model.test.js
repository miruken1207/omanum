// Run: node tests/model.test.js
const fs = require("fs")
const path = require("path")
const assert = require("assert")

const src = fs.readFileSync(path.join(__dirname, "..", "Model.js"), "utf8").replace(/^\.pragma library\s*/, "")
const M = new Function(src + "\nreturn { HOUSE_GLYPH, DEFAULTS, resolveSettings, findEntry, slotFor, direction, labelScale }")()

let failed = 0
function test(name, fn) {
  try { fn(); console.log("ok   " + name) } catch (e) { failed++; console.log("FAIL " + name + "\n     " + e.message) }
}

const cfg = M.resolveSettings({})
const ws = (id, name) => M.slotFor(id, name === undefined ? String(id) : name, cfg)

test("resolveSettings fills defaults", () => {
  assert.strictEqual(cfg.duration, 1000)
  assert.strictEqual(cfg.position, "bottom")
  assert.strictEqual(cfg.homeWorkspace, "home")
  assert.strictEqual(cfg.homeIcon, M.HOUSE_GLYPH)
  assert.strictEqual(cfg.lastWorkspace, 10)
  assert.strictEqual(cfg.timeScale, 1)
})

test("resolveSettings clamps and rejects bad values", () => {
  const s = M.resolveSettings({ duration: 99999, size: 3, offset: "abc", position: "left", animationSpeed: "warp", lastWorkspace: 0 })
  assert.strictEqual(s.duration, 5000)
  assert.strictEqual(s.size, 48)
  assert.strictEqual(s.offset, 140)
  assert.strictEqual(s.position, "bottom")
  assert.strictEqual(s.animationSpeed, "normal")
  assert.strictEqual(s.lastWorkspace, 1)
})

test("resolveSettings handles junk entries", () => {
  assert.deepStrictEqual(M.resolveSettings(null), cfg)
  assert.deepStrictEqual(M.resolveSettings("nope"), cfg)
})

test("animations off snaps, speeds scale durations", () => {
  assert.strictEqual(M.resolveSettings({ animations: false }).timeScale, 0)
  assert.strictEqual(M.resolveSettings({ animations: "false" }).timeScale, 0)
  assert.strictEqual(M.resolveSettings({ animationSpeed: "fast" }).timeScale, 0.6)
  assert.strictEqual(M.resolveSettings({ animationSpeed: "slow" }).timeScale, 1.5)
})

test("custom home icon, empty home disables it", () => {
  assert.strictEqual(M.resolveSettings({ homeIcon: "H" }).homeIcon, "H")
  const noHome = M.resolveSettings({ homeWorkspace: "" })
  assert.strictEqual(M.slotFor(-1337, "home", noHome).label, "home")
})

test("findEntry picks this plugin's entry from shell.json", () => {
  const text = JSON.stringify({ plugins: [{ id: "other", size: 1 }, { id: "miruken1207.omanum", size: 90 }] })
  assert.strictEqual(M.findEntry(text, "miruken1207.omanum").size, 90)
  assert.deepStrictEqual(M.findEntry(text, "missing"), {})
  assert.deepStrictEqual(M.findEntry("{broken", "miruken1207.omanum"), {})
  assert.deepStrictEqual(M.findEntry("", "miruken1207.omanum"), {})
})

test("slotFor maps numbered, home, named and special workspaces", () => {
  assert.deepStrictEqual(ws(3), { key: "id:3", index: 3, label: "3" })
  assert.deepStrictEqual(ws(-1337, "home"), { key: "name:home", index: 0, label: M.HOUSE_GLYPH })
  assert.deepStrictEqual(ws(-1338, "music"), { key: "name:music", index: -1, label: "music" })
  assert.strictEqual(ws(-98, "special:scratchpad"), null)
  assert.strictEqual(ws(-99, "special"), null)
  assert.strictEqual(ws(0, ""), null)
})

test("direction follows the workspace order", () => {
  assert.strictEqual(M.direction(ws(2), ws(5), 10), 1)
  assert.strictEqual(M.direction(ws(5), ws(2), 10), -1)
  assert.strictEqual(M.direction(ws(-1337, "home"), ws(1), 10), 1)
  assert.strictEqual(M.direction(ws(1), ws(-1337, "home"), 10), -1)
})

test("direction wraps between the last workspace and the first", () => {
  assert.strictEqual(M.direction(ws(10), ws(-1337, "home"), 10), 1)
  assert.strictEqual(M.direction(ws(-1337, "home"), ws(10), 10), -1)
  assert.strictEqual(M.direction(ws(10), ws(1), 10), 1)
  assert.strictEqual(M.direction(ws(1), ws(10), 10), -1)
  // A shorter row wraps at its own end.
  assert.strictEqual(M.direction(ws(5), ws(1), 5), 1)
  assert.strictEqual(M.direction(ws(10), ws(1), 5), -1)
})

test("direction defaults forward when order is unknown", () => {
  assert.strictEqual(M.direction(null, ws(3), 10), 1)
  assert.strictEqual(M.direction(ws(3), ws(-1338, "music"), 10), 1)
  assert.strictEqual(M.direction(ws(2), ws(1), 1), -1)
})

test("labelScale shrinks long labels", () => {
  assert.strictEqual(M.labelScale("7"), 1)
  assert.strictEqual(M.labelScale("10"), 1)
  assert.strictEqual(M.labelScale("work"), 0.6)
  assert.strictEqual(M.labelScale("browser"), 0.36)
})

if (failed) { console.log("\n" + failed + " failed"); process.exit(1) }
console.log("\nall passed")
