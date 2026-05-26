// Get references to the canvas and its drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state configuration
const gameState = {
    currentScreen: 'gameplay', // Tracks if player is in menus, gameplay, or editor
    score: 0,
    misses: 0
};

// Configuration for note positions and styling
const STRUM_Y = 100;         // Vertical height of the arrow receptors from the top
const ARROW_SIZE = 40;       // Size/radius scaling factor for our shapes
const NOTE_SPACING = 110;    // Space between the centers of each arrow lane

// Define the two receptor zones (Opponent on Left, Player on Right)
const strumLines = {
    opponent: { startX: 120 }, // Left side of the screen
    player: { startX: 720 }     // Right side of the screen
};

// Map real keyboard inputs to engine lane indices (0 = Left, 1 = Down, 2 = Up, 3 = Right)
const inputMap = {
    // Arrow Key Layout
    'ArrowLeft': 0,
    'ArrowDown': 1,
    'ArrowUp': 2,
    'ArrowRight': 3,
    
    // DFJK Comfort Layout
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3,
    'D': 0,
    'F': 1,
    'J': 2,
    'K': 3
};

// Tracking array to remember exactly which player keys are held down right now
const keysPressed = [false, false, false, false];

// Array tracking the 4 base directions, their display offsets, colors, and design angles
const arrowDirections = [
    { name: 'left',  laneOffset: 0, color: '#c24b99', angle: Math.PI / 2 },     // Pink (Points Left)
    { name: 'down',  laneOffset: 1, color: '#00ffff', angle: 0 },             // Cyan (Points Down)
    { name: 'up',    laneOffset: 2, color: '#12fa05', angle: Math.PI },         // Green (Points Up)
    { name: 'right', laneOffset: 3, color: '#f9393f', angle: -Math.PI / 2 }    // Red (Points Right)
];

/**
 * Draws a crisp standalone vector arrow shape centered on a coordinate
 */
function drawVectorArrow(x, y, color, angle, isReceptor, isHeld) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Style properties based on if it's a static receptor, a held receptor, or a moving note
    if (isReceptor) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        if (isHeld) {
            // Bright solid filled flash color when pressed down
            ctx.fillStyle = color;
        } else {
            // Semi-transparent core when resting idle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        }
    } else {
        ctx.fillStyle = color;
    }

    ctx.beginPath();
    // Start at the tip of the arrow (pointing downwards by default template)
    ctx.moveTo(0, ARROW_SIZE); 
    // Left barb corner
    ctx.lineTo(-ARROW_SIZE * 0.9, -ARROW_SIZE * 0.1); 
    // Left inner neck crease
    ctx.lineTo(-ARROW_SIZE * 0.4, -ARROW_SIZE * 0.1); 
    // Left top base corner
    ctx.lineTo(-ARROW_SIZE * 0.4, -ARROW_SIZE * 0.9); 
    // Right top base corner
    ctx.lineTo(ARROW_SIZE * 0.4, -ARROW_SIZE * 0.9); 
    // Right inner neck crease
    ctx.lineTo(ARROW_SIZE * 0.4, -ARROW_SIZE * 0.1); 
    // Right barb corner
    ctx.lineTo(ARROW_SIZE * 0.9, -ARROW_SIZE * 0.1); 
    // Seal outline geometry
    ctx.closePath();

    ctx.fill();
    if (isReceptor) {
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draws the 4 stationary target arrows for both player and opponent
 */
function drawStrumlineReceptors() {
    arrowDirections.forEach((dir) => {
        // Calculate horizontal positions using our set lane multipliers
        const opponentX = strumLines.opponent.startX + (dir.laneOffset * NOTE_SPACING);
        const playerX = strumLines.player.startX + (dir.laneOffset * NOTE_SPACING);

        // Draw opponent lane receptors (left half - remaining static for now)
        drawVectorArrow(opponentX, STRUM_Y, dir.color, dir.angle, true, false);

        // Check our active tracking array to see if this specific lane is held down
        const isPlayerLaneHeld = keysPressed[dir.laneOffset];

        // Draw player lane receptors (right half - reacts dynamically to key presses)
        drawVectorArrow(playerX, STRUM_Y, dir.color, dir.angle, true, isPlayerLaneHeld);
    });
}

// The main loop that continuously updates and redraws the game
function gameLoop() {
    // 1. Clear the screen with a solid dark grey color
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Render our responsive arrow receptors at the top of the canvas
    drawStrumlineReceptors();

    // 3. Draw HUD text metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 50, 650);
    ctx.fillText(`Misses: ${gameState.misses}`, 50, 680);

    // Call the loop again on the next animation frame
    requestAnimationFrame(gameLoop);
}

// Global Event Listeners checking for active keyboard interactions
window.addEventListener('keydown', (event) => {
    // Prevent arrow keys or spacebars from moving the webpage browser window down
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }

    // Match the pressed button to our layout index
    const targetLane = inputMap[event.key];
    if (targetLane !== undefined) {
        keysPressed[targetLane] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const targetLane = inputMap[event.key];
    if (targetLane !== undefined) {
        keysPressed[targetLane] = false;
    }
});

// Automatically start our engine loop when the website loads up
window.addEventListener('load', () => {
    gameLoop();
});
