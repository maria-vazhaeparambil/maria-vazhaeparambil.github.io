/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * sudoku-solver.js - Sudoku solver game logic
 */

(function () {
  "use strict";

  // Globals for board state
  let board = [];
  let given = [];
  let selectedCell = null;


  /**
   * Initializes the board structures for a new Sudoku puzzle.
   */
  function createEmptyBoard() {
    board = Array(9).fill(null).map(() =>
      Array(9).fill(null).map(() => ({ value: 0, candidates: [] }))
    );
    given = Array(9).fill(null).map(() => Array(9).fill(false));
    selectedCell = null;
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
   */
  function assignNakedSingles() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === 0 && board[r][c].candidates.length === 1) {
          board[r][c].value = board[r][c].candidates[0];
          board[r][c].candidates = [];
        }
      }
    }
  }

  /**
   * Assigns a value if a candidate appears only once in a row, column, or box (hidden singles).
   */
  function assignHiddenSingles() {
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
          }
        }
      }
    }
  }

  /**
   * Eliminates candidates using locked candidates (box-line interaction) logic.
   */
  function lockedCandidates() {

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
            }
          }
        }
      }
    }
  }

  /**
   * Main solver function applying logic iteratively until no progress is made.
   * @param {Array} inputBoard - Optional board to solve
   * @returns {boolean} True if solved, false otherwise
   */
  function solve(inputBoard = null) {
    if (inputBoard) board = inputBoard;
    let progress = true;

    while (true) {
        const before = JSON.stringify(board);
        updateCandidates();

        assignNakedSingles();
        assignHiddenSingles();
        lockedCandidates();

        const after = JSON.stringify(board);

        if (before === after) {
            break;
        }
    }

    // Check if solved (no zeros)
    return board.every(row => row.every(cell => cell.value !== 0));
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
   * Selects a cell in the UI for input.
   * @param {HTMLElement} cell - The cell to select
   */
  function selectCell(cell) {
    if (selectedCell) selectedCell.classList.remove("selected");
    selectedCell = cell;
    selectedCell.classList.add("selected");
  }

  /**
   * Handles keyboard input for the selected cell.
   * @param {string} key - The key pressed
   */
  function handleKey(key) {
    console.log("here");
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
  }

  /**
   * Reads the current grid from the UI into the board data structure.
   */
  function readGridToBoard() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
        const cell = document.getElementById(`box-${r}-${c}`);
        const val = parseInt(cell.textContent.trim());
        board[r][c].value = isNaN(val) ? 0 : val;
        given[r][c] = val > 0; // Treat non-zero entries as givens
        }
    }
  }

  /**
   * Initializes the UI, event listeners, and board for the Sudoku solver.
   */
  function init() {
      document.getElementById("message-area").classList.add("hidden");
      createEmptyBoard(); 

      document.querySelector("#solve-btn").addEventListener("click", () => {
        readGridToBoard();

        const solvable = solve();
        console.log(solvable);

        if (solvable) {
            updateUI();
            document.getElementById("message-area").classList.add("hidden");
        } else {
            document.getElementById("message-area").classList.remove("hidden");
        }
      });


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

       document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleKey("ENTER");
        } else {
            handleKey(e.key);
        }
      });
  }

  init();
})();
