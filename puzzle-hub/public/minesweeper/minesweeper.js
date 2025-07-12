/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * minesweeper.js - Minesweeper game logic
 */
(function () {
  "use strict";

  let board = [];
  let size = 8;
  let mineCount = 0;
  let revealedMap = [];
  let gameOver = false;

  window.addEventListener("load", init);

  /**
   * Initializes the game, sets up event listeners, and loads a saved game if present.
   */
  function init() {
    document.querySelector("#button1").addEventListener("click", toggleView);
    document.querySelector("#button2").addEventListener("click", back);
    document.querySelector("#button3").addEventListener("click", startGame);
    startGame();

    const resumeData = localStorage.getItem("minesweeper resume");

    if (resumeData) {
        const gameData = JSON.parse(resumeData);
        localStorage.removeItem("minesweeper resume");
        toggleView();
        loadGameFromData(gameData);
    }
  }

  /**
   * Loads the game state from saved data and updates the board and revealed cells.
   * @param {string} gameData - JSON string of the saved game data
   */
  function loadGameFromData(gameData){
    const game_data = gameData;
    board = game_data.board;
    revealedMap = game_data.revealed;

    // Recalculate mine count based on the board
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c].mine) mineCount++;
      }
    }

    renderBoard();

    // Update revealed cells visually
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = board[r][c];
        const elem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (revealedMap[r][c]) {
          elem.classList.add("revealed");
          if (cell.mine) {
            elem.classList.add("mine");
            elem.textContent = "💣";
          } else if (cell.count > 0) {
            elem.textContent = cell.count;
          }
        } else if (cell.flagged) {
          elem.classList.add("flagged");
          elem.textContent = "🚩";
        }
      }
    }

  }

  /**
   * Toggles the visibility of the game and instructions/setup view.
   */
  function toggleView() {
    document.querySelector("#howto").classList.toggle("hidden");
    document.querySelector("#row1").classList.toggle("hidden");
    document.querySelector("#game-message").classList.toggle("hidden");
    document.querySelector("#setup").classList.toggle("hidden");
    document.querySelector("#game-board").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");
  }

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back(){
    const anyRevealed = revealedMap.some(row => row.some(cell => cell === true));
    if (!gameOver && anyRevealed && window.localStorage.getItem("user")) {
        const user = JSON.parse(window.localStorage.getItem("user"));
        const gameData = {
            "board": board,
            "revealed": revealedMap
        }
        fetch("/new_puzzle_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              username: user?.username,
              puzzle_name: "Minesweeper",
              game_data: gameData
          })
          }).then(() => {
            window.location.href = "../index.html";
        });
    } else {
        window.location.href = "../index.html";
    }
  }

  /**
   * Starts a new game, generates the board, and resets all state.
   */
  function startGame() {
    size = Math.max(5, Math.min(20, parseInt(document.getElementById("size-input").value) || 8));
    mineCount = Math.floor(size * size * 0.15);
    gameOver = false;
    board = [];
    revealedMap = Array.from({ length: size }, () => Array(size).fill(false));
    document.getElementById("game-message").textContent = "Good luck!";
    generateBoard();
    renderBoard();
  }

  /**
   * Generates the board with mines and counts.
   */
  function generateBoard() {
    board = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ mine: false, flagged: false, count: 0 }))
    );

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!board[r][c].mine) {
        board[r][c].mine = true;
        minesPlaced++;
        updateCounts(r, c);
      }
    }
  }

  /**
   * Updates the mine counts for cells adjacent to a mine.
   * @param {number} r - Row index
   * @param {number} c - Column index
   */
  function updateCounts(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !board[nr][nc].mine) {
          board[nr][nc].count++;
        }
      }
    }
  }

  /**
   * Renders the board in the DOM and sets up event listeners for each cell.
   */
  function renderBoard() {
    document.getElementById("game-board").innerHTML = "";
    document.getElementById("game-board").style.gridTemplateColumns = `repeat(${size}, 40px)`;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener("click", revealCell);
        cell.addEventListener("contextmenu", flagCell);
        document.getElementById("game-board").appendChild(cell);
      }
    }
  }

  /**
   * Handles revealing a cell when clicked.
   * @param {Event} evt - The click event
   */
  function revealCell(evt) {
    if (gameOver) return;

    const row = parseInt(evt.target.dataset.row);
    const col = parseInt(evt.target.dataset.col);
    const cell = board[row][col];

    if (revealedMap[row][col] || cell.flagged) return;

    revealedMap[row][col] = true;
    const elem = evt.target;
    elem.classList.add("revealed");

    if (cell.mine) {
      elem.classList.add("mine");
      elem.textContent = "💣";
      endGame(false);
    } else {
      if (cell.count > 0) {
        elem.textContent = cell.count;
      } else {
        floodReveal(row, col);
      }
      checkWin();
    }
  }

  /**
   * Recursively reveals empty cells and their neighbors.
   * @param {number} r - Row index
   * @param {number} c - Column index
   */
  function floodReveal(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < size &&
          nc >= 0 && nc < size &&
          !revealedMap[nr][nc] && !board[nr][nc].mine
        ) {
          const elem = document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`);
          revealedMap[nr][nc] = true;
          elem.classList.add("revealed");
          if (board[nr][nc].count > 0) {
            elem.textContent = board[nr][nc].count;
          } else {
            floodReveal(nr, nc);
          }
        }
      }
    }
  }

  /**
   * Handles flagging or unflagging a cell as a mine.
   * @param {Event} evt - The contextmenu event
   */
  function flagCell(evt) {
    evt.preventDefault();
    if (gameOver) return;

    const row = parseInt(evt.target.dataset.row);
    const col = parseInt(evt.target.dataset.col);
    const cell = board[row][col];

    if (revealedMap[row][col]) return;

    cell.flagged = !cell.flagged;
    evt.target.classList.toggle("flagged");
    evt.target.textContent = cell.flagged ? "🚩" : "";
  }

  /**
   * Ends the game and displays the result.
   * @param {boolean} won - True if the player won, false if lost
   */
  function endGame(won) {
    gameOver = true;
    document.getElementById("game-message").textContent = won ? "You win!" : "Game Over!";

    if (!won) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = board[r][c];
          const elem = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
          if (cell.mine && !revealedMap[r][c]) {
            elem.classList.add("mine");
            elem.textContent = "💣";
          }
        }
      }
    }
  }

  /**
   * Checks if the player has won the game.
   */
  function checkWin() {
    let revealedCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (revealedMap[r][c]) {
          revealedCount++;
        }
      }
    }

    if (revealedCount === size * size - mineCount) {
      endGame(true);
    }
  }
})();