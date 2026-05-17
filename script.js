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
let gameOverOverlay, gameOverMessage, btnEndGame;

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
    if (cols > 6) cols = 6;
    let rows = Math.ceil(totalCards / cols);
    let time = 15 + (levelIdx * 10);

    return { level: levelNum, rows, cols, totalCards, time };
}

// --- QUẢN LÝ BẢNG XẾP HẠNG (LEADERBOARD) ---
function saveToLeaderboard(playerName, finalScore, finalLevel) {
    if (!playerName || playerName.trim() === "") playerName = "Anonymous";
    let leaderboard = JSON.parse(localStorage.getItem('memoryLeaderboard')) || [];

    leaderboard.push({
        name: playerName.trim(),
        score: finalScore,
        level: finalLevel,
        date: new Date().toLocaleDateString()
    });

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('memoryLeaderboard', JSON.stringify(leaderboard));
}

function renderLeaderboard() {
    const listContainer = document.getElementById('leaderboardList');
    if (!listContainer) return;
    const leaderboard = JSON.parse(localStorage.getItem('memoryLeaderboard')) || [];

    // Xóa danh sách cũ đi
    listContainer.innerHTML = '';

    if (leaderboard.length === 0) {
        listContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">Chưa có thành tích nào!</div>';
        return;
    }

    // Tạo một bảng Table để hiển thị Tên, Level, Điểm thẳng hàng, rõ ràng
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontFamily = 'Arial, sans-serif';
    table.style.fontSize = '16px';
    table.style.color = '#333';

    // Tạo hàng tiêu đề (Header) cho bảng
    table.innerHTML = `
        <thead>
            <tr style="background-color: #f2f2f2; border-bottom: 2px solid #ccc; text-align: left;">
                <th style="padding: 10px;">Hạng</th>
                <th style="padding: 10px;">Tên</th>
                <th style="padding: 10px; text-align: center;">Level</th>
                <th style="padding: 10px; text-align: right;">Điểm số</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    // Duyệt qua danh sách và chèn từng dòng vào bảng
    leaderboard.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee';
        if (index < 3) {
            // Làm nổi bật Top 3 hàng đầu bằng màu nền nhẹ
            tr.style.backgroundColor = index === 0 ? '#fff9e6' : index === 1 ? '#f7f7f7' : '#fffcf5';
        }

        const displayLevel = item.level ? `${item.level}` : '-';
        const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

        tr.innerHTML = `
            <td style="padding: 10px; font-weight: bold; width: 60px;">${rankBadge}</td>
            <td style="padding: 10px; font-weight: 500; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</td>
            <td style="padding: 10px; text-align: center; color: #666; font-weight: bold;">${displayLevel}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #1e4a9e;">${item.score} Pts</td>
        `;
        tbody.appendChild(tr);
    });

    listContainer.appendChild(table);
}

// --- KHỞI TẠO SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    const btnInitialPlay = document.getElementById('btnInitialPlay');
    const nameInputArea = document.getElementById('nameInputArea');
    const playerNameInput = document.getElementById('playerNameInput');
    const btnStartGame = document.getElementById('btnStartGame');

    const howBtn = document.querySelector('.btn-how');
    const backBtn = document.getElementById('btn-back');
    const howScreen = document.getElementById('how-to-play-screen');

    const btnOpenLeaderboard = document.getElementById('btnOpenLeaderboard');
    const btnCloseLeaderboard = document.getElementById('btnCloseLeaderboard');
    const btnCloseLeaderboardBtn = document.getElementById('btnCloseLeaderboardBtn');
    const leaderboardOverlay = document.getElementById('leaderboardOverlay');

    if (btnInitialPlay && nameInputArea) {
        btnInitialPlay.addEventListener('click', () => {
            btnInitialPlay.style.display = 'none';
            nameInputArea.style.display = 'flex';
        });
    }

    if (btnStartGame && playerNameInput) {
        btnStartGame.addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            if (!name) {
                alert("Vui lòng nhập tên của bạn trước khi chơi!");
                return;
            }
            localStorage.setItem('currentMemoryPlayer', name);
            window.location.href = './gameplay.html';
        });
    }

    if (btnOpenLeaderboard && leaderboardOverlay) {
        btnOpenLeaderboard.addEventListener('click', () => {
            renderLeaderboard();
            leaderboardOverlay.style.display = 'flex';
        });
    }
    if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener('click', () => leaderboardOverlay.style.display = 'none');
    if (btnCloseLeaderboardBtn) btnCloseLeaderboardBtn.addEventListener('click', () => leaderboardOverlay.style.display = 'none');

    if (howBtn && howScreen && backBtn) {
        howBtn.addEventListener('click', () => howScreen.style.display = 'flex');
        backBtn.addEventListener('click', () => howScreen.style.display = 'none');
    }

    // Các biến Màn chơi (gameplay.html)
    const gameBoard = document.getElementById('gameBoard');
    levelOverlay = document.getElementById('levelOverlay');
    levelMessage = document.getElementById('levelMessage');
    btnContinueLevel = document.getElementById('btnContinueLevel');
    btnLevelMenu = document.getElementById('btnLevelMenu');
    gameOverOverlay = document.getElementById('gameOverOverlay');
    gameOverMessage = document.getElementById('gameOverMessage');
    btnEndGame = document.getElementById('btnEndGame');

    if (gameBoard) {
        currentLevel = 0;
        score = 0;
        initGame();
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

    if (btnEndGame) {
        btnEndGame.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    // Logic Tạm dừng (Pause)
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
function initGame() {
    const config = getLevelConfig(currentLevel);
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) return;

    flippedCards = [];
    matchedPairs = 0;
    isPaused = false;

    if (currentLevel === 0) score = 0;
    updateScoreDisplay();

    timeRemaining = config.time;
    updateTimeDisplay();

    clearInterval(timerInterval);
    startTimer();

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

    const currentRealPlayer = localStorage.getItem('currentMemoryPlayer') || "Anonymous";
    saveToLeaderboard(currentRealPlayer, score, (currentLevel + 1));

    if (gameOverOverlay && gameOverMessage) {
        gameOverMessage.innerText = `Game Over! Bạn dừng lại ở Level ${currentLevel + 1}.\nTổng điểm: ${score} điểm.\nThành tích đã được lưu vào Bảng xếp hạng!`;
        gameOverOverlay.style.display = 'flex';
    }
}