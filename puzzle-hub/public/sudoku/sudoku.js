/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * sudoku.js - Sudoku game logic
 */

(function () {
  "use strict";

  // Globals for board state
  let board = [];
  let solution = [];
  let given = [];
  let selectedCell = null;
  let finished = false;


  /**
   * Initializes the board structures for a new Sudoku puzzle.
   */
  function createEmptyBoard() {
    board = Array(9).fill(null).map(() =>
      Array(9).fill(null).map(() => ({ value: 0, candidates: [] }))
    );
    given = Array(9).fill(null).map(() => Array(9).fill(false));
    finished = false;
    selectedCell = null;
  }

  /**
   * Generates a full solved board (simple backtracking solver).
   * @returns {Array} The solved board
   */
  function generateFullBoard() {
    createEmptyBoard();

    function isSafe(r, c, num) {
      for (let i = 0; i < 9; i++) {
        if (board[r][i].value === num) return false;
        if (board[i][c].value === num) return false;
      }
      let boxRow = Math.floor(r / 3) * 3;
      let boxCol = Math.floor(c / 3) * 3;
      for (let rr = boxRow; rr < boxRow + 3; rr++) {
        for (let cc = boxCol; cc < boxCol + 3; cc++) {
          if (board[rr][cc].value === num) return false;
        }
      }
      return true;
    }

    function fillBoard(pos = 0) {
      if (pos === 81) return true;
      let r = Math.floor(pos / 9);
      let c = pos % 9;
      if (board[r][c].value !== 0) return fillBoard(pos + 1);

      let nums = shuffleArray([...Array(9).keys()].map(x => x + 1));
      for (let num of nums) {
        if (isSafe(r, c, num)) {
          board[r][c].value = num;
          if (fillBoard(pos + 1)) return true;
          board[r][c].value = 0;
        }
      }
      return false;
    }

    fillBoard();
    // Deep copy solution for validation and display
    solution = board.map(row => row.map(cell => cell.value));
    return board;
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm.
   * @param {Array} arr - The array to shuffle
   * @returns {Array} The shuffled array
   */
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Counts the number of solutions for a given board (up to maxCount).
   * @param {Array} board - The board to check
   * @param {number} maxCount - Maximum number of solutions to find
   * @returns {number} The number of solutions found
   */
  function countSolutions(board, maxCount = 2) {
    let count = 0;

    function backtrack(r = 0, c = 0) {
      if (r === 9) {
        count++;
        return count < maxCount;
      }

      const [nr, nc] = c === 8 ? [r + 1, 0] : [r, c + 1];
      if (board[r][c].value !== 0) {
        return backtrack(nr, nc);
      }

      for (let num = 1; num <= 9; num++) {
        if (isValid(board, r, c, num)) {
          board[r][c].value = num;
          if (!backtrack(nr, nc)) return false;
          board[r][c].value = 0;
        }
      }
      return true;
    }

    backtrack();
    return count;
  }

  /**
   * Checks if a value is valid at a given position in the board.
   * @param {Array} board - The board
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} val - Value to check
   * @returns {boolean} True if valid, false otherwise
   */
  function isValid(board, row, col, val) {
    for (let i = 0; i < 9; i++) {
      if (board[row][i].value === val || board[i][col].value === val) return false;

      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + (i % 3);
      if (board[boxRow][boxCol].value === val) return false;
    }
    return true;
  }



  /**
   * Generates a Sudoku puzzle with a unique solution.
   */
  function generatePuzzle() {
    // Start with a full solved board
    generateFullBoard();

    // Mark all cells as initially given
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        given[r][c] = true;
      }
    }

    // Generate a shuffled list of all positions
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    shuffleArray(positions);

    // Try to remove each cell
    for (const [r, c] of positions) {
      const original = board[r][c].value;
      board[r][c].value = 0;
      given[r][c] = false;

      const testBoard = deepCopyBoard(board);
      const numSolutions = countSolutions(testBoard, 2); // stop after finding 2

      if (numSolutions !== 1) {
        // Revert
        board[r][c].value = original;
        given[r][c] = true;
      }
    }
  }

  /**
   * Deep copies a board structure.
   * @param {Array} inputBoard - The board to copy
   * @returns {Array} The deep-copied board
   */
  function deepCopyBoard(inputBoard) {
    return inputBoard.map(row =>
      row.map(cell => ({ value: cell.value, candidates: [] }))
    );
  }

  /**
   * Updates the candidates for each cell based on current board state.
   */
  function updateCandidates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === 0) {
          let used = new Set();

          // Row
          for (let col = 0; col < 9; col++) {
            if (board[r][col].value !== 0) used.add(board[r][col].value);
          }
          // Column
          for (let row = 0; row < 9; row++) {
            if (board[row][c].value !== 0) used.add(board[row][c].value);
          }
          // Box
          let boxRow = Math.floor(r / 3) * 3;
          let boxCol = Math.floor(c / 3) * 3;
          for (let rr = boxRow; rr < boxRow + 3; rr++) {
            for (let cc = boxCol; cc < boxCol + 3; cc++) {
              if (board[rr][cc].value !== 0) used.add(board[rr][cc].value);
            }
          }

          board[r][c].candidates = [];
          for (let num = 1; num <= 9; num++) {
            if (!used.has(num)) board[r][c].candidates.push(num);
          }
        } else {
          board[r][c].candidates = [];
        }
      }
    }
  }

  /**
   * Assigns a value to cells with only one candidate (naked singles).
   * @returns {boolean} True if any assignment was made
   */
  function assignNakedSingles() {
    let changed = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === 0 && board[r][c].candidates.length === 1) {
          board[r][c].value = board[r][c].candidates[0];
          board[r][c].candidates = [];
          changed = true;
        }
      }
    }
    return changed;
  }

  /**
   * Assigns a value if a candidate appears only once in a row, column, or box (hidden singles).
   * @returns {boolean} True if any assignment was made
   */
  function assignHiddenSingles() {
    let changed = false;
    for (let num = 1; num <= 9; num++) {
      // Rows
      for (let r = 0; r < 9; r++) {
        let positions = [];
        for (let c = 0; c < 9; c++) {
          if (board[r][c].value === 0 && board[r][c].candidates.includes(num)) {
            positions.push(c);
          }
        }
        if (positions.length === 1) {
          board[r][positions[0]].value = num;
          board[r][positions[0]].candidates = [];
          changed = true;
        }
      }
      // Columns
      for (let c = 0; c < 9; c++) {
        let positions = [];
        for (let r = 0; r < 9; r++) {
          if (board[r][c].value === 0 && board[r][c].candidates.includes(num)) {
            positions.push(r);
          }
        }
        if (positions.length === 1) {
          board[positions[0]][c].value = num;
          board[positions[0]][c].candidates = [];
          changed = true;
        }
      }
      // Boxes
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
          let positions = [];
          for (let r = br * 3; r < br * 3 + 3; r++) {
            for (let c = bc * 3; c < bc * 3 + 3; c++) {
              if (board[r][c].value === 0 && board[r][c].candidates.includes(num)) {
                positions.push([r, c]);
              }
            }
          }
          if (positions.length === 1) {
            let [r, c] = positions[0];
            board[r][c].value = num;
            board[r][c].candidates = [];
            changed = true;
          }
        }
      }
    }
    return changed;
  }

  /**
   * Eliminates candidates using locked candidates (box-line interaction) logic.
   * @returns {boolean} True if any elimination was made
   */
  function lockedCandidates() {
    let changed = false;

    // Check for each number
    for (let num = 1; num <= 9; num++) {
      // For each box
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
          // Find cells in box that can have num
          let positions = [];
          for (let r = br * 3; r < br * 3 + 3; r++) {
            for (let c = bc * 3; c < bc * 3 + 3; c++) {
              if (board[r][c].value === 0 && board[r][c].candidates.includes(num)) {
                positions.push([r, c]);
              }
            }
          }
          if (positions.length === 0) continue;

          // Check if all candidates lie in one row within this box
          let rows = new Set(positions.map(([r]) => r));
          if (rows.size === 1) {
            let row = positions[0][0];
            // Eliminate num from other cells in this row outside this box
            for (let c = 0; c < 9; c++) {
              if (
                (c < bc * 3 || c >= bc * 3 + 3) &&
                board[row][c].value === 0 &&
                board[row][c].candidates.includes(num)
              ) {
                board[row][c].candidates = board[row][c].candidates.filter(x => x !== num);
                changed = true;
              }
            }
          }

          // Check if all candidates lie in one column within this box
          let cols = new Set(positions.map(([, c]) => c));
          if (cols.size === 1) {
            let col = positions[0][1];
            // Eliminate num from other cells in this column outside this box
            for (let r = 0; r < 9; r++) {
              if (
                (r < br * 3 || r >= br * 3 + 3) &&
                board[r][col].value === 0 &&
                board[r][col].candidates.includes(num)
              ) {
                board[r][col].candidates = board[r][col].candidates.filter(x => x !== num);
                changed = true;
              }
            }
          }
        }
      }

      // Similar logic for row-based locked candidates
      for (let r = 0; r < 9; r++) {
        let positions = [];
        for (let c = 0; c < 9; c++) {
          if (board[r][c].value === 0 && board[r][c].candidates.includes(num)) {
            positions.push(c);
          }
        }
        if (positions.length === 0) continue;

        let boxCols = new Set(positions.map(c => Math.floor(c / 3)));
        if (boxCols.size === 1) {
          let bc = [...boxCols][0];
          for (let rr = bc * 3; rr < bc * 3 + 3; rr++) {
            if (
              rr !== r &&
              board[rr][positions[0]].value === 0 &&
              board[rr][positions[0]].candidates.includes(num)
            ) {
              board[rr][positions[0]].candidates = board[rr][positions[0]].candidates.filter(x => x !== num);
              changed = true;
            }
          }
        }
      }

      // Similar logic for column-based locked candidates
      for (let c = 0; c < 9; c++) {
        let positions = [];
        for (let r = 0; r < 9; r++) {
          if (board[r][c].value === 0 && board[r][c].candidates.includes(num)) {
            positions.push(r);
          }
        }
        if (positions.length === 0) continue;

        let boxRows = new Set(positions.map(r => Math.floor(r / 3)));
        if (boxRows.size === 1) {
          let br = [...boxRows][0];
          for (let cc = br * 3; cc < br * 3 + 3; cc++) {
            if (
              cc !== c &&
              board[positions[0]][cc].value === 0 &&
              board[positions[0]][cc].candidates.includes(num)
            ) {
              board[positions[0]][cc].candidates = board[positions[0]][cc].candidates.filter(x => x !== num);
              changed = true;
            }
          }
        }
      }
    }

    return changed;
  }

  /**
   * Updates the UI to reflect the current board state.
   */
  function updateUI() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.getElementById(`box-${r}-${c}`);
        if (!cell) continue;
        const val = board[r][c].value;
        cell.textContent = val === 0 ? "" : val;
        if (given[r][c]) {
          cell.classList.add("given");
        } else {
          cell.classList.remove("given");
        }
      }
    }
  }

  /**
   * Starts a new game and updates the UI.
   */
  function startGame() {
    generatePuzzle(30); // 30 clues
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!given[r][c]) {
          board[r][c].value = 0;  // or "" depending on your data type
        }
      }
    }
    updateUI();
    finished = false;
    document.getElementById("message-area").classList.add("hidden");
  }

  /**
   * Selects a cell in the UI for input.
   * @param {HTMLElement} cell - The cell to select
   */
  function selectCell(cell) {
    if (selectedCell) selectedCell.classList.remove("selected");
    if (cell.classList.contains("given")) return;
    selectedCell = cell;
    selectedCell.classList.add("selected");
  }

  /**
   * Handles keyboard input for the selected cell.
   * @param {string} key - The key pressed
   */
  function handleKey(key) {
    if (!selectedCell) return;
    let [_, r, c] = selectedCell.id.split("-").map(Number);
    if (given[r][c]) return;

    if (/^[1-9]$/.test(key)) {
      board[r][c].value = Number(key);
      selectedCell.textContent = key;
    } else if (key === "Backspace") {
      board[r][c].value = 0;
      selectedCell.textContent = "";
    }
    checkForWin();
  }

  /**
   * Checks if the current board matches the solution and displays a win message.
   */
  function checkForWin() {
    if (finished) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === 0 || board[r][c].value !== solution[r][c]) {
          return;
        }
      }
    }
    finished = true;
    document.getElementById("message-area").classList.remove("hidden");
  }

  /**
   * Toggles the visibility of the game and instructions view.
   */
  function toggleView() {
    document.querySelector("#howto").classList.toggle("hidden");
    document.querySelector("#examples").classList.toggle("hidden");
    document.querySelector("#row1").classList.toggle("hidden");
    document.querySelector(".sudoku-grid").classList.toggle("hidden");
    document.querySelector(".keyboard").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("ENTER");
      } else {
        handleKey(e.key);
      }
    });
  }

  /**
   * Loads the game state from saved data and updates the board, solution, and given cells.
   * @param {string} gameData - JSON string of the saved game data
   */
  function loadGameFromData(gameData) {
    const game_data = JSON.parse(gameData);
    board = game_data.board.map(row => row.map(val => ({ value: Number(val), candidates: [] })));
    solution = game_data.solution;
    given = game_data.given;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.getElementById(`box-${r}-${c}`);
        if (cell) {
          cell.textContent = board[r][c].value === 0 ? "" : board[r][c].value;
          cell.classList.remove("selected", "given");
          if (given?.[r]?.[c]) {
            cell.classList.add("given");
          }
        }
      }
    }
  }

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back() {
    const anyUserFilled = board.some((row, r) =>
      row.some((cell) => cell.value !== 0 && !given?.[r]?.[row.indexOf(cell)])
    );
    if (!finished && anyUserFilled && window.localStorage.getItem("user")) {
      const user = JSON.parse(window.localStorage.getItem("user"));
      const gameData = {
        board: board.map(row => row.map(cell => cell.value)),
        solution,
        given
      };
      fetch("/new_puzzle_session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username,
          puzzle_name: "Sudoku",
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
   * Initializes the UI, event listeners, and board for the Sudoku game.
   */
  function init() {
      document.querySelector("#button1").addEventListener("click", toggleView);
      document.querySelector("#button2").addEventListener("click", back);
      document.querySelector("#button3").addEventListener("click", startGame);

      document.querySelectorAll(".key").forEach((btn) => {
        btn.addEventListener("click", () => {
          handleKey(btn.textContent === " " ? "Backspace" : btn.textContent);
        });
      });

      document.querySelectorAll(".cell").forEach((cell) => {
        cell.addEventListener("click", () => {
          selectCell(cell);
        });
      });

      const resumeData = localStorage.getItem("sudoku resume");
      if (resumeData) {
        const gameData = JSON.parse(resumeData);
        localStorage.removeItem("sudoku resume");
        toggleView();
        loadGameFromData(gameData);
      } else {
        startGame();
      }
    }

    init();
})();
