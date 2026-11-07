# omanum

**English** · [Русский](README.ru.md)

A small [Omarchy](https://omarchy.org/) shell plugin that flashes the workspace number when you switch workspaces.

![omanum showing workspace 8](preview.png)

When the focused workspace changes, a card with its number pops up from the bottom of the screen. If you keep switching, the digit slides left or right depending on the direction, then the card hides on its own. It uses your current theme's colours and doesn't block clicks.

## Features

- **Follows your theme:** background, border and accent colour come from the active Omarchy theme.
- **Direction-aware animation:** the new number slides in from the right when you move forward and from the left when you move back. Going from the last workspace to the first still counts as "forward".
- **Home workspace:** a named workspace such as `home` shows as a house icon.
- **Named workspaces** show their name, shrunk to fit the card.
- **Quiet when it should be:** scratchpads (special workspaces) and shell startup don't trigger it.
- **Follows the focused monitor** on multi-monitor setups.
- **Click-through:** the overlay never steals clicks or keyboard focus.
- **Configurable:** position, size, timing, animations and the home icon, all changeable live from `shell.json`.

## Requirements

- Omarchy with `omarchy-shell`.
- Hyprland.
- A Nerd Font for the house icon. Omarchy ships JetBrainsMono Nerd Font by default.

## Installation

### From git

```bash
omarchy plugin add https://github.com/miruken1207/omanum.git --enable
```

Like any third-party plugin, it runs as unsandboxed code inside `omarchy-shell`. Read the code before enabling it: it's about 400 lines.

### Manually

```bash
git clone https://github.com/miruken1207/omanum.git ~/.config/omarchy/plugins/miruken1207.omanum
omarchy plugin enable miruken1207.omanum
```

### Recommended: turn off Hyprland's layer fade

omanum animates itself. Hyprland's default fade on layer surfaces stacks on top of that and makes the card look blurry. Add this to `~/.config/hypr/hyprland.lua`:

```lua
hl.layer_rule({ match = { namespace = "^miruken1207-omanum$" }, no_anim = true, animation = "none" })
```

## Configuration

Settings live inline on the plugin's entry in `~/.config/omarchy/shell.json` and apply as soon as you save:

```json
{
  "plugins": [
    {
      "id": "miruken1207.omanum",
      "position": "bottom",
      "size": 112,
      "duration": 1000
    }
  ]
}
```

| Key | Default | Description |
|---|---|---|
| `duration` | `1000` | How long the card stays up after the last switch, in ms (200–5000). |
| `position` | `"bottom"` | `"bottom"`, `"center"` or `"top"`. |
| `offset` | `140` | Distance from the screen edge (0–1000). Ignored when centered. The default keeps the card above the volume/brightness OSD. |
| `size` | `112` | Card size (48–320). |
| `homeWorkspace` | `"home"` | Name of the workspace shown as the home icon. `""` turns this off. |
| `homeIcon` | house glyph | Any text or glyph to use instead of the house. |
| `lastWorkspace` | `10` | Your last numbered workspace. Moving from it to the first one (or to home) slides forward. |
| `animations` | `true` | `false` makes the card appear and disappear instantly. |
| `animationSpeed` | `"normal"` | `"slow"`, `"normal"` or `"fast"`. |

Invalid values fall back to the defaults, and out-of-range numbers are clamped.

### Example: a home workspace

If your Hyprland config has a named workspace:

```lua
o.bind("SUPER + grave", "Home workspace", hl.dsp.focus({ workspace = "name:home" }))
```

omanum shows a house for it and treats it as workspace 0, so `home → 1` slides forward and `1 → home` slides back.

## Project structure

```
Service.qml        entry point: tracks the focused workspace, reads settings, decides when to show
OsdWindow.qml      click-through overlay layer on the focused monitor
DigitCard.qml      the card and all of its animations
Model.js           pure logic with no QML (settings, labels, slide direction)
tests/             unit tests for Model.js
```

## Development

Run the tests (requires Node.js):

```bash
node tests/model.test.js
```

`keepLoaded` services aren't hot-reloaded, and toggling the plugin off and on reuses the cached code. To pick up changes to the QML files, restart the shell:

```bash
omarchy restart shell
```

## License

[MIT](LICENSE)
