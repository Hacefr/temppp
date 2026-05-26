let chartData = {
    bpm: 100,
    notes: []
};

// Audio synchronization management variables
let editorAudio = null;
let isAudioPlaying = false;
let audioUpdateInterval = null;

function switchScreen(screenName) {
    const canvasElement = document.getElementById('gameCanvas');
    const editorUIElement = document.getElementById('editorUI');

    if (screenName === 'editor') {
        gameState.currentScreen = 'editor';
        canvasElement.style.display = 'none';
        editorUIElement.style.display = 'flex';
        renderEditorGrid();
    } else {
        gameState.currentScreen = 'gameplay';
        canvasElement.style.display = 'block';
        editorUIElement.style.display = 'none';
        
        // Safety lock: halt music playback if leaving editor viewport
        if (isAudioPlaying) toggleEditorAudio();
    }
}

function renderEditorGrid() {
    const gridContainer = document.getElementById('chart-grid');
    gridContainer.innerHTML = ''; 

    // Extended timeline bounds to 256 rows to accommodate full songs
    const totalRows = 256; 
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        row.id = `editor-row-${rowIndex}`;

        const msTime = Math.floor(rowIndex * (60000 / chartData.bpm / 4));

        for (let colIndex = 0; colIndex < 8; colIndex++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const isPlayer = colIndex >= 4;
            const targetLane = isPlayer ? colIndex - 4 : colIndex;
            const typeStr = isPlayer ? 'player' : 'opponent';

            const hasNote = chartData.notes.some(n => 
                n.time === msTime && 
                n.direction === targetLane && 
                n.type === typeStr
            );

            if (hasNote) {
                cell.classList.add(
                    isPlayer ? 'active-player' : 'active-opponent'
                );
            }

            cell.addEventListener('click', () => {
                const noteIndex = chartData.notes.findIndex(n => 
                    n.time === msTime && 
                    n.direction === targetLane && 
                    n.type === typeStr
                );

                if (noteIndex > -1) {
                    chartData.notes.splice(noteIndex, 1);
                    cell.classList.remove(
                        'active-player', 'active-opponent'
                    );
                } else {
                    chartData.notes.push({
                        time: msTime,
                        direction: targetLane,
                        type: typeStr
                    });
                    cell.classList.add(
                        isPlayer ? 'active-player' : 'active-opponent'
                    );
                }
            });

            row.appendChild(cell);
        }
        gridContainer.appendChild(row);
    }
}

/**
 * Monitors active audio runtime positioning to visually auto-scroll the grid
 */
function updateEditorPlaybackVisuals() {
    if (!editorAudio) return;

    const currentTimeMs = editorAudio.currentTime * 1000;
    const timeDisplay = document.getElementById('audio-time-display');
    timeDisplay.innerText = `Time: ${editorAudio.currentTime.toFixed(2)}s`;

    // Determine target row matching active playback timing status
    const msPerRow = 60000 / chartData.bpm / 4;
    const currentExactRow = Math.floor(currentTimeMs / msPerRow);

    // Wipe previous highlight tags across row elements
    const activeRows = document.querySelectorAll('.grid-row.playback-current');
    activeRows.forEach(r => r.classList.remove('playback-current'));

    const targetRowElement = document.getElementById(
        `editor-row-${currentExactRow}`
    );
    
    if (targetRowElement) {
        targetRowElement.classList.add('playback-current');
        
        // Auto-center the scroll window container directly onto the target element row
        targetRowElement.scrollIntoView({
            behavior: 'auto',
            block: 'center'
        });
    }
}

function toggleEditorAudio() {
    if (!editorAudio) return;

    const playBtn = document.getElementById('btn-audio-play');
    const bpmInput = document.getElementById('song-bpm');
    chartData.bpm = parseInt(bpmInput.value) || 100;

    if (isAudioPlaying) {
        editorAudio.pause();
        clearInterval(audioUpdateInterval);
        playBtn.innerText = 'Play Music';
        isAudioPlaying = false;
    } else {
        editorAudio.play();
        audioUpdateInterval = setInterval(
            updateEditorPlaybackVisuals, 
            16
        );
        playBtn.innerText = 'Pause Music';
        isAudioPlaying = true;
    }
}

function exportChartJSON() {
    const bpmInput = document.getElementById('song-bpm');
    chartData.bpm = parseInt(bpmInput.value) || 100;

    const dataStr = JSON.stringify(chartData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + 
        encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'chart.json');
    linkElement.click();
}

// Global Listener assigning uploaded media streams to internal audio constructor
window.addEventListener('load', () => {
    const fileUploader = document.getElementById('audio-uploader');
    const audioBtn = document.getElementById('btn-audio-play');

    fileUploader.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            
            // Clean up old sound objects if switching files
            if (editorAudio) editorAudio.pause(); 
            
            editorAudio = new Audio(fileUrl);
            audioBtn.innerText = 'Play Music';
            isAudioPlaying = false;
            clearInterval(audioUpdateInterval);
        }
    });

    audioBtn.addEventListener('click', toggleEditorAudio);
});
