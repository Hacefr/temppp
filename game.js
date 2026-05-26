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
const SCROLL_SPEED = 4;      // How many pixels a note moves up per frame

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

// Array to store active scrolling notes on the screen
let activeNotes = [];

/**
 * Spawns a single test note at the bottom of the screen
 * @param {number} lane - 0 to 3 for Left, Down, Up, Right
 * @param {string} target - 'player' or 'opponent'
 */
function spawnFakeNote(lane, target) {
    activeNotes.push({
        lane: lane,
        target: target,
        y: canvas.height + ARROW_SIZE, // Start just below the bottom edge
        hit: false
    });
}

/**
 * Periodically generates random notes to keep the gameplay loop active for testing
 */
function runTestSpawner() {
    // Spawns a note roughly every half second
    if (Math.random() < 0.02) {
        const randomLane = Math.floor(Math.random() * 4);
        const randomTarget = Math.random() > 0.5 ? 'player' : 'opponent';
        spawnFakeNote(randomLane, randomTarget);
    }
}

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
            ctx.fillStyle = color; // Bright solid filled flash color when pressed down
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Semi-transparent core when resting idle
        }
    } else {
        ctx.fillStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(0, ARROW_SIZE); 
    ctx.lineTo(-ARROW_SIZE * 0.9, -ARROW_SIZE * 0.1); 
    ctx.lineTo(-ARROW_SIZE * 0.4, -ARROW_SIZE * 0.1); 
    ctx.lineTo(-ARROW_SIZE * 0.4, -ARROW_SIZE * 0.9); 
    ctx.lineTo(ARROW_SIZE * 0.4, -ARROW_SIZE * 0.9); 
    ctx.lineTo(ARROW_SIZE * 0.4, -ARROW_SIZE * 0.1); 
    ctx.lineTo(ARROW_SIZE * 0.9, -ARROW_SIZE * 0.1); 
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
        const opponentX = strumLines.opponent.startX + (dir.laneOffset * NOTE_SPACING);
        const playerX = strumLines.player.startX + (dir.laneOffset * NOTE_SPACING);

        // Draw opponent lane receptors
        drawVectorArrow(opponentX, STRUM_Y, dir.color, dir.angle, true, false);

        // Draw player lane receptors
        const isPlayerLaneHeld = keysPressed[dir.laneOffset];
        drawVectorArrow(playerX, STRUM_Y, dir.color, dir.angle, true, isPlayerLaneHeld);
    });
}

/**
 * Updates note positions and draws them to the screen
 */
function handleAndDrawNotes() {
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let note = activeNotes[i];

        // Move note upward
        note.y -= SCROLL_SPEED;

        // Get x-coordinate based on lane and target strumline
        const startX = strumLines[note.target].startX;
        const noteX = startX + (note.lane * NOTE_SPACING);
        const dirData = arrowDirections[note.lane];

        // Draw the moving note arrow (solid color, not a receptor)
        drawVectorArrow(noteX, note.y, dirData.color, dirData.angle, false, false);

        // Opponent Auto-play logic: Opponent hits notes perfectly when they hit the target height
        if (note.target === 'opponent' && note.y <= STRUM_Y) {
            activeNotes.splice(i, 1);
            continue;
        }

        // Miss check: If a player note flies completely past the top of the screen unhit
        if (note.target === 'player' && note.y < STRUM_Y - ARROW_SIZE) {
            gameState.misses += 1;
            activeNotes.splice(i, 1);
        }
    }
}

/**
 * Handles the logic when a player presses a key to hit an upcoming note
 * @param {number} lane - The lane matching the pressed key
 */
function checkNoteHit(lane) {
    let hitWindow = 45; // Pixel threshold for a valid hit accuracy window

    for (let i = 0; i < activeNotes.length; i++) {
        let note = activeNotes[i];

        // Only look for player notes in the matching arrow lane
        if (note.target === 'player' && note.lane === lane) {
            // Check distance between the note's Y position and the receptor's Y position
            let distance = Math.abs(note.y - STRUM_Y);

            if (distance <= hitWindow) {
                gameState.score += 100;
                activeNotes.splice(i, 1); // Remove hit note from screen
                return; // Only hit one note per keypress
            }
        }
    }
}

// The main loop that continuously updates and redraws the game
function gameLoop() {
    // 1. Clear the screen
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Run the test system note generation
    runTestSpawner();

    // 3. Render moving notes
    handleAndDrawNotes();

    // 4. Render responsive arrow receptors on top of the moving notes
    drawStrumlineReceptors();

    // 5. Draw HUD text metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 50, 650);
    ctx.fillText(`Misses: ${gameState.misses}`, 50, 680);

    // Call the loop again on the next animation frame
    requestAnimationFrame(gameLoop);
}

// Global Event Listeners checking for active keyboard interactions
window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }

    const targetLane = inputMap[event.key];
    if (targetLane !== undefined) {
        // Only trigger a hit check if the key wasn't already being held down
        if (!keysPressed[targetLane]) {
            checkNoteHit(targetLane);
        }
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
