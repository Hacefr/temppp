const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameState = {
    currentScreen: 'gameplay', 
    score: 0,
    misses: 0,
    health: 50,             
    combo: 0
};

const STRUM_Y = 100;         
const ARROW_SIZE = 40;       
const NOTE_SPACING = 110;    
const SCROLL_SPEED = 5;      

const strumLines = {
    opponent: { startX: 120 }, 
    player: { startX: 720 }     
};

const inputMap = {
    'ArrowLeft': 0, 'ArrowDown': 1, 
    'ArrowUp': 2, 'ArrowRight': 3,
    'd': 0, 'f': 1, 'j': 2, 'k': 3,
    'D': 0, 'F': 1, 'J': 2, 'K': 3
};

const keysPressed = [false, false, false, false];

const arrowDirections = [
    { 
        name: 'left', laneOffset: 0, 
        color: '#c24b99', angle: Math.PI / 2 
    },     
    { 
        name: 'down', laneOffset: 1, 
        color: '#00ffff', angle: 0 
    },             
    { 
        name: 'up', laneOffset: 2, 
        color: '#12fa05', angle: Math.PI 
    },         
    { 
        name: 'right', laneOffset: 3, 
        color: '#f9393f', angle: -Math.PI / 2 
    }    
];

let activeNotes = [];
let visualPopups = []; 

function spawnFakeNote(lane, target) {
    activeNotes.push({
        lane: lane,
        target: target,
        y: canvas.height + ARROW_SIZE, 
        hit: false
    });
}

function runTestSpawner() {
    // Only run spawn animations if user is playing
    if (gameState.currentScreen !== 'gameplay') return;

    if (Math.random() < 0.025) {
        const randomLane = Math.floor(Math.random() * 4);
        const randomTarget = Math.random() > 0.4 ? 'player' : 'opponent';
        spawnFakeNote(randomLane, randomTarget);
    }
}

function createRatingPopup(text, color) {
    visualPopups.push({
        text: text,
        color: color,
        x: canvas.width / 2,
        y: canvas.height / 2 - 30,
        alpha: 1.0,           
        lifetime: 30          
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
        
        if (popup.lifetime <= 0) {
            visualPopups.splice(i, 1);
        }
    }
}

function drawHealthBar() {
    const width = 600;
    const height = 20;
    const x = (canvas.width - width) / 2;
    const y = 620;

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
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
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
        const opponentX = strumLines.opponent.startX + 
            (dir.laneOffset * NOTE_SPACING);
        const playerX = strumLines.player.startX + 
            (dir.laneOffset * NOTE_SPACING);

        drawVectorArrow(opponentX, STRUM_Y, dir.color, dir.angle, true, false);

        const isPlayerLaneHeld = keysPressed[dir.laneOffset];
        drawVectorArrow(playerX, STRUM_Y, dir.color, dir.angle, true, isPlayerLaneHeld);
    });
}

function handleAndDrawNotes() {
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let note = activeNotes[i];

        note.y -= SCROLL_SPEED;

        const startX = strumLines[note.target].startX;
        const noteX = startX + (note.lane * NOTE_SPACING);
        const dirData = arrowDirections[note.lane];

        drawVectorArrow(noteX, note.y, dirData.color, dirData.angle, false, false);

        if (note.target === 'opponent' && note.y <= STRUM_Y) {
            gameState.health = Math.max(0, gameState.health - 1.5);
            activeNotes.splice(i, 1);
            continue;
        }

        if (note.target === 'player' && note.y < STRUM_Y - ARROW_SIZE) {
            gameState.misses += 1;
            gameState.combo = 0;
            gameState.health = Math.max(0, gameState.health - 4.5); 
            createRatingPopup('MISS', '#ff3333');
            activeNotes.splice(i, 1);
        }
    }
}

function checkNoteHit(lane) {
    for (let i = 0; i < activeNotes.length; i++) {
        let note = activeNotes[i];

        if (note.target === 'player' && note.lane === lane) {
            let distance = Math.abs(note.y - STRUM_Y);

            if (distance <= 20) { 
                gameState.score += 250;
                gameState.combo += 1;
                gameState.health = Math.min(100, gameState.health + 2.5); 
                createRatingPopup('SICK!!', '#00ffff');
                activeNotes.splice(i, 1);
                return;
            } else if (distance <= 40) { 
                gameState.score += 100;
                gameState.combo += 1;
                gameState.health = Math.min(100, gameState.health + 1.0);
                createRatingPopup('GOOD', '#12fa05');
                activeNotes.splice(i, 1);
                return;
            } else if (distance <= 60) { 
                gameState.score += 50;
                gameState.combo += 1;
                createRatingPopup('BAD', '#ffaa00');
                activeNotes.splice(i, 1);
                return;
            }
        }
    }
}

function gameLoop() {
    // Stop painting canvas steps if player is working on editing grid
    if (gameState.currentScreen !== 'gameplay') {
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    runTestSpawner();
    handleAndDrawNotes();
    drawStrumlineReceptors();
    handleAndDrawPopups();
    drawHealthBar();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 50, 675);
    ctx.fillText(`Misses: ${gameState.misses}`, 50, 700);
    ctx.fillText(`Combo: ${gameState.combo}`, canvas.width - 150, 700);

    if (gameState.health <= 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        return; 
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 
         'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }

    const targetLane = inputMap[event.key];
    if (targetLane !== undefined) {
        if (!keysPressed[targetLane]) {
            checkNoteHit(targetLane);
        }
        keysPressed[targetLane] = true;
    }
    
    if ((event.key === 'r' || event.key === 'R') && gameState.health <= 0) {
        gameState.health = 50;
        gameState.score = 0;
        gameState.misses = 0;
        gameState.combo = 0;
        activeNotes = [];
        visualPopups = [];
        gameLoop();
    }
});

window.addEventListener('keyup', (event) => {
    const targetLane = inputMap[event.key];
    if (targetLane !== undefined) {
        keysPressed[targetLane] = false;
    }
});

window.addEventListener('load', () => {
    gameLoop();
});
