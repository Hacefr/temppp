// Get references to the canvas and its drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state configuration
const gameState = {
    currentScreen: 'gameplay', // Tracks if player is in menus, gameplay, or editor
    score: 0,
    misses: 0
};

// The main loop that continuously updates and redraws the game
function gameLoop() {
    // 1. Clear the screen with a solid dark grey color for background visibility
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw placeholder text to confirm the setup works
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Arial';
    ctx.fillText('Custom FNF Engine Running', 50, 50);
    ctx.fillText(`Score: ${gameState.score}`, 50, 100);

    // Call the loop again on the next animation frame
    requestAnimationFrame(gameLoop);
}

// Automatically start our engine when the page loads
window.addEventListener('load', () => {
    gameLoop();
});
