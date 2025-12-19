/* ================= CONFIG ================= */
const GAME_CONFIG = {
    AI_DELAY: 500,
    ROOM_CODE_LENGTH: 6
};

/* ================= ELEMENTS ================= */
const elements = {
    appContainer: document.getElementById("appContainer"),
    loadingScreen: document.getElementById("loadingScreen"),
    boardEl: document.getElementById("board"),
    turnEl: document.getElementById("turn"),
    modeDisplay: document.getElementById("modeDisplay"),
    scoreDisplay: document.getElementById("scoreDisplay"),
    restartBtn: document.getElementById("restartBtn"),
    mainMenu: document.getElementById("mainMenu"),
    onlineMenu: document.getElementById("onlineMenu"),
    createRoomDisplay: document.getElementById("createRoomDisplay"),
    joinRoomDisplay: document.getElementById("joinRoomDisplay"),
    gameArea: document.getElementById("gameArea"),
    roomCodeEl: document.getElementById("roomCode"),
    roomCodeInput: document.getElementById("roomCodeInput"),
    toast: document.getElementById("toast")
};

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyA9KUHhogNDG-GkDnkzwEz5dtxbJSPrLKA",
  authDomain: "tictactoe-f2254.firebaseapp.com",
  databaseURL: "https://tictactoe-f2254-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tictactoe-f2254",
  storageBucket: "tictactoe-f2254.firebasestorage.app",
  messagingSenderId: "563411269072",
  appId: "1:563411269072:web:6d7e7efdf4ab2ef99035d5",
  measurementId: "G-SKJP20NCHD"
};

let db = null;
(function initFirebase() {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
})();

/* ================= GAME STATE ================= */
let gameState = {
    mode: "",
    board: Array(9).fill(""),
    currentPlayer: "X",
    gameOver: false,
    roomId: "",
    mySymbol: "",
    myTurn: true,
    score: { X: 0, O: 0 }
};

const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

/* ================= WIN CHECK ================= */
function checkWinner(player, board = gameState.board) {
    for (const pattern of WIN_PATTERNS) {
        if (pattern.every(idx => board[idx] === player)) return true;
    }
    return false;
}

function getWinningIndices(player, board = gameState.board) {
    for (const pattern of WIN_PATTERNS) {
        if (pattern.every(idx => board[idx] === player)) return pattern;
    }
    return null;
}

/* ================= UTILS ================= */
function showToast(msg, type = "info") {
    elements.toast.textContent = msg;
    elements.toast.className = `toast show ${type}`;
    setTimeout(() => elements.toast.classList.remove("show"), 3000);
}

function hideAll() {
    [elements.mainMenu, elements.onlineMenu, elements.createRoomDisplay, elements.joinRoomDisplay, elements.gameArea].forEach(e => e.classList.add("hidden"));
}

function resetScores() {
    gameState.score = { X: 0, O: 0 };
    elements.scoreDisplay.textContent = "0 - 0";
}

/* ================= NAVIGATION ================= */
function selectGameType(type) {
    if (gameState.roomId) db.ref("rooms/" + gameState.roomId).off(); // Cleanup old listeners
    resetScores();
    gameState.mode = type;
    hideAll();

    if (type === "online") elements.onlineMenu.classList.remove("hidden");
    else if (type === "offline") startOfflineGame();
    else if (type === "computer") startComputerGame();
}

function goBackToOnlineMenu() {
    // cleanup any active room listeners and delete room if host
    try {
        if (gameState.roomId && db) {
            db.ref("rooms/" + gameState.roomId + "/players").off();
            // if current client is the host (X) and room exists, remove it
            if (gameState.mySymbol === 'X') {
                db.ref("rooms/" + gameState.roomId).remove().catch(() => {});
            }
        }
    } catch (e) {
        console.warn('cleanup error', e);
    }
    gameState.roomId = "";
    gameState.mySymbol = "";
    hideAll();
    elements.onlineMenu.classList.remove("hidden");
}

// Back to main from online menu (HTML calls goBackToMain)
function goBackToMain() {
    // reuse goToMainMenu for cleanup
    goToMainMenu();
}

// Show create/join UI inside online menu
function selectOnlineMode(mode) {
    gameState.mode = 'online';
    if (mode === 'create') {
        createRoom();
    } else if (mode === 'join') {
        hideAll();
        elements.joinRoomDisplay.classList.remove('hidden');
    }
}

function goToMainMenu() {
    try {
        if (gameState.roomId && db) {
            db.ref("rooms/" + gameState.roomId + "/players").off();
            if (gameState.mySymbol === 'X') {
                db.ref("rooms/" + gameState.roomId).remove().catch(() => {});
            }
        }
    } catch (e) {
        console.warn('cleanup error', e);
    }
    gameState.roomId = "";
    gameState.mySymbol = "";
    hideAll();
    elements.mainMenu.classList.remove("hidden");
}

