# Afaf Elnaggar — Industrial Design Portfolio

Interactive portfolio site. Static HTML/CSS/JS, no build step.

- **Stack:** vanilla JS, GSAP + ScrollTrigger, Lenis smooth scroll (all via CDN)
- **Run locally:** `python3 -m http.server 5173` in this folder, then open http://localhost:5173
  (a server is needed — the line sketches are fetched as SVG so they can draw themselves on scroll)
- **Deploy:** GitHub Pages → Settings → Pages → Deploy from branch `main`, folder `/ (root)`

## Structure
```
index.html          all content
css/style.css       design system + sections
js/main.js          interactions
assets/img/         WebP renders & photos extracted from the PDF portfolio
assets/svg/         vector sketches (animated stroke drawing)
```
