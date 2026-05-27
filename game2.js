const inputMap = {
    'ArrowLeft': 0, 'ArrowDown': 1, 'ArrowUp': 2, 'ArrowRight': 3,
    'd': 0, 'f': 1, 'j': 2, 'k': 3, 'D': 0, 'F': 1, 'J': 2, 'K': 3
};

window.processChartTimeline = function() {
    // Safety check: Halt if no chart data structure is mounted
    if (!gameState.songPlaying || !playableChart || !playableChart.notes) return;

    if (playableAudio) {
        gameState.elapsedTimeMs = playableAudio.currentTime * 1000;
    } else {
        gameState.elapsedTimeMs = performance.now() - gameState.startTime;
    }

    const scrollTimeMs = (620 / SCROLL_SPEED) * 16.67; 

    for (let i = playableChart.notes.length - 1; i >= 0; i--) {
        const chartNote = playableChart.notes[i];
        if (gameState.elapsedTimeMs >= (chartNote.time - scrollTimeMs)) {
            activeNotes.push({
                lane: chartNote.direction, target: chartNote.type,
                y: canvas.height + ARROW_SIZE, targetTime: chartNote.time 
            });
            playableChart.notes.splice(i, 1);
        }
    }
};

window.handleAndDrawNotes = function() {
    if (!gameState.songPlaying) return;

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        let note = activeNotes[i];
        const timeDifference = note.targetTime - gameState.elapsedTimeMs;
        note.y = STRUM_Y + (timeDifference / 16.67) * SCROLL_SPEED;

        const startX = strumLines[note.target].startX;
        const noteX = startX + (note.lane * NOTE_SPACING);
        const dirData = arrowDirections[note.lane];

        drawVectorArrow(noteX, note.y, dirData.color, dirData.angle, false, false);

        if (note.target === 'opponent' && note.y <= STRUM_Y) {
            gameState.health = Math.max(0, gameState.health - 1.2);
            activeNotes.splice(i, 1);
            continue;
        }

        if (note.target === 'player' && note.y < STRUM_Y - 50) {
            gameState.misses += 1;
            gameState.combo = 0;
            gameState.health = Math.max(0, gameState.health - 4.5); 
            createRatingPopup('MISS', '#ff3333');
            activeNotes.splice(i, 1);
        }
    }
};

function checkNoteHit(lane) {
    if (!gameState.songPlaying) return;

    for (let i = 0; i < activeNotes.length; i++) {
        let note = activeNotes[i];
        if (note.target === 'player' && note.lane === lane) {
            let timingErrorMs = Math.abs(note.targetTime - gameState.elapsedTimeMs);

            if (timingErrorMs <= 60) { 
                gameState.score += 250; gameState.combo += 1;
                gameState.health = Math.min(100, gameState.health + 2.5); 
                createRatingPopup('SICK!!', '#00ffff'); activeNotes.splice(i, 1); return;
            } else if (timingErrorMs <= 110) { 
                gameState.score += 100; gameState.combo += 1;
                gameState.health = Math.min(100, gameState.health + 1.0);
                createRatingPopup('GOOD', '#12fa05'); activeNotes.splice(i, 1); return;
            } else if (timingErrorMs <= 170) { 
                gameState.score += 50; gameState.combo += 1;
                createRatingPopup('BAD', '#ffaa00'); activeNotes.splice(i, 1); return;
            }
        }
    }
}

function handleMenuSelectionSubmit() {
    if (gameState.menuSelector === 0) {
        gameState.currentScreen = 'gameplay';
    } else if (gameState.menuSelector === 1) {
        if (typeof window.switchScreen === 'function') {
            window.switchScreen('editor');
        }
    }
}

window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }

    if (gameState.currentScreen === 'title') {
        if (event.key === 'Enter') gameState.currentScreen = 'mainmenu';
        return;
    }

    if (gameState.currentScreen === 'mainmenu') {
        if (event.key === 'ArrowUp') gameState.menuSelector = (gameState.menuSelector === 0) ? 1 : 0;
        else if (event.key === 'ArrowDown') gameState.menuSelector = (gameState.menuSelector === 1) ? 0 : 1;
        else if (event.key === 'Enter') handleMenuSelectionSubmit();
        return;
    }

    if (gameState.currentScreen === 'gameplay') {
        const targetLane = inputMap[event.key];
        if (targetLane !== undefined) {
            if (!keysPressed[targetLane]) checkNoteHit(targetLane);
            keysPressed[targetLane] = true;
        }
        
        if (event.key === 'Backspace') {
            if (playableAudio) playableAudio.pause();
            gameState.songPlaying = false;
            gameState.currentScreen = 'mainmenu';
            activeNotes = [];
        }

        if ((event.key === 'r' || event.key === 'R') && gameState.health <= 0) {
            gameState.health = 50; gameState.score = 0; gameState.misses = 0; gameState.combo = 0;
            activeNotes = []; visualPopups = [];
            if (playableChart) {
                if (playableAudio) { playableAudio.currentTime = 0; playableAudio.play(); }
                gameState.startTime = performance.now(); gameState.songPlaying = true;
            }
        }
    }
});

window.addEventListener('keyup', (event) => {
    const targetLane = inputMap[event.key];
    if (targetLane !== undefined) keysPressed[targetLane] = false;
});

// UPGRADED STABLE FILE LISTENER INTERFACE
window.addEventListener('load', () => {
    const chartInput = document.getElementById('chart-loader');
    
    chartInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        // FIX 1: Safety exit if the uploader fires with an empty selection
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsedData = JSON.parse(e.target.result);
                
                // FIX 2: Check if notes exist inside the file before trying to read it
                if (!parsedData || !parsedData.notes) {
                    alert('This file is blank or missing note data!');
                    return;
                }
                
                // FIX 3: Safe, deep clone injection to separate variables
                playableChart = JSON.parse(JSON.stringify(parsedData));
                
                // FIX 4: Complete board state flush to ensure notes spawn instantly
                activeNotes = []; 
                gameState.score = 0; 
                gameState.misses = 0; 
                gameState.combo = 0; 
                gameState.health = 50;

                if (typeof editorAudio !== 'undefined' && editorAudio !== null) {
                    playableAudio = editorAudio; 
                    playableAudio.currentTime = 0; 
                    playableAudio.play();
                }

                gameState.startTime = performance.now(); 
                gameState.songPlaying = true;
                
                createRatingPopup('CHART OVERRIDE SUCCESS!', '#12fa05');
            } catch (err) {
                alert('JSON Reading Error. Please try exporting your chart again.');
            }
        };
        reader.readAsText(file);
    });
});
