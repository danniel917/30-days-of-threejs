# 30 Days of Three.js

A personal challenge. 30 days of learning [Three.js](https://threejs.org/),
building one 3D scene a day in the browser. This repo tracks my progress as I
work through shapes, lighting, textures, movement and effects.

**Live:** https://danniel917.github.io/30-days-of-threejs/

## Days

| Day | Scene | What you see | Live |
|-----|-------|--------------|------|
| 01 | Spinning Shape with a Moving Light | A twenty sided shape floating in the dark, with a thin outline drawn over it. A light circles around it while you watch, so the bright side keeps moving. Drag to turn the shape, scroll to move closer or further away. | [View](https://danniel917.github.io/30-days-of-threejs/day-01/) |
| 02 | The Earth with Clouds and City Lights | The Earth, tilted the same way the real one is, built from a few see through layers stacked on top of each other. A photo of the surface, city lights that switch on across the night side, clouds drifting slowly over the top, and a soft blue glow around the edge. Thousands of stars sit behind it. | [View](https://danniel917.github.io/30-days-of-threejs/day-02/) |
| 03 | Flying Through a Tunnel | A ride through a glowing tunnel that loops back on itself, so it never ends. The camera follows a curved path with a light attached to it, lighting up the walls as it goes. Small shapes float along the way and fade out just as you reach them. | [View](https://danniel917.github.io/30-days-of-threejs/day-03/) |

## Structure

Each day lives in its own folder and stands on its own. It has its own
`index.html` with an importmap pointing at the Three.js CDN, and its own
`index.js`. There is no build step, no bundler, and nothing to install.

```
30-days-of-threejs/
├── index.html      <- landing page
├── day-01/
│   ├── index.html
│   └── index.js
├── day-02/
└── day-03/ ...
```

Because every day carries its own importmap, a later day can use a different
version of Three.js without breaking any of the earlier ones.

## Running locally

The scenes use ES modules and importmaps, so opening the file straight from
your computer with `file://` will not work. It has to be served over HTTP:

```bash
npx serve .
# or
python -m http.server 8000
```

Or use the VS Code **Live Server** extension with this folder open as the project root.
