import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Wayland
import qs.Commons

// Click-through overlay layer on the focused monitor that hosts the card.
PanelWindow {
  id: root

  required property var cfg
  property bool opened: false
  property string label: ""
  property string previousLabel: ""
  property int direction: 1

  function swapDigit() {
    card.swapDigit()
  }

  readonly property bool atTop: cfg.position === "top"
  readonly property bool centered: cfg.position === "center"
  readonly property int edgeMargin: Style.space(cfg.offset)

  visible: root.opened || card.opacity > 0
  screen: {
    var name = Hyprland.focusedMonitor ? Hyprland.focusedMonitor.name : ""
    var match = Quickshell.screens.find(function(s) { return s.name === name })
    return match || Quickshell.screens[0]
  }
  // Anchored to one edge the surface is only as tall as the card needs;
  // centered it spans the screen.
  anchors {
    top: root.atTop || root.centered
    bottom: !root.atTop
    left: true
    right: true
  }
  implicitHeight: root.edgeMargin + card.size + card.enterOffset
  color: "transparent"
  WlrLayershell.namespace: "miruken1207-omanum"
  WlrLayershell.layer: WlrLayer.Overlay
  WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
  exclusionMode: ExclusionMode.Ignore
  // Visual-only surface: never blocks clicks to the desktop below it.
  mask: Region {}

  DigitCard {
    id: card
    anchors.horizontalCenter: parent.horizontalCenter
    y: root.centered ? Math.round((parent.height - height) / 2)
      : root.atTop ? root.edgeMargin
      : parent.height - height - root.edgeMargin
    opened: root.opened
    label: root.label
    previousLabel: root.previousLabel
    direction: root.direction
    enterFrom: root.atTop ? -1 : 1
    size: Style.space(root.cfg.size)
    timeScale: root.cfg.timeScale
  }
}
