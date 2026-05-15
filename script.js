// --- KHAI BÁO BIẾN TOÀN CỤC ---
let currentLevel = 0;
let flippedCards = [];
let matchedPairs = 0;
const icons = ['🐬', '🥳', '🦁', '🍕', '🌻', '🍒', '🐶', '🎁', '🌍', '🎹', '🚀', '🎨', '🍦', '🏀', '🎮', '🦄', '🐝', '🦊', '🍀', '🍎', '🐯', '🐙', '🦖', '⚽', '🎸'];

let score = 0;
let timeRemaining = 0;
let timerInterval;
let isPaused = false;
let levelOverlay, levelMessage, btnContinueLevel, btnLevelMenu;
let isFinalLevelPopup = false;
let gameOverOverlay, gameOverMessage, btnTryAgain, btnEndGame;
let resumeOverlay, btnStartNewGame, btnContinuePreviousGame;
let savedProgress = null;
let resumeSavedGame = false;

// --- QUẢN LÝ ÂM THANH ---
const sounds = {
    flip: new Audio('assets/sounds/flip.mp3'),
    match: new Audio('assets/sounds/match.mp3'),
    wrong: new Audio('assets/sounds/wrong.mp3'),
    win: new Audio('assets/sounds/win.mp3'),
    gameover: new Audio('assets/sounds/gameover.mp3')
};

function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log("Audio play blocked"));
    }
}

// --- CẤU HÌNH LEVEL VÔ HẠN ---
function getLevelConfig(levelIdx) {
    const levelNum = levelIdx + 1;
    let totalPairs = 2 + levelIdx;
    if (totalPairs > icons.length) totalPairs = icons.length;

    let totalCards = totalPairs * 2;
    let cols = Math.ceil(Math.sqrt(totalCards));
    if (cols > 6) cols = 6; // Giới hạn tối đa 6 cột để tránh vỡ giao diện
    let rows = Math.ceil(totalCards / cols);
    let time = 15 + (levelIdx * 10);

    return { level: levelNum, rows, cols, totalCards, time };
}

// --- LƯU TRỮ DỮ LIỆU ---
function saveGameProgress() {
    const data = { level: currentLevel, score, timeRemaining };
    localStorage.setItem('memoryGameSave', JSON.stringify(data));
}

function loadGameProgress() {
    const raw = localStorage.getItem('memoryGameSave');
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        return {
            level: Number(data.level) || 0,
            score: Number(data.score) || 0,
            timeRemaining: Number(data.timeRemaining) || 0
        };
    } catch (error) { return null; }
}

function clearGameProgress() {
    localStorage.removeItem('memoryGameSave');
}

// --- KHỞI TẠO SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.querySelector('.btn-play');
    const howBtn = document.querySelector('.btn-how');
    const backBtn = document.getElementById('btn-back');
    const howScreen = document.getElementById('how-to-play-screen');

    resumeOverlay = document.getElementById('resumeOverlay');
    btnStartNewGame = document.getElementById('btnStartNewGame');
    btnContinuePreviousGame = document.getElementById('btnContinuePreviousGame');

    savedProgress = loadGameProgress();

    if (howBtn && howScreen && backBtn) {
        howBtn.addEventListener('click', () => howScreen.style.display = 'flex');
        backBtn.addEventListener('click', () => howScreen.style.display = 'none');
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (savedProgress) {
                if (resumeOverlay) resumeOverlay.style.display = 'flex';
            } else {
                window.location.href = './gameplay.html';
            }
        });
    }

    if (btnStartNewGame && resumeOverlay) {
        btnStartNewGame.addEventListener('click', () => {
            clearGameProgress();
            window.location.href = './gameplay.html';
        });
    }

    if (btnContinuePreviousGame && resumeOverlay) {
        btnContinuePreviousGame.addEventListener('click', () => {
            window.location.href = './gameplay.html';
        });
    }

    // Các biến Gameplay
    const gameBoard = document.getElementById('gameBoard');
    levelOverlay = document.getElementById('levelOverlay');
    levelMessage = document.getElementById('levelMessage');
    btnContinueLevel = document.getElementById('btnContinueLevel');
    btnLevelMenu = document.getElementById('btnLevelMenu');
    gameOverOverlay = document.getElementById('gameOverOverlay');
    gameOverMessage = document.getElementById('gameOverMessage');
    btnTryAgain = document.getElementById('btnTryAgain');
    btnEndGame = document.getElementById('btnEndGame');

    if (gameBoard) {
        const progress = loadGameProgress();
        if (progress) {
            resumeSavedGame = true;
            currentLevel = progress.level;
            score = progress.score;
        }
        initGame(resumeSavedGame);
    }

    if (btnContinueLevel) {
        btnContinueLevel.addEventListener('click', () => {
            levelOverlay.style.display = 'none';
            currentLevel++;
            initGame();
        });
    }

    if (btnLevelMenu) {
        btnLevelMenu.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    if (btnTryAgain) {
        btnTryAgain.addEventListener('click', () => {
            gameOverOverlay.style.display = 'none';
            initGame();
        });
    }

    if (btnEndGame) {
        btnEndGame.addEventListener('click', () => {
            clearGameProgress();
            window.location.href = './index.html';
        });
    }

    // Logic Pause
    const btnPause = document.querySelector('.btn-pause');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const btnResume = document.getElementById('btnResume');
    const btnResumeX = document.getElementById('btnResumeX');
    const btnMenu = document.getElementById('btnMenu');

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            isPaused = true;
            clearInterval(timerInterval);
            pauseOverlay.style.display = 'flex';
        });
    }

    const resumeGame = () => {
        isPaused = false;
        pauseOverlay.style.display = 'none';
        startTimer();
    };

    if (btnResume) btnResume.addEventListener('click', resumeGame);
    if (btnResumeX) btnResumeX.addEventListener('click', resumeGame);
    if (btnMenu) btnMenu.addEventListener('click', () => window.location.href = './index.html');
});

