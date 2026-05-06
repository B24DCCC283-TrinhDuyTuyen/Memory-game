const GAME_LEVELS = [
    { level: 1, rows: 2, cols: 2, totalCards: 4, time: 30 },
    { level: 2, rows: 2, cols: 3, totalCards: 6, time: 60 },
    { level: 3, rows: 2, cols: 4, totalCards: 8, time: 90 },
    { level: 4, rows: 3, cols: 4, totalCards: 12, time: 120 },
    { level: 5, rows: 4, cols: 4, totalCards: 16, time: 150 },
    { level: 6, rows: 4, cols: 5, totalCards: 20, time: 180 }
];

let currentLevel = 0;
let flippedCards = [];
let matchedPairs = 0;
const icons = ['🐬', '🥳', '🦁', '🍕', '🌻', '🍒', '🐶', '🎁', '🌍', '🎹'];

let score = 0;
let timeRemaining = 0;
let timerInterval;
let isPaused = false; // Cờ kiểm tra trạng thái dừng game

document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.querySelector('.btn-play');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                window.location.href = 'gameplay.html';
            }, 500);
        });
    }

    const howBtn = document.querySelector('.btn-how');
    if (howBtn) {
        howBtn.addEventListener('click', () => {
            alert(
                'Cách chơi Memory Game:\n' +
                '- Bấm PLAY để bắt đầu trò chơi.\n' +
                '- Lật 2 thẻ mỗi lần để tìm cặp giống nhau.\n' +
                '- Nếu 2 thẻ trùng nhau, bạn sẽ ghi điểm và thẻ sẽ ở trạng thái mở.\n' +
                '- Nếu không trùng, thẻ sẽ úp lại sau 1 giây.\n' +
                '- Hoàn thành tất cả các cặp trước khi hết thời gian để qua level tiếp theo.\n' +
                'Chúc bạn chơi vui vẻ!'
            );
        });
    }

    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        initGame();
    }

    // --- LOGIC CHO BẢNG PAUSE ---
    const btnPause = document.querySelector('.btn-pause');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const btnResume = document.getElementById('btnResume');
    const btnResumeX = document.getElementById('btnResumeX');
    const btnMenu = document.getElementById('btnMenu');

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            isPaused = true;
            clearInterval(timerInterval); // Dừng đồng hồ
            pauseOverlay.style.display = 'flex'; // Hiện Popup
        });
    }

    const resumeGame = () => {
        isPaused = false;
        pauseOverlay.style.display = 'none';
        startTimer(); // Chạy lại đồng hồ
    };

    if (btnResume) btnResume.addEventListener('click', resumeGame);
    if (btnResumeX) btnResumeX.addEventListener('click', resumeGame);

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            window.location.href = 'index.html'; // Về trang chủ
        });
    }
});

function initGame() {
    const config = GAME_LEVELS[currentLevel];
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) return;

    flippedCards = [];
    matchedPairs = 0;
    isPaused = false; // Reset trạng thái pause

    if (currentLevel === 0) {
        score = 0;
    }
    updateScoreDisplay();

    timeRemaining = config.time;
    updateTimeDisplay();

    clearInterval(timerInterval);
    startTimer();

    const levelDisplay = document.getElementById('levelDisplay');
    if (levelDisplay) levelDisplay.innerText = `${config.level}/6`;
    gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;

    let selectedIcons = icons.slice(0, config.totalCards / 2);
    let cardPool = [...selectedIcons, ...selectedIcons];
    shuffle(cardPool);

    gameBoard.innerHTML = '';
    cardPool.forEach(icon => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;

        card.innerHTML = `
            <div class="card-back"></div>
            <div class="card-front">${icon}</div>
        `;

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

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    timerDisplay.innerText = `${formattedMinutes}:${formattedSeconds}`;
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
    if (isPaused) return; // Nếu đang Pause thì không cho lật bài

    if (flippedCards.length < 2 && !this.classList.contains('flipped')) {
        this.classList.add('flipped');
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            checkMatch();
        }
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.icon === card2.dataset.icon) {
        matchedPairs++;
        flippedCards = [];

        score += 10;
        updateScoreDisplay();

        const config = GAME_LEVELS[currentLevel];
        if (matchedPairs === config.totalCards / 2) {
            clearInterval(timerInterval);

            setTimeout(() => {
                if (currentLevel < GAME_LEVELS.length - 1) {
                    alert(`Tuyệt vời! Bạn đã vượt qua Level ${config.level} với ${score} điểm!`);
                    currentLevel++;
                    initGame();
                } else {
                    alert(`CHÚC MỪNG! Bạn đã phá đảo tựa game này. Tổng điểm: ${score}`);
                    window.location.href = 'index.html';
                }
            }, 600);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}

function gameOver() {
    alert(`Rất tiếc, bạn đã hết thời gian! Điểm của bạn là ${score}. Vui lòng chơi lại.`);
    currentLevel = 0;
    initGame();
}