/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * tictactoe.js - Tic Tac Toe game logic
 */

(function() {   
  "use strict"; 

  const board = document.getElementById("game-board");
  const status = document.getElementById("status");

  let cells = [];
  let currentPlayer = "X";
  let boardState = Array(9).fill(null);
  let gameOver = false;

  /**
   * Initializes the game, sets up event listeners, and loads a saved game if present.
   */
  function init() {
      document.getElementById("button1").addEventListener("click", toggleView);
      document.getElementById("button2").addEventListener("click", back);
      document.getElementById("button3").addEventListener("click", resetGame);
      createBoard();

      const resumeData = localStorage.getItem("tic tac toe resume");

      if (resumeData) {
          const gameData = JSON.parse(resumeData);
          localStorage.removeItem("tic tac toe resume");
          toggleView();
          loadGameFromData(gameData);
      }
  }

  /**
   * Loads the game state from saved data and updates the board and player.
   * @param {string} gameData - JSON string of the saved game data
   */
  function loadGameFromData(gameData) {
    const game_data = JSON.parse(gameData);
    boardState = game_data.board;
    currentPlayer = game_data.currentPlayer;
    cells.forEach((cell, index) => {
      cell.textContent = boardState[index] || "";
    });
  }

  /**
   * Toggles the visibility of the game and instructions view.
   */
  function toggleView() {
    document.querySelector("#howto").classList.toggle("hidden");
    document.querySelector("#status").classList.toggle("hidden");
    document.querySelector("#row1").classList.toggle("hidden");
    document.querySelector("#game-board").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");
  }

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back(){
    const allNull = boardState.every(cell => cell === null);
    if (!gameOver && !allNull && window.localStorage.getItem("user")) {
        const user = JSON.parse(window.localStorage.getItem("user"));
        const gameData = {
            "board": boardState,
            "currentPlayer": currentPlayer
        }
        fetch("/new_puzzle_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: user?.username,
            puzzle_name: "Tic Tac Toe",
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
   * Creates the Tic Tac Toe board in the DOM and sets up event listeners.
   */
  function createBoard() {
    board.innerHTML = "";
    cells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.index = i;
      cell.addEventListener("click", handleMove);
      board.appendChild(cell);
      cells.push(cell);
    }
  }

  /**
   * Handles a player's move when a cell is clicked.
   * @param {Event} e - The click event
   */
  function handleMove(e) {
    const index = e.target.dataset.index;
    if (boardState[index] || gameOver) return;
    boardState[index] = currentPlayer;
    cells[index].textContent = currentPlayer;

    if (checkWinner(currentPlayer)) {
      status.textContent = `Player ${currentPlayer} wins! 🎉`;
      gameOver = true;
    } else if (boardState.every(cell => cell)) {
      status.textContent = "It's a draw!";
      gameOver = true;
    } else {
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      status.textContent = `Player ${currentPlayer}'s turn`;
    }
  }

  /**
   * Checks if the given player has won the game.
   * @param {string} player - The player symbol ("X" or "O")
   * @returns {boolean} True if the player has won
   */
  function checkWinner(player) {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8], // rows
      [0,3,6], [1,4,7], [2,5,8], // columns
      [0,4,8], [2,4,6]           // diagonals
    ];

    return winPatterns.some(pattern => 
      pattern.every(index => boardState[index] === player)
    );
  }

  /**
   * Resets the game to the initial state.
   */
  function resetGame() {
    boardState = Array(9).fill(null);
    currentPlayer = "X";
    gameOver = false;
    status.textContent = "Player X's turn";
    createBoard();
  }

  init();
}());