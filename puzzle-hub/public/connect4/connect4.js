/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * connect4.js - Simple Connect 4 game logic
 */

(function () {
  "use strict";

  const ROWS = 6;
  const COLS = 7;
  let board = [];
  let currentPlayer = 1; // 1 = red, 2 = yellow
  const boardElem = document.getElementById("game-board");
  const messageElem = document.getElementById("game-message");
  let finished = false;

  window.addEventListener("load", init);

  /**
   * Initializes the game, sets up event listeners, and loads a saved game if present.
   */
  function init() {
    document.querySelector("#button1").addEventListener("click", toggleView);
    document.querySelector("#button2").addEventListener("click", back);
    document.querySelector("#button3").addEventListener("click", resetGame);
    finished = false;
    createBoard();

    const resumeData = localStorage.getItem("connect 4 resume");

    if (resumeData) {
        const gameData = JSON.parse(resumeData);
        localStorage.removeItem("connect 4 resume");
        toggleView();
        loadGameFromData(gameData);
    }
  }

  /**
   * Loads the game state from saved data and updates the board and player.
   * @param {string} gameData - JSON string of the saved game data
   */
  function loadGameFromData(gameData) {
    const game_data = gameData;
    board = game_data.board;
    currentPlayer = game_data.currentPlayer;
  
    boardElem.innerHTML = "";
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = row;
        cell.dataset.col = col;
  
        const value = board[row][col];
        if (value === 1) {
          cell.classList.add("red");
        } else if (value === 2) {
          cell.classList.add("yellow");
        }
  
        cell.addEventListener("click", handleMove);
        boardElem.appendChild(cell);
      }
    }
  
    finished = checkIfGameIsFinished();
    updateMessage();
  }    

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back(){
    const hasNonZero = board.some(row => row.some(cell => cell !== 0));
    if (!finished && hasNonZero && window.localStorage.getItem("user")) {
        const user = JSON.parse(window.localStorage.getItem("user"));
        
        const gameData = {
            "board": board,
            "currentPlayer": currentPlayer,
        }
        fetch("/new_puzzle_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              username: user?.username,
              puzzle_name: "Connect 4",
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
   * Toggles the visibility of the game and instructions view.
   */
  function toggleView() {
    document.querySelector("#howto").classList.toggle("hidden");
    document.querySelector("#row1").classList.toggle("hidden");
    document.querySelector("#game-message").classList.toggle("hidden");
    document.querySelector("#game-board").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");
  }

  /**
   * Creates a new empty board and renders it in the DOM.
   */
  function createBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    boardElem.innerHTML = "";
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.addEventListener("click", handleMove);
        boardElem.appendChild(cell);
      }
    }
    updateMessage();
  }

  /**
   * Handles a player's move when a cell is clicked.
   * @param {Event} evt - The click event
   */
  function handleMove(evt) {
    if (!finished) {
      const col = parseInt(evt.target.dataset.col);
      for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
          board[row][col] = currentPlayer;
          updateCell(row, col);
          if (checkWin(row, col)) {
            messageElem.textContent = `Player ${currentPlayer} wins!`;
            finished = true;
          } else if (board.flat().every(cell => cell !== 0)) {
            messageElem.textContent = "It's a tie!";
            finished = true;
          } else {
            currentPlayer = 3 - currentPlayer; // Toggle between 1 and 2
            updateMessage();
          }
          break;
        }
      }
    }
  }

  /**
   * Updates the color of a cell in the DOM after a move.
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  function updateCell(row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add(currentPlayer === 1 ? "red" : "yellow");
  }

  /**
   * Updates the game message to show the current player's turn.
   */
  function updateMessage() {
    messageElem.textContent = `Player ${currentPlayer}'s turn (${currentPlayer === 1 ? "Red" : "Yellow"})`;
  }

  /**
   * Checks if the last move resulted in a win.
   * @param {number} r - Row index
   * @param {number} c - Column index
   * @returns {boolean} True if the move wins the game
   */
  function checkWin(r, c) {
    return (
      checkDirection(r, c, 0, 1) || // Horizontal
      checkDirection(r, c, 1, 0) || // Vertical
      checkDirection(r, c, 1, 1) || // Diagonal down-right
      checkDirection(r, c, 1, -1)   // Diagonal down-left
    );
  }

  /**
   * Checks if the game is finished (win or tie).
   * @returns {boolean} True if the game is finished
   */
  function checkIfGameIsFinished() {
    // Check every cell; if occupied, check for a win starting there
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== 0) {
          if (checkWin(r, c)) {
            return true;  // Game is finished with a winner
          }
        }
      }
    }
    // If no winner, check if the board is full (tie)
    if (board.flat().every(cell => cell !== 0)) {
      messageElem.textContent = "It's a tie!";
      return true; // Game finished as tie
    }
    return false; // Game not finished yet
  }
  

  /**
   * Checks for four in a row in a given direction.
   * @param {number} r - Row index
   * @param {number} c - Column index
   * @param {number} dr - Row direction
   * @param {number} dc - Column direction
   * @returns {boolean} True if four in a row is found
   */
  function checkDirection(r, c, dr, dc) {
    const target = board[r][c];
    let count = 1;

    for (let dir of [-1, 1]) {
      let row = r + dir * dr;
      let col = c + dir * dc;
      while (row >= 0 && row < ROWS && col >= 0 && col < COLS && board[row][col] === target) {
        count++;
        row += dir * dr;
        col += dir * dc;
      }
    }
    return count >= 4;
  }

  /**
   * Resets the game to the initial state.
   */
  function resetGame() {
    currentPlayer = 1;
    createBoard();
  }
})();