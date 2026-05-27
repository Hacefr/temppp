// Object config tracking height, bounce thresholds, and dimensions for actors
const stageActors = {
    bpm: 100,
    lastCalculatedBeat: -1,
    bounceScale: 1.0, // Scale animation multiplier (1.0 = baseline scale size)
    
    opponent: {
        x: 280, y: 340, width: 140, height: 220, color: '#f9393f' // Red block
    },
    player: {
        x: 860, y: 340, width: 140, height: 220, color: '#12fa05' // Green block
    }
};

/**
 * Monitors continuous audio timelines to trigger scale expansion events on every musical beat step
 */
window.updateAndDrawCharacters = function() {
    // Read the active track BPM from loaded map parameters if active
    if (playableChart && playableChart.bpm) {
        stageActors.bpm = playableChart.bpm;
    }

    if (gameState.songPlaying) {
        // Calculate total song duration elapsed in beats
        // Formula: (Total Milliseconds / 1000) * (BPM / 60 seconds)
        const totalElapsedBeats = (gameState.elapsedTimeMs / 1000) * (stageActors.bpm / 60);
        const currentWholeBeat = Math.floor(totalElapsedBeats);

        // Beat Trigger check: Runs once per musical beat step milestone
        if (currentWholeBeat !== stageActors.lastCalculatedBeat) {
            stageActors.lastCalculatedBeat = currentWholeBeat;
            stageActors.bounceScale = 1.15; // Instantly swell characters outward by 15%
        }
    }

    // Smooth Interpolation Loop: Slowly slide the scaling factor back down to baseline 1.0 frame-by-frame
    stageActors.bounceScale += (1.0 - stageActors.bounceScale) * 0.12;

    // --- DRAW BACKGROUND STAGE AREA PLACEHOLDER ---
    ctx.fillStyle = '#0c0c0f'; // Dark horizon sky tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2a2a35'; // Stage floor surface slab tint
    ctx.fillRect(0, 480, canvas.width, canvas.height - 480);
    ctx.fillStyle = '#1c1c24'; // Front edge line accent bar
    ctx.fillRect(0, 480, canvas.width, 10);

    // --- DRAW OPPONENT CHARACTER PLACEHOLDER (Left Half) ---
    ctx.save();
    // Anchor transformations securely to the base center of the enemy bounding framework box
    const oppBaseX = stageActors.opponent.x + (stageActors.opponent.width / 2);
    const oppBaseY = stageActors.opponent.y + stageActors.opponent.height;
    
    ctx.translate(oppBaseX, oppBaseY);
    ctx.scale(1.0, stageActors.bounceScale); // Stretch upward dynamically on beat accents
    
    ctx.fillStyle = stageActors.opponent.color;
    ctx.fillRect(-stageActors.opponent.width / 2, -stageActors.opponent.height, stageActors.opponent.width, stageActors.opponent.height);
    
    // Draw simple white decorative eye visors inside actor grid spaces
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, -180, 40, 20);
    ctx.restore();

    // --- DRAW PLAYER CHARACTER PLACEHOLDER (Right Half) ---
    ctx.save();
    // Anchor transformations securely to the base center of Boyfriend's bounding framework box
    const plyBaseX = stageActors.player.x + (stageActors.player.width / 2);
    const plyBaseY = stageActors.player.y + stageActors.player.height;
    
    ctx.translate(plyBaseX, plyBaseY);
    ctx.scale(1.0, stageActors.bounceScale);
    
    ctx.fillStyle = stageActors.player.color;
    ctx.fillRect(-stageActors.player.width / 2, -stageActors.player.height, stageActors.player.width, stageActors.player.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-50, -180, 40, 20);
    ctx.restore();
};
