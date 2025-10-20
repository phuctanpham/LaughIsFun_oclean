// PWA Install Handling
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.classList.add('show');
    console.log('[PWA] Install prompt available');
});

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
        alert('Install not available. Please use Chrome, Edge, or Safari to install this app.');
        return;
    }
    
    installButton.classList.remove('show');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    installButton.classList.remove('show');
    deferredPrompt = null;
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => {
                console.log('[PWA] Service Worker registered:', reg.scope);
                
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New version available');
                        }
                    });
                });
            })
            .catch(err => console.log('[PWA] Service Worker registration failed:', err));
    });
}

// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loadingScreen');
const menuScreen = document.getElementById('menuScreen');
const guideScreen = document.getElementById('guideScreen');
const progressBar = document.getElementById('progressBar');
const loadingInfo = document.getElementById('loadingInfo');
const errorMessage = document.getElementById('errorMessage');

let score = 0;
let gameState = 'idle';
let hookMovingUp = false;
let ship, hook, entities;
let imagesLoaded = false;
let shipImg, hookImg;
let fishImages = [];
let trashImages = [];
let currentGuideStep = 1;

// Touch controls
let lastTap = 0;
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;
let touchStartTime = 0;

// Default SVG images
const DEFAULT_IMAGES = {
    fish: [
        'data:image/svg+xml,' + encodeURIComponent('<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><ellipse cx="35" cy="30" rx="20" ry="15" fill="#FF8C42"/><circle cx="40" cy="25" r="3" fill="white"/><circle cx="41" cy="25" r="1.5" fill="black"/><path d="M 15 30 L 5 20 L 5 40 Z" fill="#FF6B35"/></svg>'),
        'data:image/svg+xml,' + encodeURIComponent('<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><ellipse cx="35" cy="30" rx="22" ry="16" fill="#4A90E2"/><circle cx="42" cy="26" r="3" fill="white"/><circle cx="43" cy="26" r="1.5" fill="black"/><path d="M 13 30 L 3 18 L 3 42 Z" fill="#357ABD"/></svg>'),
        'data:image/svg+xml,' + encodeURIComponent('<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><ellipse cx="35" cy="30" rx="18" ry="14" fill="#6BCF7F"/><circle cx="39" cy="27" r="3" fill="white"/><circle cx="40" cy="27" r="1.5" fill="black"/><path d="M 17 30 L 7 22 L 7 38 Z" fill="#4CAF50"/></svg>')
    ],
    trash: [
        'data:image/svg+xml,' + encodeURIComponent('<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="12" width="16" height="8" rx="2" fill="#8B4513"/><rect x="20" y="20" width="20" height="28" rx="3" fill="#90EE90" opacity="0.7"/><rect x="22" y="23" width="16" height="3" fill="#228B22"/></svg>'),
        'data:image/svg+xml,' + encodeURIComponent('<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="10" width="16" height="9" rx="2" fill="#654321"/><rect x="20" y="19" width="20" height="30" rx="3" fill="#87CEEB" opacity="0.7"/><rect x="22" y="22" width="16" height="3" fill="#4682B4"/></svg>'),
        'data:image/svg+xml,' + encodeURIComponent('<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="11" width="16" height="8" rx="2" fill="#8B4513"/><rect x="20" y="19" width="20" height="29" rx="3" fill="#8B4513" opacity="0.6"/><rect x="22" y="22" width="16" height="3" fill="#654321"/></svg>')
    ],
    ship: 'data:image/svg+xml,' + encodeURIComponent('<svg width="80" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M 10 30 L 20 10 L 60 10 L 70 30 Z" fill="#8B4513"/><rect x="15" y="12" width="50" height="8" fill="#D2691E"/><rect x="35" y="5" width="10" height="7" fill="#654321"/></svg>'),
    hook: 'data:image/svg+xml,' + encodeURIComponent('<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="10" r="3" fill="#C0C0C0"/><path d="M 15 13 Q 15 20 10 23 Q 8 24 8 26 Q 8 28 10 28 Q 15 28 15 23" stroke="#C0C0C0" stroke-width="2" fill="none"/></svg>')
};

// Image Configuration
const IMAGE_CONFIG = {
    ship: 'statics/ship.png',
    hook: 'statics/hook.png',
    fishesPath: 'statics/fishes/fish',
    trashesPath: 'statics/trashes/trash',
    maxAttempts: 50
};

// Guide Functions
function showGuide() {
    menuScreen.classList.add('hidden');
    guideScreen.classList.remove('hidden');
    currentGuideStep = 1;
}