/* ================= ONLINE LOGIC ================= */
function createRoom() {
    // generate room id and show UI immediately so user gets a code even if DB fails
    gameState.roomId = Math.floor(100000 + Math.random() * 900000).toString();
    gameState.mySymbol = "X";
    elements.createRoomDisplay.classList.remove("hidden");
    elements.roomCodeEl.innerText = gameState.roomId;

    if (!db) {
        showToast('Room ready (local). Database not available.', 'warning');
        return;
    }

    const roomRef = db.ref("rooms/" + gameState.roomId);
    // write room to DB
    roomRef.set({
        board: Array(9).fill("") ,
        currentPlayer: "X",
        gameOver: false,
        score: { X: 0, O: 0 },
        players: ["X"]
    }).then(() => {
        showToast('Room created: ' + gameState.roomId, 'success');

        // ensure previous listener removed
        db.ref("rooms/" + gameState.roomId + "/players").off();

        // Listener for opponent joining
        db.ref("rooms/" + gameState.roomId + "/players").on("value", snap => {
            const players = snap.val();
            if (players && players.includes("O")) {
                showToast("Opponent Joined!", "success");
                setTimeout(() => {
                    startOnlineGame();
                    listenForMoves();
                }, 500);
            }
        });
    }).catch(err => {
        console.error('createRoom error', err);
        showToast('Failed to create room on server; room shown locally.', 'warning');
    });
}

function joinRoomWithCode() {
    const code = elements.roomCodeInput.value.trim();
    if (code.length !== 6) return showToast("Invalid Code");

    const roomRef = db.ref("rooms/" + code);
    roomRef.once("value").then(snap => {
        if (!snap.exists()) return showToast("Room not found");
        const data = snap.val();
        const players = data.players || [];
        if (players.length >= 2) return showToast("Room is full");

        gameState.roomId = code;
        gameState.mySymbol = "O";

        // Use a transaction to avoid clobbering other clients
        const playersRef = db.ref("rooms/" + code + "/players");
        playersRef.transaction(curr => {
            if (!curr) return ["X", "O"];
            if (curr.includes('O')) return; // already joined
            if (curr.length >= 2) return; // full
            curr.push('O');
            return curr;
        }, (err, committed, snapshot) => {
            if (err) {
                console.error('players transaction error', err);
                return showToast('Failed to join room', 'error');
            }
            if (!committed) {
                return showToast('Room is full or already joined', 'warning');
            }
            showToast('Joined room ' + code, 'success');
            startOnlineGame();
            listenForMoves();
        });
    }).catch(err => {
        console.error('joinRoomWithCode error', err);
        showToast('Failed to join room', 'error');
    });
}

function startOnlineGame() {
    hideAll();
    elements.gameArea.classList.remove("hidden");
    elements.modeDisplay.textContent = "Online";
}

function listenForMoves() {
    if (!gameState.roomId) return console.warn('listenForMoves called without roomId');
    const roomRef = db.ref("rooms/" + gameState.roomId);
    // remove any existing value listeners to avoid duplicate callbacks
    roomRef.off('value');
    roomRef.on("value", snap => {
        const data = snap.val();
        if (!data) return;

        // Defensive defaults
        gameState.board = Array.isArray(data.board) ? data.board : Array(9).fill("");
        gameState.currentPlayer = data.currentPlayer || 'X';
        gameState.gameOver = !!data.gameOver;
        gameState.myTurn = (gameState.currentPlayer === gameState.mySymbol);

        console.log('room update', { room: gameState.roomId, currentPlayer: gameState.currentPlayer, players: data.players });

        renderBoard();

        // sync score from server if present
        if (data.score) {
            gameState.score = { X: data.score.X || 0, O: data.score.O || 0 };
            elements.scoreDisplay.textContent = `${gameState.score.X} - ${gameState.score.O}`;
        }

        // If server already marked game over, update UI and skip calling end handlers
        if (gameState.gameOver) {
            elements.turnEl.innerText = data.currentPlayer === gameState.mySymbol ? `Your Turn (${gameState.mySymbol})` : elements.turnEl.innerText;
            return;
        }

        if (checkWinner("X", gameState.board)) return endOnlineGame("X");
        if (checkWinner("O", gameState.board)) return endOnlineGame("O");
        if (gameState.board.every(c => c !== "")) {
            elements.turnEl.innerText = "Draw!";
            gameState.gameOver = true;
            return;
        }

        updateTurnDisplay();
    });
}

/* ================= LOCAL GAME ================= */
function startOfflineGame() {
    resetLocalGame("Offline Multiplayer");
}

function startComputerGame() {
    resetLocalGame("vs Computer");
}

function resetLocalGame(label) {
    gameState.board = Array(9).fill("");
    gameState.currentPlayer = "X";
    gameState.gameOver = false;
    gameState.myTurn = true;
    hideAll();
    elements.gameArea.classList.remove("hidden");
    elements.modeDisplay.textContent = label;
    renderBoard();
    updateTurnDisplay();
}

/* ================= GAMEPLAY ================= */
function handleCellClick(e) {
    const i = e.target.dataset.index;
    if (gameState.gameOver || gameState.board[i] !== "") return;
    if (gameState.mode === "online" && !gameState.myTurn) return;

    makeMove(i);
}