// --- CÁC HÀM LOGIC GAME ---
function initGame(restoreSavedTime = false) {
    const config = getLevelConfig(currentLevel);
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) return;

    flippedCards = [];
    matchedPairs = 0;
    isPaused = false;

    if (currentLevel === 0) score = 0;
    updateScoreDisplay();

    if (restoreSavedTime) {
        const stored = loadGameProgress();
        timeRemaining = stored?.timeRemaining > 0 ? stored.timeRemaining : config.time;
    } else {
        timeRemaining = config.time;
    }
    updateTimeDisplay();

    clearInterval(timerInterval);
    startTimer();
    saveGameProgress();

    const levelDisplay = document.getElementById('levelDisplay');
    if (levelDisplay) levelDisplay.innerText = `Level: ${config.level}`;

    gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;

    let selectedIcons = icons.slice(0, config.totalCards / 2);
    let cardPool = [...selectedIcons, ...selectedIcons];
    shuffle(cardPool);

    gameBoard.innerHTML = '';
    cardPool.forEach(icon => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;
        card.innerHTML = `<div class="card-back"></div><div class="card-front">${icon}</div>`;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimeDisplay();
        saveGameProgress();
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            gameOver();
        }
    }, 1000);
}

function updateTimeDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;
    const min = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const sec = (timeRemaining % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${min}:${sec}`;
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) scoreDisplay.innerText = score;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function flipCard() {
    if (isPaused) return;
    if (flippedCards.length < 2 && !this.classList.contains('flipped')) {
        playSound('flip');
        this.classList.add('flipped');
        flippedCards.push(this);
        if (flippedCards.length === 2) checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const config = getLevelConfig(currentLevel);

    if (card1.dataset.icon === card2.dataset.icon) {
        playSound('match');
        matchedPairs++;
        flippedCards = [];
        score += 10;
        updateScoreDisplay();
        saveGameProgress();

        if (matchedPairs === config.totalCards / 2) {
            clearInterval(timerInterval);
            setTimeout(() => {
                playSound('win');
                if (levelOverlay && levelMessage) {
                    levelMessage.innerText = `Tuyệt vời! Bạn đã vượt qua Level ${currentLevel + 1} với ${score} điểm!`;
                    btnContinueLevel.style.display = 'inline-block';
                    isFinalLevelPopup = false;
                    levelOverlay.style.display = 'flex';
                    levelOverlay.classList.remove('level-win-effect', 'final-win-effect');
                    levelOverlay.classList.add('level-win-effect');
                }
                saveGameProgress();
            }, 2000);
        }
    } else {
        setTimeout(() => {
            playSound('wrong');
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 700);
    }
}

function gameOver() {
    isPaused = true;
    playSound('gameover');
    clearGameProgress();
    if (gameOverOverlay && gameOverMessage) {
        gameOverMessage.innerText = `Game Over! Bạn dừng lại ở Level ${currentLevel + 1}. Tổng điểm: ${score}`;
        gameOverOverlay.style.display = 'flex';
    }
}