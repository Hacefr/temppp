const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = {
    currentScreen: 'intro', 
    menuSelector: 0,        
    score: 0,
    misses: 0,
    health: 50,             
    combo: 0,
    songPlaying: false,
    startTime: 0,
    elapsedTimeMs: 0,
    introTimer: 0,          
    titleFlash: 0           
};

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

function renderIntroScreen() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    
    gameState.introTimer += 1;
    
    if (gameState.introTimer < 90) {
        ctx.fillText('Engine Made by YNTM', canvas.width / 2, canvas.height / 2);
    } else if (gameState.introTimer >= 120 && gameState.introTimer < 210) {
        ctx.fillText('HIIIII', canvas.width / 2, canvas.height / 2);
    } else if (gameState.introTimer >= 240 && gameState.introTimer < 350) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('What the heck is a newgrounds?', canvas.width / 2, canvas.height / 2);
    } else if (gameState.introTimer >= 380 && gameState.introTimer < 490) {
        ctx.fillStyle = '#f9393f';
        ctx.font = 'bold 52px Arial';
        ctx.fillText('NO, FUNKIN\'.', canvas.width / 2, canvas.height / 2);
    } else if (gameState.introTimer >= 520) {
        gameState.currentScreen = 'title'; 
    }
    ctx.textAlign = 'left';
}

function renderTitleScreen() {
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 72px Arial';
    ctx.fillText('FRIDAY NIGHT FUNKIN\'', canvas.width / 2, 280);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'italic 32px Arial';
    ctx.fillText('Custom Mod Engine Builder', canvas.width / 2, 340);

    gameState.titleFlash += 0.05;
    const opacity = Math.abs(Math.sin(gameState.titleFlash));
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.font = 'bold 24px Arial';
    ctx.fillText('PRESS ENTER TO START', canvas.width / 2, 530);
    ctx.textAlign = 'left';
}

function renderMainMenuScreen() {
    ctx.fillStyle = '#15151c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('MAIN MENU', canvas.width / 2, 140);
    ctx.font = '28px Arial';
    
    if (gameState.menuSelector === 0) {
        ctx.fillStyle = '#12fa05';
        ctx.fillText('> FREEPLAY MODE <', canvas.width / 2, 320);
    } else {
        ctx.fillStyle = '#888899';
        ctx.fillText('FREEPLAY MODE', canvas.width / 2, 320);
    }

    if (gameState.menuSelector === 1) {
        ctx.fillStyle = '#12fa05';
        ctx.fillText('> CHART EDITOR <', canvas.width / 2, 410);
    } else {
        ctx.fillStyle = '#888899';
        ctx.fillText('CHART EDITOR', canvas.width / 2, 410);
    }
    
    ctx.fillStyle = '#555566';
    ctx.font = '16px Arial';
    ctx.fillText('Use UP / DOWN Arrow Keys to Navigate • Press ENTER to Select', canvas.width / 2, 620);
    ctx.textAlign = 'left';
}

function renderGameplayInterface() {
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // LINK TO game3.js: Calculate beat pulses and render character frames behind notes
    if (typeof window.updateAndDrawCharacters === 'function') {
        window.updateAndDrawCharacters();
    }
    
    if (typeof window.processChartTimeline === 'function') {
        window.processChartTimeline();
        window.handleAndDrawNotes();
    }
    
    drawStrumlineReceptors();
    handleAndDrawPopups();
    drawHealthBar();

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 50, 675);
    ctx.fillText(`Misses: ${gameState.misses}`, 50, 700);
    ctx.fillText(`Combo: ${gameState.combo}`, canvas.width - 150, 700);

    if (!playableChart && !gameState.songPlaying) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(150, 240, canvas.width - 300, 150);
        ctx.fillStyle = '#ffff00'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
        ctx.fillText('No Custom Chart Loaded for Freeplay!', canvas.width / 2, 290);
        ctx.fillStyle = '#ffffff'; ctx.font = '16px Arial';
        ctx.fillText('Please feed your chart.json file using the file loader at the top bar.', canvas.width / 2, 330);
        ctx.fillText('Press "BACKSPACE" to return to Main Menu at any time.', canvas.width / 2, 360);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    if (gameState.currentScreen === 'intro') {
        renderIntroScreen();
    } else if (gameState.currentScreen === 'title') {
        renderTitleScreen();
    } else if (gameState.currentScreen === 'mainmenu') {
        renderMainMenuScreen();
    } else if (gameState.currentScreen === 'gameplay') {
        renderGameplayInterface();
    } else if (gameState.currentScreen === 'editor') {
        requestAnimationFrame(gameLoop);
        return;
    }
    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
    gameLoop();
});
