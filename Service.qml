import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "Model.js" as Model

// omanum: flashes the workspace number when you switch workspaces.
// Tracks the focused workspace and decides what to show; OsdWindow and
// DigitCard only draw it.
Item {
  id: root

  // Injected by omarchy-shell (the service loader).
  property var shell: null
  property var manifest: null
  property string omarchyPath: ""

  readonly property string pluginId: manifest && manifest.id ? String(manifest.id) : "miruken1207.omanum"

  // ------------------------------------------------------------ settings
  // Settings live inline on this plugin's entry in shell.json. Third-party
  // services aren't handed the shell config, so read the file and follow it.
  property var entry: ({})
  readonly property var cfg: Model.resolveSettings(root.entry)

  FileView {
    path: (Quickshell.env("XDG_CONFIG_HOME") || Quickshell.env("HOME") + "/.config") + "/omarchy/shell.json"
    watchChanges: true
    onFileChanged: reload()
    onLoaded: root.entry = Model.findEntry(text(), root.pluginId)
    onLoadFailed: root.entry = ({})
  }

  // ------------------------------------------------------------ state
  readonly property var slot: {
    var ws = Hyprland.focusedWorkspace
    return ws ? Model.slotFor(ws.id, ws.name, root.cfg) : null
  }

  property var current: null
  property var previous: null
  property int direction: 1
  property bool opened: false
  property bool ready: false

  onSlotChanged: root.handleSlot(root.slot)
  Component.onCompleted: root.current = root.slot

  function handleSlot(next) {
    // Scratchpads stay quiet; coming back from one is not a switch.
    if (!next) return
    if (root.current && next.key === root.current.key) {
      // Same workspace, new settings (e.g. home icon): just refresh the label.
      root.current = next
      return
    }
    var wasOpen = root.opened
    root.previous = root.current
    root.current = next
    if (!root.ready) return

    root.direction = Model.direction(root.previous, next, root.cfg.lastWorkspace)
    root.opened = true
    hideTimer.restart()
    if (wasOpen) osd.swapDigit()
  }

  // The shell reports the current workspace while starting up: stay quiet.
  Timer {
    interval: 1500
    running: true
    onTriggered: root.ready = true
  }

  Timer {
    id: hideTimer
    interval: root.cfg.duration
    onTriggered: root.opened = false
  }

  OsdWindow {
    id: osd
    cfg: root.cfg
    opened: root.opened
    label: root.current ? root.current.label : ""
    previousLabel: root.previous ? root.previous.label : ""
    direction: root.direction
  }
}
