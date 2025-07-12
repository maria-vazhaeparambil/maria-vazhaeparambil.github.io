/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * hanoi.js - Tower of Hanoi game logic
 */

(function () {
  "use strict";

  let NUM_DISKS = 3;
  let board = [[], [], []];
  let draggedDisk = null;
  let moveCount = 0;
  const towerElems = [
      document.getElementById("tower-0"),
      document.getElementById("tower-1"),
      document.getElementById("tower-2")
    ];

  window.addEventListener("load", init);

  /**
   * Initializes the game, sets up event listeners, and loads a saved game if present.
   */
  function init() {
    document.querySelector("#button1").addEventListener("click", toggleView);
    document.querySelector("#button2").addEventListener("click", back);
    document.querySelector("#button3").addEventListener("click", startGame);
    startGame();

    const resumeData = localStorage.getItem("tower of hanoi resume");

    if (resumeData) {
        const gameData = JSON.parse(resumeData);
        localStorage.removeItem("tower of hanoi resume");
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
    board = game_data.board;
    moveCount = game_data.moveCount;
    render();
    document.getElementById("move-counter").textContent = "Moves: " + String(moveCount);
  }

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back(){
    if (board[2].length !== NUM_DISKS && moveCount > 0 && window.localStorage.getItem("user")) {
        const user = JSON.parse(window.localStorage.getItem("user"));
        
        const gameData = {
            "board": board,
            "moveCount": moveCount
        }
        fetch("/new_puzzle_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              username: user?.username,
              puzzle_name: "Tower of Hanoi",
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
   * Toggles the visibility of the game and instructions/setup view.
   */
  function toggleView() {
    document.querySelector("#howto").classList.toggle("hidden");
    document.querySelector("#row1").classList.toggle("hidden");
    document.querySelector("#game-message").classList.toggle("hidden");
    document.querySelector("#setup").classList.toggle("hidden");
    document.querySelector("#game-section").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");
  }

  /**
   * Starts a new game with the selected number of disks.
   */
  function startGame() {
    NUM_DISKS = parseInt(document.getElementById("disk-count").value);
    board[0] = [];
    board[1] = [];
    board[2] = [];
    moveCount = 0;
    document.getElementById("move-counter").textContent = "Moves: 0";

    // Fill tower 0 with disks from largest (bottom) to smallest (top)
    for (let i = NUM_DISKS; i >= 1; i--) {
      board[0].push(i);
    }

    render();
  }

  /**
   * Updates the game message displayed to the user.
   * @param {string} msg - The message to display
   */
  function updateMessage(msg) {
      document.getElementById("game-message").textContent = msg;
    }

  /**
   * Renders the current state of the board and sets up drag-and-drop event listeners.
   */
  function render() {
    updateMessage("Move all disks to the third tower");
    board.forEach((tower, index) => {
      const towerElem = towerElems[index];
      towerElem.innerHTML = "";
      tower.forEach(size => {
        const disk = document.createElement("div");
        disk.className = "disk";
        disk.dataset.size = size;
        disk.draggable = true;
        disk.addEventListener("dragstart", handleDragStart);
        towerElem.appendChild(disk);
      });

      towerElem.addEventListener("dragover", handleDragOver);
      towerElem.addEventListener("drop", handleDrop);
    });
  }

  /**
   * Handles the start of a drag event for a disk.
   * @param {DragEvent} e - The dragstart event
   */
  function handleDragStart(e) {
    const towerIndex = towerElems.indexOf(e.target.parentElement);
    const topDisk = board[towerIndex][board[towerIndex].length - 1];
    if (parseInt(e.target.dataset.size) === topDisk) {
      draggedDisk = {
        size: parseInt(e.target.dataset.size),
        from: towerIndex
      };
    } else {
      e.preventDefault();
    }
  }

  /**
   * Allows a dragged disk to be dropped on a tower.
   * @param {DragEvent} e - The dragover event
   */
  function handleDragOver(e) {
    e.preventDefault();
  }

  /**
   * Handles dropping a disk onto a tower, updates the board and checks for win.
   * @param {DragEvent} e - The drop event
   */
  function handleDrop(e) {
    const targetTowerIndex = towerElems.indexOf(e.currentTarget);
    if (draggedDisk !== null) {
      const top = board[targetTowerIndex].slice(-1)[0] || Infinity;
      if (draggedDisk.size < top) {
        board[draggedDisk.from].pop();
        board[targetTowerIndex].push(draggedDisk.size);
        moveCount++;
        document.getElementById("move-counter").textContent = `Moves: ${moveCount}`;
        render();
        checkWin();
      } else if (draggedDisk.size !== top) {
        updateMessage("Illegal move! A larger disk cannot be placed on top of a smaller one.");
      }
      draggedDisk = null;
    }
  }

  /**
   * Checks if the player has won the game.
   */
  function checkWin() {
    if (board[2].length === NUM_DISKS) {
      updateMessage(`You win! 🎉 Total moves: ${moveCount}`);
    }
  }
})();
