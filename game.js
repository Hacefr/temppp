const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Consolidated core engine state container
const gameState = {
    currentScreen: 'gameplay', 
    score: 0,
    misses: 0,
    health: 50,             
    combo: 0,
    songPlaying: false,
    startTime: 0,
    elapsedTimeMs: 0
};

// Structural storage objects for user loaded external assets
let playableChart = null;
let playableAudio = null;

const STRUM_Y = 100;         
const ARROW_SIZE = 40;       
const NOTE_SPACING = 110;    
const SCROLL_SPEED = 5;      

const strumLines = {
    opponent: { startX: 120 }, 
    player: { startX: 720 }     
};

const keysPressed = [false, false, false, false];

const arrowDirections = [
    { name: 'left', laneOffset: 0, color: '#c24b99', angle: Math.PI / 2 },     
    { name: 'down', laneOffset: 1, color: '#00ffff', angle: 0 },             
    { name: 'up', laneOffset: 2, color: '#12fa05', angle: Math.PI },         
    { name: 'right', laneOffset: 3, color: '#f9393f', angle: -Math.PI / 2 }    
];

let activeNotes = [];
let visualPopups = []; 

function createRatingPopup(text, color) {
    visualPopups.push({
        text: text, color: color, x: canvas.width / 2,
        y: canvas.height / 2 - 30, alpha: 1.0, lifetime: 30          
    });
}

function handleAndDrawPopups() {
    for (let i = visualPopups.length - 1; i >= 0; i--) {
        let popup = visualPopups[i];
        ctx.save();
        ctx.globalAlpha = popup.alpha;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = popup.color;
        ctx.lineWidth = 2;
        ctx.fillRect(popup.x - 100, popup.y - 30, 200, 50);
        ctx.strokeRect(popup.x - 100, popup.y - 30, 200, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(popup.text, popup.x, popup.y - 5);
        ctx.restore();
        popup.y -= 0.5;         
        popup.lifetime--;
        popup.alpha = popup.lifetime / 30; 
        if (popup.lifetime <= 0) visualPopups.splice(i, 1);
    }
}

function drawHealthBar() {
    const width = 600, height = 20, y = 620;
    const x = (canvas.width - width) / 2;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 4, y - 4, width + 8, height + 8);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#33ff33';
    const playerWidth = (gameState.health / 100) * width;
    ctx.fillRect(x + (width - playerWidth), y, playerWidth, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(canvas.width / 2 - 2, y - 6, 4, height + 12);
}

function drawVectorArrow(x, y, color, angle, isReceptor, isHeld) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (isReceptor) {
        ctx.strokeStyle = color; ctx.lineWidth = 6;
        ctx.fillStyle = isHeld ? color : 'rgba(0, 0, 0, 0.4)';
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
    if (isReceptor) ctx.stroke();
    ctx.restore();
}

function drawStrumlineReceptors() {
    arrowDirections.forEach((dir) => {
        const opponentX = strumLines.opponent.startX + (dir.laneOffset * NOTE_SPACING);
        const playerX = strumLines.player.startX + (dir.laneOffset * NOTE_SPACING);
        drawVectorArrow(opponentX, STRUM_Y, dir.color, dir.angle, true, false);
        const isPlayerLaneHeld = keysPressed[dir.laneOffset];
        drawVectorArrow(playerX, STRUM_Y, dir.color, dir.angle, true, isPlayerLaneHeld);
    });
}

function drawWaitingMenuBanner() {
    if (gameState.songPlaying) return;
    ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
    ctx.fillRect(100, 200, canvas.width - 200, 260);
    ctx.strokeStyle = '#333344'; ctx.lineWidth = 3;
    ctx.strokeRect(100, 200, canvas.width - 200, 260);
    ctx.fillStyle = '#ffff00'; ctx.font = 'bold 26px Arial'; ctx.textAlign = 'center';
    ctx.fillText('ENGINE STABLE & READY', canvas.width / 2, 250);
    ctx.fillStyle = '#ffffff'; ctx.font = '18px Arial';
    ctx.fillText('1. Go to Chart Editor to map actions and Export JSON.', canvas.width / 2, 310);
    ctx.fillText('2. In Play Mode, select your chart using the loader button at the top.', canvas.width / 2, 350);
    ctx.fillText('Optional: You can also use the Editor audio loader to link songs.', canvas.width / 2, 390);
    ctx.textAlign = 'left'; 
}

function gameLoop() {
    if (gameState.currentScreen !== 'gameplay') {
        requestAnimationFrame(gameLoop);
        return;
    }
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Call background calculation steps from game2.js dynamically
    if (typeof window.processChartTimeline === 'function') {
        window.processChartTimeline();
        window.handleAndDrawNotes();
    }
    
    drawStrumlineReceptors();
    handleAndDrawPopups();
    drawHealthBar();
    drawWaitingMenuBanner();

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 50, 675);
    ctx.fillText(`Misses: ${gameState.misses}`, 50, 700);
    ctx.fillText(`Combo: ${gameState.combo}`, canvas.width - 150, 700);

    if (gameState.health <= 0) {
        if (playableAudio) playableAudio.pause();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000'; ctx.font = 'bold 64px Arial'; ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial'; ctx.fillStyle = '#ffffff';
        ctx.fillText('Press "R" to Restart Level', canvas.width / 2, canvas.height / 2 + 60);
        return; 
    }
    requestAnimationFrame(gameLoop);
}