function nextGuideStep(step) {
    document.getElementById('guideStep' + currentGuideStep).classList.add('hidden');
    document.getElementById('guideStep' + step).classList.remove('hidden');
    currentGuideStep = step;
}

function closeGuide() {
    guideScreen.classList.add('hidden');
    startGame();
}

function startGameFromMenu() {
    menuScreen.classList.add('hidden');
    startGame();
}

// Image Loading Functions
const loadImageWithFallback = (src, fallbackSrc, imageName) => {
    return new Promise((resolve) => {
        const img = new Image();
        let loaded = false;

        img.onload = () => {
            if (!loaded) {
                loaded = true;
                console.log(`✓ Loaded: ${src}`);
                resolve({ success: true, img });
            }
        };

        img.onerror = () => {
            if (!loaded) {
                loaded = true;
                if (fallbackSrc) {
                    console.log(`⚠ Using default ${imageName}`);
                    const defaultImg = new Image();
                    defaultImg.onload = () => resolve({ success: true, img: defaultImg });
                    defaultImg.src = fallbackSrc;
                } else {
                    resolve({ success: false, img: null });
                }
            }
        };

        img.src = src;
    });
};

const discoverImages = async (basePath, fallbackArray, typeName, updateProgress) => {
    const images = [];
    let consecutiveFailures = 0;
    let index = 1;

    loadingInfo.textContent = `Discovering ${typeName}...`;

    while (index <= IMAGE_CONFIG.maxAttempts && consecutiveFailures < 3) {
        const src = `${basePath}${index}.png`;
        const result = await loadImageWithFallback(src, null, `${typeName} ${index}`);
        
        if (result.success) {
            images.push(result.img);
            consecutiveFailures = 0;
            updateProgress();
        } else {
            consecutiveFailures++;
        }
        
        index++;
    }

    if (images.length === 0) {
        console.log(`⚠ No ${typeName} images found, using defaults`);
        for (let i = 0; i < fallbackArray.length; i++) {
            const result = await loadImageWithFallback(
                fallbackArray[i],
                fallbackArray[i],
                `default ${typeName} ${i + 1}`
            );
            images.push(result.img);
            updateProgress();
        }
    }

    return images;
};

const loadImages = () => {
    return new Promise(async (resolve) => {
        let loadedCount = 0;

        const updateProgress = () => {
            loadedCount++;
            const progress = Math.min((loadedCount / 20) * 100, 95);
            progressBar.style.width = progress + '%';
            loadingInfo.textContent = `Loading assets: ${loadedCount}`;
        };

        const shipResult = await loadImageWithFallback(IMAGE_CONFIG.ship, DEFAULT_IMAGES.ship, 'ship');
        shipImg = shipResult.img;
        updateProgress();

        const hookResult = await loadImageWithFallback(IMAGE_CONFIG.hook, DEFAULT_IMAGES.hook, 'hook');
        hookImg = hookResult.img;
        updateProgress();

        fishImages = await discoverImages(IMAGE_CONFIG.fishesPath, DEFAULT_IMAGES.fish, 'fish', updateProgress);
        trashImages = await discoverImages(IMAGE_CONFIG.trashesPath, DEFAULT_IMAGES.trash, 'trash', updateProgress);

        console.log(`✓ Total: ${fishImages.length} fish, ${trashImages.length} trash`);

        progressBar.style.width = '100%';
        loadingInfo.textContent = `Ready! ${fishImages.length} fish, ${trashImages.length} trash`;

        setTimeout(() => {
            imagesLoaded = true;
            loadingScreen.classList.add('hidden');
            menuScreen.classList.remove('hidden');
            resolve();
        }, 500);
    });
};

// Game Functions
const setupCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reposition ship if game is active
    if (ship && gameState !== 'idle') {
        ship.y = canvas.height * 0.4 - 20;
        if (gameState === 'ready') {
            hook.y = ship.y + ship.height;
        }
    }
};

const getEntitySize = () => Math.max(30, 60 - score * 2);
const getHookSize = () => getEntitySize() * 0.4;
// REDUCED initial speed, increases with score
const getEntitySpeed = () => Math.max(0.5, 1 + score * 0.2);
const getTrashCount = () => Math.max(2, 10 - score);
const getFishCount = () => 5 + score;

const resetGame = () => {
    score = 0;
    gameState = 'ready';
    hookMovingUp = false;

    ship = {
        x: canvas.width / 2,
        y: canvas.height * 0.4 - 20,
        width: 80,
        height: 40,
        speed: 5
    };

    hook = {
        x: ship.x,
        y: ship.y + ship.height,
        width: getHookSize(),
        height: getHookSize(),
        speed: 0.8,
        attached: null
    };

    entities = [];
    updateEntities();
};

