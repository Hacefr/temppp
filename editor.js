let chartData = {
    bpm: 100,
    notes: []
};

let editorAudio = null;
let isAudioPlaying = false;
let audioUpdateInterval = null;
let userIsScrubbing = false;

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
        if (isAudioPlaying) toggleEditorAudio();
    }
}

/**
 * Dedicated callback routing exit parameters back out to main menu
 */
function returnToMenuFromEditor() {
    const canvasElement = document.getElementById('gameCanvas');
    const editorUIElement = document.getElementById('editorUI');
    
    if (isAudioPlaying) toggleEditorAudio();
    
    gameState.currentScreen = 'mainmenu';
    canvasElement.style.display = 'block';
    editorUIElement.style.display = 'none';
}

function renderEditorGrid() {
    const gridContainer = document.getElementById('chart-grid');
    gridContainer.innerHTML = ''; 
    const totalRows = 512; 
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        row.id = `editor-row-${rowIndex}`;

        const msTime = Math.floor(rowIndex * (60000 / chartData.bpm / 4));
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'row-timestamp';
        timeLabel.innerText = `${(msTime / 1000).toFixed(2)}s`;
        row.appendChild(timeLabel);

        for (let colIndex = 0; colIndex < 8; colIndex++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const isPlayer = colIndex >= 4;
            const targetLane = isPlayer ? colIndex - 4 : colIndex;
            const typeStr = isPlayer ? 'player' : 'opponent';

            const hasNote = chartData.notes.some(n => 
                n.time === msTime && n.direction === targetLane && n.type === typeStr
            );

            if (hasNote) {
                cell.classList.add(isPlayer ? 'active-player' : 'active-opponent');
            }

            cell.addEventListener('click', () => {
                const noteIndex = chartData.notes.findIndex(n => 
                    n.time === msTime && n.direction === targetLane && n.type === typeStr
                );

                if (noteIndex > -1) {
                    chartData.notes.splice(noteIndex, 1);
                    cell.classList.remove('active-player', 'active-opponent');
                } else {
                    chartData.notes.push({
                        time: msTime, direction: targetLane, type: typeStr
                    });
                    cell.classList.add(isPlayer ? 'active-player' : 'active-opponent');
                }
            });

            row.appendChild(cell);
        }
        gridContainer.appendChild(row);
    }
}

function updateEditorPlaybackVisuals() {
    if (!editorAudio) return;

    const currentTime = editorAudio.currentTime;
    const currentTimeMs = currentTime * 1000;
    
    const timeDisplay = document.getElementById('audio-time-display');
    timeDisplay.innerText = `Time: ${currentTime.toFixed(2)}s`;

    if (!userIsScrubbing) {
        const scrubber = document.getElementById('timeline-scrubber');
        scrubber.value = currentTime;
    }

    const msPerRow = 60000 / chartData.bpm / 4;
    const currentExactRow = Math.floor(currentTimeMs / msPerRow);

    const activeRows = document.querySelectorAll('.grid-row.playback-current');
    activeRows.forEach(r => r.classList.remove('playback-current'));

    const targetRowElement = document.getElementById(`editor-row-${currentExactRow}`);
    if (targetRowElement) {
        targetRowElement.classList.add('playback-current');
        const gridContainer = document.getElementById('chart-grid');
        const rowTop = targetRowElement.offsetTop;
        const containerHeight = gridContainer.clientHeight;
        gridContainer.scrollTop = rowTop - (containerHeight / 2) + 21;
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
        audioUpdateInterval = setInterval(updateEditorPlaybackVisuals, 16);
        playBtn.innerText = 'Pause Music';
        isAudioPlaying = true;
    }
}

function exportChartJSON() {
    const bpmInput = document.getElementById('song-bpm');
    chartData.bpm = parseInt(bpmInput.value) || 100;

    const dataStr = JSON.stringify(chartData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'chart.json');
    linkElement.click();
}

window.addEventListener('load', () => {
    const fileUploader = document.getElementById('audio-uploader');
    const audioBtn = document.getElementById('btn-audio-play');
    const scrubber = document.createElement('input');
    
    scrubber.type = 'range'; scrubber.id = 'timeline-scrubber';
    scrubber.className = 'timeline-scrubber'; scrubber.value = 0;
    scrubber.min = 0; scrubber.max = 100; scrubber.step = 0.1;

    const scrubContainer = document.createElement('div');
    scrubContainer.className = 'scrub-container';
    const scrubLabel = document.createElement('label');
    scrubLabel.innerText = 'Song Timeline Scrubber:';
    
    scrubContainer.appendChild(scrubLabel);
    scrubContainer.appendChild(scrubber);

    const targetSidebar = document.querySelector('.audio-controls');
    targetSidebar.parentNode.insertBefore(scrubContainer, targetSidebar);

    fileUploader.addEventListener('change', (event) => {
        const file = event.target.files;
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            if (editorAudio) editorAudio.pause(); 
            editorAudio = new Audio(fileUrl);
            audioBtn.innerText = 'Play Music';
            isAudioPlaying = false;
            clearInterval(audioUpdateInterval);
            editorAudio.addEventListener('loadedmetadata', () => {
                scrubber.max = editorAudio.duration;
                scrubber.value = 0;
            });
        }
    });

    scrubber.addEventListener('input', () => {
        userIsScrubbing = true;
        if (editorAudio) {
            editorAudio.currentTime = scrubber.value;
            updateEditorPlaybackVisuals();
        }
    });

    scrubber.addEventListener('change', () => { userIsScrubbing = false; });
    audioBtn.addEventListener('click', toggleEditorAudio);
});
