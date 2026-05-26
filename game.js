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
function drawVectorArrow(x, y, color, angle, isReceptor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Style properties based on if it's a static hollow receptor or a solid moving note
    if (isReceptor) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Dark transparent core
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

        // Draw opponent lane receptors (left half)
        drawVectorArrow(opponentX, STRUM_Y, dir.color, dir.angle, true);

        // Draw player lane receptors (right half)
        drawVectorArrow(playerX, STRUM_Y, dir.color, dir.angle, true);
    });
}

// The main loop that continuously updates and redraws the game
function gameLoop() {
    // 1. Clear the screen with a solid dark grey color
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Render the custom arrow receptors at the top of the canvas
    drawStrumlineReceptors();

    // 3. Draw HUD text metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 50, 650);
    ctx.fillText(`Misses: ${gameState.misses}`, 50, 680);

    // Call the loop again on the next animation frame
    requestAnimationFrame(gameLoop);
}

// Automatically start our engine when the page loads
window.addEventListener('load', () => {
    gameLoop();
});