const updateEntities = () => {
    const trashCount = getTrashCount();
    const fishCount = getFishCount();
    
    entities = entities.filter(e => {
        if (e.type === 'trash') {
            return entities.filter(en => en.type === 'trash').indexOf(e) < trashCount;
        } else {
            return entities.filter(en => en.type === 'fish').indexOf(e) < fishCount;
        }
    });

    const currentTrash = entities.filter(e => e.type === 'trash').length;
    const currentFish = entities.filter(e => e.type === 'fish').length;

    for (let i = currentTrash; i < trashCount; i++) {
        entities.push(createEntity('trash'));
    }
    for (let i = currentFish; i < fishCount; i++) {
        entities.push(createEntity('fish'));
    }
};

const createEntity = (type) => {
    const size = getEntitySize();
    const imageArray = type === 'fish' ? fishImages : trashImages;
    const imageIndex = Math.floor(Math.random() * imageArray.length);
    
    const direction = Math.random() > 0.5 ? 1 : -1;
    const x = direction === 1 ? -size : canvas.width + size;
    const y = canvas.height * 0.4 + Math.random() * (canvas.height * 0.6 - size);
    
    return {
        x, y,
        width: size,
        height: size,
        speed: (Math.random() * 0.3 + 0.7) * getEntitySpeed(),
        direction,
        type,
        imageIndex
    };
};

const handleInput = (e) => {
    if (gameState === 'ready' || gameState === 'dropping' || gameState === 'pulling') {
        if (gameState === 'ready') {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                ship.x -= ship.speed;
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                ship.x += ship.speed;
            }
            ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));
        }
        
        if (gameState === 'ready' && (e.key === 'ArrowDown' || e.key.toLowerCase() === 's')) {
            gameState = 'dropping';
        }
        
        if ((gameState === 'dropping' || gameState === 'pulling') && (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w')) {
            hookMovingUp = true;
            gameState = 'pulling';
        }
    }
    
    if (gameState === 'game_over' && e.key === 'Enter') {
        resetGame();
    }
};

const handleKeyUp = (e) => {
    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        hookMovingUp = false;
        if (gameState === 'pulling' && !hook.attached) {
            gameState = 'dropping';
        }
    }
};

const checkCollision = (obj1, obj2) => {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
};

const update = () => {
    if (gameState === 'idle' || gameState === 'game_over') return;

    if (gameState === 'ready') {
        hook.x = ship.x;
        hook.y = ship.y + ship.height;
        
        entities.forEach(entity => {
            entity.x += entity.speed * entity.direction;
            
            if ((entity.direction === 1 && entity.x > canvas.width + entity.width) ||
                (entity.direction === -1 && entity.x < -entity.width)) {
                const newDirection = Math.random() > 0.5 ? 1 : -1;
                entity.x = newDirection === 1 ? -entity.width : canvas.width + entity.width;
                entity.direction = newDirection;
                entity.speed = (Math.random() * 0.3 + 0.7) * getEntitySpeed();
                const imageArray = entity.type === 'fish' ? fishImages : trashImages;
                entity.imageIndex = Math.floor(Math.random() * imageArray.length);
            }
        });
        return;
    }

    if (gameState === 'pulling') {
        // REDUCED pull speed to match drop speed
        hook.y -= hook.speed;
        
        if (hook.attached) {
            hook.attached.x = hook.x - hook.attached.width / 2;
            hook.attached.y = hook.y - hook.attached.height;
        }
        
        if (hook.y <= ship.y + ship.height) {
            hook.y = ship.y + ship.height;
            if (!hook.attached) {
                gameState = 'ready';
                hookMovingUp = false;
            }
        }
    } else if (gameState === 'dropping') {
        hook.y += hook.speed;
        if (hook.y > canvas.height) {
            hook.y = canvas.height;
        }
    }

    entities.forEach(entity => {
        if (entity === hook.attached) return;
        
        entity.x += entity.speed * entity.direction;
        
        if ((entity.direction === 1 && entity.x > canvas.width + entity.width) ||
            (entity.direction === -1 && entity.x < -entity.width)) {
            const newDirection = Math.random() > 0.5 ? 1 : -1;
            entity.x = newDirection === 1 ? -entity.width : canvas.width + entity.width;
            entity.direction = newDirection;
            entity.speed = (Math.random() * 0.3 + 0.7) * getEntitySpeed();
            const imageArray = entity.type === 'fish' ? fishImages : trashImages;
            entity.imageIndex = Math.floor(Math.random() * imageArray.length);
        }
    });

    if (hook.attached && checkCollision(hook.attached, ship)) {
        if (hook.attached.type === 'trash') {
            score++;
            entities = entities.filter(e => e !== hook.attached);
            hook.attached = null;
            gameState = 'ready';
            hookMovingUp = false;
            updateEntities();
        } else if (hook.attached.type === 'fish') {
            gameState = 'game_over';
        }
    }

    if (!hook.attached && (gameState === 'dropping' || gameState === 'pulling')) {
        for (const entity of entities) {
            if (checkCollision(hook, entity)) {
                hook.attached = entity;
                gameState = 'pulling';
                break;
            }
        }
    }
};

