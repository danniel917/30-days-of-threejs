# 30 Days of Three.js

A 30-day challenge to learn [Three.js](https://threejs.org/) by building one small
WebGL scene every day — from basic geometry and lighting through materials,
animation and shaders. Each day is a self-contained experiment you can open and
play with.

**Live:** https://danniel917.github.io/30-days-of-threejs/

## Days

| Day | Scene | Description | Live |
|-----|-------|-------------|------|
| 01 | Icosahedron with Spotlight | Flat-shaded icosahedron with a translucent wireframe overlay, lit by an animated spotlight orbiting the shape, plus a hemisphere fill light and clamped orbit controls. | [View](https://danniel917.github.io/30-days-of-threejs/day-01/) |

## Structure

Each day lives in its own folder and is fully self-contained — its own `index.html`
with an importmap pointing at the Three.js CDN, and its own `index.js`. No build
step, no bundler, no dependencies to install.

```
30-days-of-threejs/
├── index.html      <- landing page
├── day-01/
│   ├── index.html
│   └── index.js
└── day-02/ ...
```

Because each day carries its own importmap, a later day can pin a different
Three.js version without breaking any earlier one.

## Running locally

The scenes use ES modules and importmaps, so opening the file directly with
`file://` will not work — it has to be served over HTTP:

```bash
npx serve .
# or
python -m http.server 8000
```

Or use the VS Code **Live Server** extension with this folder open as the project root.
