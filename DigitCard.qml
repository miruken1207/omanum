import QtQuick
import qs.Commons
import qs.Commons as Commons
import qs.Ui
import "Model.js" as Model

// The card: pops in from the screen edge, and slides the old label out as
// the new one comes in.
BorderSurface {
  id: root

  property bool opened: false
  property string label: ""
  property string previousLabel: ""
  // +1 slides the new label in from the right, -1 from the left.
  property int direction: 1
  // +1 rises from below, -1 drops from above.
  property int enterFrom: 1
  property int size: Style.space(112)
  // Multiplier for every duration; 0 snaps instead of animating.
  property real timeScale: 1

  readonly property int enterDuration: Math.round(280 * timeScale)
  readonly property int exitDuration: Math.round(200 * timeScale)
  readonly property int digitDuration: Math.round(220 * timeScale)
  readonly property int enterOffset: Math.round(size * 0.4)
  readonly property int digitOffset: Math.round(size * 0.57)
  readonly property int labelPadding: Math.round(size * 0.1)

  property real digitProgress: 1

  // Icon glyphs (the home house) often sit off-centre inside their advance
  // width, so AlignHCenter alone leaves them shifted. Nudge short labels by
  // the gap between the advance centre and the ink centre.
  function inkOffset(metrics) {
    var ink = metrics.tightBoundingRect
    if (metrics.text.length > 2 || ink.width <= 0) return 0
    return Math.round(metrics.advanceWidth / 2 - (ink.x + ink.width / 2))
  }

  function swapDigit() {
    digitSwap.restart()
  }

  width: root.size
  height: root.size
  color: Util.alpha(Commons.Color.background, 0.97)
  borderSpec: Border.surfaceSpec("popups", "border", Commons.Color.popups.border, Math.max(1, Style.space(2)))
  radius: Style.cornerRadius
  clip: true

  opacity: root.opened ? 1 : 0
  scale: root.opened ? 1 : 0.86
  transform: Translate {
    y: root.opened ? 0 : root.enterFrom * root.enterOffset

    Behavior on y {
      NumberAnimation {
        duration: root.opened ? root.enterDuration : root.exitDuration
        easing.type: root.opened ? Easing.OutBack : Easing.InCubic
      }
    }
  }

  Behavior on opacity {
    NumberAnimation {
      duration: root.opened ? root.enterDuration : root.exitDuration
      easing.type: Easing.OutCubic
    }
  }

  Behavior on scale {
    NumberAnimation {
      duration: root.opened ? root.enterDuration : root.exitDuration
      easing.type: root.opened ? Easing.OutBack : Easing.InCubic
    }
  }

  Text {
    id: outgoing
    anchors.centerIn: parent
    anchors.horizontalCenterOffset: -root.direction * root.digitOffset * root.digitProgress + root.inkOffset(outgoingMetrics)
    width: parent.width - 2 * root.labelPadding
    visible: digitSwap.running
    opacity: 1 - root.digitProgress
    text: root.previousLabel
    textFormat: Text.PlainText
    horizontalAlignment: Text.AlignHCenter
    elide: Text.ElideRight
    font.family: Style.font.family
    font.bold: true
    font.pixelSize: Math.round(root.size * 0.46 * Model.labelScale(root.previousLabel))
    color: Commons.Color.popups.text

    TextMetrics {
      id: outgoingMetrics
      font: outgoing.font
      text: outgoing.text
    }
  }

  Text {
    id: current
    anchors.centerIn: parent
    anchors.horizontalCenterOffset: root.direction * root.digitOffset * (1 - root.digitProgress) + root.inkOffset(currentMetrics)
    width: outgoing.width
    opacity: root.digitProgress
    text: root.label
    textFormat: Text.PlainText
    horizontalAlignment: Text.AlignHCenter
    elide: Text.ElideRight
    font.family: Style.font.family
    font.bold: true
    font.pixelSize: Math.round(root.size * 0.46 * Model.labelScale(root.label))
    color: Commons.Color.accent

    TextMetrics {
      id: currentMetrics
      font: current.font
      text: current.text
    }
  }

  NumberAnimation {
    id: digitSwap
    target: root
    property: "digitProgress"
    from: 0
    to: 1
    duration: root.digitDuration
    easing.type: Easing.OutCubic
  }
}
