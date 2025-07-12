/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * sliding.js - Sliding Puzzle game logic
 */
(function () {
  "use strict";

  const container = document.getElementById("puzzle-container");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const moveCounterElem = document.getElementById("move-counter");
  const winMessage = document.getElementById("win-message");

  let tiles = [];
  let moveCount = 0;

  /**
   * Initializes the game, sets up event listeners, and loads a saved game if present.
   */
  function init() {
    createTiles();
    render();
    shuffle();

    document.querySelector("#button1").addEventListener("click", toggleView);
    document.querySelector("#button2").addEventListener("click", back);
    document.querySelector("#button3").addEventListener("click", shuffle);

    const resumeData = localStorage.getItem("sliding game resume");

    if (resumeData) {
        const gameData = JSON.parse(resumeData);
        localStorage.removeItem("sliding game resume");
        toggleView();
        loadGameFromData(gameData);
    }
  }
  
  /**
   * Loads the game state from saved data and updates the board and move count.
   * @param {string} gameData - JSON string of the saved game data
   */
  function loadGameFromData(gameData){
    const game_data = gameData;
    tiles = game_data.board;
    moveCount = game_data.moveCount;
    render();
  }

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back(){
    if (winMessage.classList.contains("hidden") && moveCount > 0 && window.localStorage.getItem("user")) {
        const user = JSON.parse(window.localStorage.getItem("user"));
        
        const gameData = {
            "board": tiles,
            "moveCount": moveCount
        }
        fetch("/new_puzzle_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              username: user?.username,
              puzzle_name: "Sliding Game",
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
    document.querySelector("#move-counter").classList.toggle("hidden");
    document.querySelector("#puzzle-container").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");
  }

  /**
   * Creates the initial array of tiles for the puzzle.
   */
  function createTiles() {
    tiles = Array.from({ length: 15 }, (_, i) => i + 1);
    tiles.push(null); // empty slot
  }

  /**
   * Renders the current state of the board in the DOM.
   */
  function render() {
    container.innerHTML = "";
    tiles.forEach((val, index) => {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      if (val === null) {
        tile.classList.add("empty");
      } else {
        tile.textContent = val;
        tile.addEventListener("click", () => handleTileClick(index));
      }
      container.appendChild(tile);
    });
    moveCounterElem.textContent = `Moves: ${moveCount}`;
  }

  /**
   * Handles a tile click and moves the tile if adjacent to the empty slot.
   * @param {number} index - The index of the clicked tile
   */
  function handleTileClick(index) {
    const emptyIndex = tiles.indexOf(null);
    const [row1, col1] = [Math.floor(index / 4), index % 4];
    const [row2, col2] = [Math.floor(emptyIndex / 4), emptyIndex % 4];

    const isAdjacent = (Math.abs(row1 - row2) + Math.abs(col1 - col2)) === 1;

    if (isAdjacent) {
      [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
      moveCount++;
      render();
      checkWin();
    }
  }

  /**
   * Shuffles the tiles to start a new game.
   */
  function shuffle() {
    // Start from the solved board
    tiles = Array.from({ length: 15 }, (_, i) => i + 1);
    tiles.push(null); // empty slot
  
    let blankIndex = tiles.length - 1;
    for (let i = 0; i < 1000; i++) {
      const neighbors = getAdjacentIndices(blankIndex);
      const rand = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tiles[blankIndex], tiles[rand]] = [tiles[rand], tiles[blankIndex]];
      blankIndex = rand;
    }
  
    moveCount = 0;
    winMessage.classList.add("hidden");
    render();
  }

  /**
   * Returns the indices of tiles adjacent to the given index.
   * @param {number} index - The index of the tile
   * @returns {Array<number>} Array of adjacent indices
   */
  function getAdjacentIndices(index) {
    const moves = [];
    const row = Math.floor(index / 4);
    const col = index % 4;
    if (row > 0) moves.push(index - 4);
    if (row < 3) moves.push(index + 4);
    if (col > 0) moves.push(index - 1);
    if (col < 3) moves.push(index + 1);
    return moves;
  }

  /**
   * Checks if the puzzle is solved and displays the win message if so.
   */
  function checkWin() {
    const correct = Array.from({ length: 15 }, (_, i) => i + 1).concat(null);
    if (tiles.every((val, i) => val === correct[i])) {
      winMessage.classList.remove("hidden");
    }
  }

  window.addEventListener("load", init);
})();
