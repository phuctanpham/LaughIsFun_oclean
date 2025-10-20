# oclean (ocean clean)
vibe code using LLMs to design and develop a web-based game that highlights and addresses a pressing social challenge in Vietnam

A game is published by LaughIsFun

https://oclean.pages.dev/
<<<<<<< HEAD
acc: admin
pwd: root

📦 Complete File Structure:
your-project/
├── index.html          (Clean, minimal HTML)
├── index.css           (All styles separated)
├── game.js             (All game logic separated)
├── manifest.json       (PWA manifest with hook.png as icon)
├── service-worker.js   (Smart caching with dynamic image support)
└── static/
    ├── hook.png        (Used as app icon/logo)
    ├── ship.png
    ├── fishes/
    │   ├── fish1.png
    │   ├── fish2.png
    │   └── ...
    └── trashes/
        ├── trash1.png
        ├── trash2.png
        └── ...
✨ Key Improvements:
1. Separation of Concerns
```
index.html - Clean structure only
index.css - All styles
game.js - All game logic and PWA functionality
manifest.json - PWA configuration
service-worker.js - Caching strategy
```
2. Smart Service Worker

Caches static assets on install
Dynamic image caching - automatically caches discovered fish/trash images
Cache-first strategy for better offline performance
Automatic cleanup of old caches
Proper error handling for missing images

3. PWA Features

Install button with proper event handling
Service worker with update detection
Offline support
Landscape orientation optimized
Proper theme colors
=======
>>>>>>> d4820726d0521fc1e8c9d98ac57d69a3ff3fd013
