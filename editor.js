// Data model tracking placed notes internally
let chartData = {
    bpm: 100,
    notes: []
};

/**
 * Switch screen visibility between gameplay canvas and layout editor grid
 */
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
    }
}

/**
 * Generates scrollable rows mapping note data configurations
 */
function renderEditorGrid() {
    const gridContainer = document.getElementById('chart-grid');
    gridContainer.innerHTML = ''; // Empty previous renderings

    const totalRows = 64; // Max chart layout grid size definition
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const row = document.createElement('div');
        row.className = 'grid-row';

        // Calculate approximate millisecond placement timeline
        // Based on grid steps at a standard tempo
        const msTime = Math.floor(rowIndex * (60000 / chartData.bpm / 4));

        for (let colIndex = 0; colIndex < 8; colIndex++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const isPlayer = colIndex >= 4;
            const targetLane = isPlayer ? colIndex - 4 : colIndex;
            const typeStr = isPlayer ? 'player' : 'opponent';

            // Check if note configuration matches current cell
            const hasNote = chartData.notes.some(n => 
                n.time === msTime && 
                n.direction === targetLane && 
                n.type === typeStr
            );

            if (hasNote) {
                cell.classList.add(isPlayer ? 'active-player' : 'active-opponent');
            }

            // Click listener function to add or clear notes
            cell.addEventListener('click', () => {
                const noteIndex = chartData.notes.findIndex(n => 
                    n.time === msTime && 
                    n.direction === targetLane && 
                    n.type === typeStr
                );

                if (noteIndex > -1) {
                    // Remove if note already exists
                    chartData.notes.splice(noteIndex, 1);
                    cell.classList.remove('active-player', 'active-opponent');
                } else {
                    // Save new note item parameters
                    chartData.notes.push({
                        time: msTime,
                        direction: targetLane,
                        type: typeStr
                    });
                    cell.classList.add(isPlayer ? 'active-player' : 'active-opponent');
                }
            });

            row.appendChild(cell);
        }
        gridContainer.appendChild(row);
    }
}

/**
 * Package compiled user structural data into a saveable text asset
 */
function exportChartJSON() {
    const bpmInput = document.getElementById('song-bpm');
    chartData.bpm = parseInt(bpmInput.value) || 100;

    const dataStr = JSON.stringify(chartData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + 
        encodeURIComponent(dataStr);

    const exportFileDefaultName = 'chart.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

console.log('Chart editor grid system compiled successfully.');
