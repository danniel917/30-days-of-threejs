# 30 Days of Three.js

A daily challenge learning [Three.js](https://threejs.org/), one scene per day.

**Live:** https://danniel917.github.io/30-days-of-threejs/

## Days

| Day | Scene | Live |
|-----|-------|------|
| 01 | Icosahedron with spotlight, hemisphere fill and orbit controls | [View](https://danniel917.github.io/30-days-of-threejs/day-01/) |

## Structure

Each day lives in its own folder and is fully self-contained — its own `index.html`
with an importmap pointing at the Three.js CDN, and its own `index.js`. No build
step, no bundler, no dependencies to install. Open any `index.html` and it runs.

```
30-days-of-threejs/
├── index.html      <- landing page
├── day-01/
│   ├── index.html
│   └── index.js
└── day-02/ ...
```

## Running locally

Because the scenes use ES modules and importmaps, opening the file directly with
`file://` will not work. Serve the folder over HTTP:

```bash
npx serve .
# or
python -m http.server 8000
```

Then visit http://localhost:8000
