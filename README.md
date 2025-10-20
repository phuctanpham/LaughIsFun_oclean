# OClean - Ocean Cleanup Game

A web-based game designed to highlight and address the pressing social challenge of ocean pollution in Vietnam, developed using LLMs.

**Play the game:** [https://oclean.pages.dev/](https://oclean.pages.dev/)

---

## Technical Documentation

This document provides a technical overview of the OClean game, a web-based game designed to raise awareness about ocean pollution.

### 1. Relevance & Impact

*   **Social Issue:** OClean directly addresses the critical social issue of ocean pollution, a significant environmental concern with far-reaching consequences.
*   **Educational Goal:** The game aims to educate players on the importance of clean oceans by simulating the process of removing trash while preserving marine life.
*   **Call to Action:** By engaging players in a virtual cleanup, the game implicitly encourages real-world positive actions, such as responsible waste disposal and support for conservation efforts.

### 2. Creativity & Originality

*   **Innovative Concept:** While the theme of ocean conservation is not new, OClean's approach as a simple, accessible, and engaging game is a creative way to convey a serious message.
*   **Engaging Gameplay:** The core mechanic of dropping a hook to catch trash while avoiding fish is intuitive and provides a compelling challenge that scales with player performance.
*   **AI-Powered Development:** The project leverages AI in its development, as evidenced by the prompt files. This is a modern and innovative approach to game creation.

### 3. Gameplay & User Experience

*   **Intuitive Controls:** The game uses standard keyboard controls (Arrow Keys or WASD) that are easy to learn and use.
*   **Progressive Difficulty:** The game's difficulty increases as the player's score rises, with items moving faster and becoming smaller. This keeps the gameplay challenging and engaging.
*   **Clear UI/UX:** The game features a clean and user-friendly interface. A loading screen with a progress bar, a main menu, and a "How to Play" guide all contribute to a smooth user experience.
*   **PWA for Mobile:** The game is a Progressive Web App (PWA), allowing users to "install" it on their mobile devices for a more native-app-like experience.

### 4. Technical Execution

*   **Well-Structured Code:** The codebase is well-organized, with a clear separation of concerns:
    *   `index.html`: Handles the basic structure of the game's web page.
    *   `index.css`: Contains all the styling for the game's UI.
    *   `game.js`: Houses the core game logic, including the game loop, physics, and scoring.
*   **Modern Web Technologies:** The game is built using modern web technologies, including:
    *   **HTML5 Canvas:** Used for rendering the game's graphics.
    *   **JavaScript (ES6+):** The game logic is written in modern JavaScript, using features like `async/await` for loading assets.
    *   **PWA (Progressive Web App):** A service worker (`service-worker.js`) is used for caching assets, enabling offline play and faster load times.
*   **Robust Asset Loading:** The game includes a smart image loading system that attempts to load images from the server and falls back to default SVG images if the primary assets are not found. This ensures the game is always playable.
*   **Performance Optimization:** The use of `requestAnimationFrame` for the game loop ensures smooth animations and efficient rendering.

### 5. Documentation, Presentation & Reflection

*   **Clear Documentation:** The `README.md` file provides a concise overview of the project, its file structure, and key features.
*   **AI Prompts:** The presence of prompt files in the `src/prompts` directory indicates a reflective and modern approach to development, leveraging AI for creative and technical tasks.

---

## 📦 File Structure

```
codebase/
├── index.html          (Clean, minimal HTML)
├── index.css           (All styles separated)
├── game.js             (All game logic separated)
├── manifest.json       (PWA manifest with hook.png as icon)
├── service-worker.js   (Smart caching with dynamic image support)
└── statics/
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
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