const draw = () => {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
    ctx.fillStyle = '#008080';
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

    if (gameState === 'idle') return;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(hook.x, hook.y);
    ctx.stroke();

    if (shipImg.complete && shipImg.naturalHeight !== 0) {
        ctx.drawImage(shipImg, ship.x - ship.width / 2, ship.y - ship.height / 2, ship.width, ship.height);
    }

    const hookSize = getHookSize();
    hook.width = hookSize;
    hook.height = hookSize;
    if (hookImg.complete && hookImg.naturalHeight !== 0) {
        ctx.drawImage(hookImg, hook.x - hookSize / 2, hook.y - hookSize / 2, hookSize, hookSize);
    }

    entities.forEach(entity => {
        const img = entity.type === 'fish' ? fishImages[entity.imageIndex] : trashImages[entity.imageIndex];
        
        ctx.save();
        ctx.translate(entity.x + entity.width / 2, entity.y + entity.height / 2);
        
        // Trash tilted at 30 degrees
        if (entity.type === 'trash') {
            ctx.rotate(30 * Math.PI / 180);
        }
        
        // Fish swim in opposite direction of image (flip horizontally)
        if (entity.type === 'fish') {
            if (entity.direction === 1) {
                ctx.scale(-1, 1);
            }
        } else {
            // Trash moves normally (not flipped)
            if (entity.direction === -1) {
                ctx.scale(-1, 1);
            }
        }
        
        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, -entity.width / 2, -entity.height / 2, entity.width, entity.height);
        }
        
        ctx.restore();
    });

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    ctx.font = '14px Arial';
    if (gameState === 'ready') {
        ctx.fillText('A/D or ← → to move | S or ↓ to drop hook', 10, canvas.height - 10);
    } else {
        ctx.fillText('W or ↑ to pull up hook | Catch trash, avoid fish!', 10, canvas.height - 10);
    }

    if (gameState === 'game_over') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
    }
};

const gameLoop = () => {
    update();
    draw();
    requestAnimationFrame(gameLoop);
};

const startGame = () => {
    setupCanvas();
    resetGame();
    gameLoop();
};

// Mobile Touch Controls
let doubleTapTimeout = null;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (gameState === 'idle' || gameState === 'game_over') return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    isTouching = true;
    touchStartTime = Date.now();
    
    // Double tap detection for dropping hook
    const currentTime = Date.now();
    const tapGap = currentTime - lastTap;
    
    if (tapGap < 300 && tapGap > 0) {
        // Double tap detected - drop hook
        if (gameState === 'ready') {
            gameState = 'dropping';
        }
        lastTap = 0;
    } else {
        lastTap = currentTime;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (!isTouching || gameState === 'idle' || gameState === 'game_over') return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    // Swipe detection for moving ship
    if (gameState === 'ready') {
        const deltaX = currentX - touchStartX;
        
        if (Math.abs(deltaX) > 5) {
            // Move ship based on swipe direction
            if (deltaX > 0) {
                ship.x += ship.speed;
            } else {
                ship.x -= ship.speed;
            }
            ship.x = Math.max(ship.width / 2, Math.min(canvas.width - ship.width / 2, ship.x));
            touchStartX = currentX;
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    isTouching = false;
    
    // If touching ended during pulling without attachment, return to dropping
    if (gameState === 'pulling' && !hook.attached) {
        gameState = 'dropping';
    }
}, { passive: false });

// Continuous touch detection for pulling hook
setInterval(() => {
    if (isTouching && (gameState === 'dropping' || gameState === 'pulling')) {
        const touchDuration = Date.now() - touchStartTime;
        
        // If held for more than 300ms, start pulling
        if (touchDuration > 300) {
            hookMovingUp = true;
            gameState = 'pulling';
        }
    } else if (!isTouching) {
        hookMovingUp = false;
    }
}, 50);

// Prevent default touch behaviors for mobile
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('resize', setupCanvas);
window.addEventListener('keydown', handleInput);
window.addEventListener('keyup', handleKeyUp);

// Prevent scrolling on mobile
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

loadImages();