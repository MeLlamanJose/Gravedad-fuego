# Gravedad-fuego

Interactive particle physics playground built with HTML5 canvas, vanilla JavaScript, and CSS.

`Gravedad-fuego` is a visual simulation where you can emit particles, move the emitter with the mouse, switch between different motion presets, and explore gravity, dispersion, lifespan, trails, color palettes, and warp-like center attraction in real time.

## Features

- Real-time particle simulation rendered on `canvas`
- Draggable emitter controlled with mouse or touch
- Multiple presets:
  - `Chispas`
  - `Fuegos`
  - `Cascada`
  - `Volcán`
  - `Tormenta`
  - `Warp`
- Adjustable physics controls:
  - active particles
  - gravity strength
  - gravity angle
  - lifespan
  - speed
  - emitter radius
  - dispersion
  - trail length
- Color palette switching
- Optional edge bounce
- Pause and keyboard shortcuts
- Optimized particle pool reuse for smoother rendering

## Project Structure

```text
Gravedad-fuego/
├── index.html
├── style.css
├── app.js
└── README.md
```

## How It Works

The simulation uses a particle pool to recycle particle objects instead of creating new ones every frame.  
Each preset defines a different emission style and motion behavior:

- `Chispas`: energetic sparks
- `Fuegos`: fireworks bursts and rockets
- `Cascada`: fountain-like upward flow
- `Volcán`: bottom-origin eruption
- `Tormenta`: moving emitter with dynamic gravity
- `Warp`: particles pulled toward the center like a black hole

## Controls

### Mouse / Touch

- Click or press to emit particles
- Hold press to keep emitting
- Drag to move the emitter

### Keyboard

- `1` to `6`: switch presets
- `Arrow Up / Arrow Down`: change particle count
- `Arrow Left / Arrow Right`: change gravity angle
- `G`: increase gravity
- `Shift + G`: decrease gravity
- `C`: cycle color palette
- `Space`: pause / resume
- `H`: show / hide controls

## Running the Project

This is a static front-end project.

Open `index.html` in a browser:

```bash
open index.html
```

Or serve it locally with any static server if you prefer.

## Customization Ideas

- Add new presets with unique force fields
- Add background effects or glow layers
- Add FPS / active particle counters
- Save and load preset configurations
- Add sound-reactive behavior
- Export screenshots or short recordings

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas 2D API

## License

Use, modify, and experiment freely.