function makeMove(i) {
    if (gameState.mode === "online") {
        gameState.board[i] = gameState.mySymbol;
        const next = gameState.mySymbol === "X" ? "O" : "X";
        db.ref("rooms/" + gameState.roomId).update({
            board: gameState.board,
            currentPlayer: next
        });
        return;
    }

    gameState.board[i] = gameState.currentPlayer;
    renderBoard();

    if (checkWinner(gameState.currentPlayer)) return endGame(gameState.currentPlayer);
    if (gameState.board.every(c => c !== "")) {
        gameState.gameOver = true;
        elements.turnEl.innerText = "Draw!";
        return;
    }

    switchTurn();
}

function switchTurn() {
    gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
    updateTurnDisplay();
    if (gameState.mode === "computer" && gameState.currentPlayer === "O") {
        setTimeout(makeAIMove, GAME_CONFIG.AI_DELAY);
    }
}

/* ================= AI ================= */
function makeAIMove() {
    let best = -1, bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === "") {
            gameState.board[i] = "O";
            let score = minimax(gameState.board, 0, false);
            gameState.board[i] = "";
            if (score > bestScore) {
                bestScore = score;
                best = i;
            }
        }
    }
    if (best !== -1) makeMove(best);
}

function minimax(b, d, isMax) {
    if (checkWinner("O", b)) return 10 - d;
    if (checkWinner("X", b)) return d - 10;
    if (b.every(c => c !== "")) return 0;

    if (isMax) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === "") {
                b[i] = "O";
                best = Math.max(best, minimax(b, d + 1, false));
                b[i] = "";
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === "") {
                b[i] = "X";
                best = Math.min(best, minimax(b, d + 1, true));
                b[i] = "";
            }
        }
        return best;
    }
}

/* ================= UI ================= */
function renderBoard() {
    elements.boardEl.innerHTML = "";
    const winningX = getWinningIndices('X', gameState.board);
    const winningO = getWinningIndices('O', gameState.board);
    gameState.board.forEach((v, i) => {
        const c = document.createElement("div");
        c.className = `cell ${v ? 'occupied' : ''}`;
        if (v === 'X') c.classList.add('x-player');
        if (v === 'O') c.classList.add('o-player');
        // highlight winning cells
        if (winningX && winningX.includes(i)) c.classList.add('win');
        if (winningO && winningO.includes(i)) c.classList.add('win');
        c.dataset.index = i;
        c.innerText = v;
        c.onclick = handleCellClick;
        elements.boardEl.appendChild(c);
    });
}

function updateTurnDisplay() {
    if (gameState.mode === "online") {
        elements.turnEl.innerText = gameState.myTurn ? `Your Turn (${gameState.mySymbol})` : "Opponent's Turn";
    } else {
        elements.turnEl.innerText = `Turn: ${gameState.currentPlayer}`;
    }
}

function endGame(w) {
    gameState.gameOver = true;
    gameState.score[w]++;
    elements.scoreDisplay.textContent = `${gameState.score.X} - ${gameState.score.O}`;
    elements.turnEl.innerText = `${w} Wins!`;
}

function endOnlineGame(w) {
    // mark locally first
    gameState.gameOver = true;
    elements.turnEl.innerText = w === gameState.mySymbol ? "You Won!" : "You Lost!";

    if (!db || !gameState.roomId) {
        // fallback: just increment locally
        if (!gameState.score) gameState.score = { X: 0, O: 0 };
        gameState.score[w] = (gameState.score[w] || 0) + 1;
        elements.scoreDisplay.textContent = `${gameState.score.X} - ${gameState.score.O}`;
        return;
    }

    const roomRef = db.ref("rooms/" + gameState.roomId);
    // Use a transaction to atomically increment score and set gameOver only once
    roomRef.transaction(curr => {
        if (!curr) return; // nothing to do
        if (curr.gameOver) return; // another client already finished and updated
        curr.score = curr.score || { X: 0, O: 0 };
        curr.score[w] = (curr.score[w] || 0) + 1;
        curr.gameOver = true;
        return curr;
    }, (err, committed, snapshot) => {
        if (err) {
            console.error('endOnlineGame transaction error', err);
            return;
        }
        // If committed, the server state reflects the increment; otherwise someone else updated it
        const server = snapshot ? snapshot.val() : null;
        if (server && server.score) {
            gameState.score = { X: server.score.X || 0, O: server.score.O || 0 };
            elements.scoreDisplay.textContent = `${gameState.score.X} - ${gameState.score.O}`;
        }
    });
}

/* ================= RESTART ================= */
elements.restartBtn.onclick = () => {
    if (gameState.mode === "online") {
        db.ref("rooms/" + gameState.roomId).update({
            board: Array(9).fill(""),
            currentPlayer: "X",
            gameOver: false
        });
    } else {
        resetLocalGame(gameState.mode === "computer" ? "vs Computer" : "Offline Multiplayer");
    }
};

window.onload = () => {
    setTimeout(() => {
        elements.loadingScreen.classList.add("hidden");
        elements.appContainer.classList.remove("hidden");
    }, 800);
};