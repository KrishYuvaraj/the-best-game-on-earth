const cells = Array.from(document.querySelectorAll('.cell'));
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart-btn');
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const strikeEl = document.getElementById('strike');

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let scores = { X: 0, O: 0 };
let musicStarted = false;
let restartTimer = null;
let audioContext = null;
let masterGain = null;
let musicTimer = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function updateScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
}

function clearStrike() {
  strikeEl.classList.remove('show');
  strikeEl.style.width = '0px';
  strikeEl.style.left = '0px';
  strikeEl.style.top = '0px';
  strikeEl.style.transform = 'rotate(0deg)';
}

function drawStrike(combo) {
  const firstCell = cells[combo[0]];
  const lastCell = cells[combo[2]];
  const boardRect = document.getElementById('board').getBoundingClientRect();
  const firstRect = firstCell.getBoundingClientRect();
  const lastRect = lastCell.getBoundingClientRect();

  const startX = firstRect.left - boardRect.left + firstRect.width / 2;
  const startY = firstRect.top - boardRect.top + firstRect.height / 2;
  const endX = lastRect.left - boardRect.left + lastRect.width / 2;
  const endY = lastRect.top - boardRect.top + lastRect.height / 2;
  const length = Math.hypot(endX - startX, endY - startY);
  const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;

  strikeEl.style.width = `${length}px`;
  strikeEl.style.left = `${startX}px`;
  strikeEl.style.top = `${startY}px`;
  strikeEl.style.transform = `rotate(${angle}deg)`;
  strikeEl.classList.add('show');
}

function checkWinner() {
  for (const combo of winningCombinations) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      gameActive = false;
      drawStrike(combo);
      if (currentPlayer === 'X') {
        scores.X += 1;
      } else {
        scores.O += 1;
      }
      updateScores();

      if (scores.X === 5 || scores.O === 5) {
        setStatus(`Five wins reached! Score reset.`);
        scores.X = 0;
        scores.O = 0;
        updateScores();
        setTimeout(restartGame, 1600);
      } else {
        setStatus(`Congrats! You won!`);
      }
      return true;
    }
  }

  if (board.every((cell) => cell)) {
    gameActive = false;
    clearStrike();
    setStatus(`It's a tie!`);
    setTimeout(restartGame, 1400);
    return true;
  }

  return false;
}

function handleCellClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (!gameActive || board[index]) {
    return;
  }

  board[index] = currentPlayer;
  event.currentTarget.textContent = currentPlayer;
  event.currentTarget.classList.add(currentPlayer.toLowerCase());
  event.currentTarget.disabled = true;

  if (checkWinner()) {
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  setStatus(`Player ${currentPlayer}'s turn`);
}

function restartGame() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  board = Array(9).fill('');
  currentPlayer = 'X';
  gameActive = true;
  clearStrike();
  cells.forEach((cell) => {
    cell.textContent = '';
    cell.classList.remove('x', 'o');
    cell.disabled = false;
  });
  setStatus("Player X starts.");
  updateScores();
}

function startMusic() {
  if (musicStarted) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!audioContext) {
    audioContext = new AudioCtx();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.04;
    masterGain.connect(audioContext.destination);
  }

  const melody = [261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66];
  let noteIndex = 0;

  const playNote = () => {
    if (!musicStarted) return;

    const frequency = melody[noteIndex % melody.length];
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.03, audioContext.currentTime + 0.25);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.35);
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.4);
    noteIndex += 1;
    musicTimer = window.setTimeout(playNote, 1400);
  };

  audioContext.resume().then(() => {
    musicStarted = true;
    playNote();
  });
}

cells.forEach((cell) => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);
document.addEventListener('pointerdown', startMusic, { once: true });
document.addEventListener('mousedown', startMusic, { once: true });
document.addEventListener('keydown', startMusic, { once: true });
window.addEventListener('focus', startMusic);
updateScores();
