let soundEnabled = true;
let sounds = {};

const soundFiles = {
    placePiece: 'place-piece.mp3',
    undo: 'undo.mp3',
    reset: 'reset.mp3',
    startGame: 'start-game.mp3',
    finish: 'finish.mp3',
};

function initAudio() {
    Object.keys(soundFiles).forEach(key => {
        sounds[key] = new Audio(soundFiles[key]);
        sounds[key].preload = 'auto';
        sounds[key].volume = 0.5;

        sounds[key].addEventListener('error', (e) => {
            console.log(`音声ファイル ${soundFiles[key]} の読み込みに失敗しました`);
        });
    });
}

function playSound(soundName) {
    if (!soundEnabled || !sounds[soundName]) return;
    
    try {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {
            console.log(`効果音の再生に失敗: ${soundName}`);
        });
    } catch (e) {
        console.log(`効果音の再生エラー: ${soundName}`);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;

    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.textContent = soundEnabled ? '🔊' : '🔇';
        btn.classList.toggle('enabled', soundEnabled);
        btn.classList.toggle('disabled', !soundEnabled);
    }

    const titleBtn = document.getElementById('titleSoundToggle');
    if (titleBtn) {
        titleBtn.textContent = soundEnabled ? '🔊' : '🔇';
        titleBtn.classList.toggle('enabled', soundEnabled);
        titleBtn.classList.toggle('disabled', !soundEnabled);
    }
    
    if (soundEnabled) {
        playSound('startGame');
    }
}

function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    updateSoundButtonsState();
}

function isSoundEnabled() {
    return soundEnabled;
}

function updateSoundButtonsState() {
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.textContent = soundEnabled ? '🔊' : '🔇';
        btn.classList.toggle('enabled', soundEnabled);
        btn.classList.toggle('disabled', !soundEnabled);
    }

    const titleBtn = document.getElementById('titleSoundToggle');
    if (titleBtn) {
        titleBtn.textContent = soundEnabled ? '🔊' : '🔇';
        titleBtn.classList.toggle('enabled', soundEnabled);
        titleBtn.classList.toggle('disabled', !soundEnabled);
    }
}

function setupAudioEventListeners() {
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
    }

    const titleSoundToggle = document.getElementById('titleSoundToggle');
    if (titleSoundToggle) {
        titleSoundToggle.addEventListener('click', toggleSound);
    }
}