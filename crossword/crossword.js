const SIZE = 15;
const BLACK = 1;
const WHITE = 0;

let wordList = []; // Will hold words + clues after fetch

// --- Crossword generation code ---

// Checks if the grid is symmetric 180 degrees
function isSymmetric(grid) {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] !== grid[SIZE - 1 - i][SIZE - 1 - j]) return false;
    }
  }
  return true;
}

// Check for minimum word length (no 2-letter words)
function hasMinWordLength(grid) {
  for (let axis = 0; axis < 2; axis++) {
    for (let i = 0; i < SIZE; i++) {
      let count = 0;
      for (let j = 0; j < SIZE; j++) {
        let cell = axis === 0 ? grid[i][j] : grid[j][i];
        if (cell === WHITE) {
          count++;
        } else {
          if (count > 0 && count < 3) return false;
          count = 0;
        }
      }
      if (count > 0 && count < 3) return false;
    }
  }
  return true;
}

// Check that all white squares are connected (BFS)
function allWhiteConnected(grid) {
  let visited = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(false)
  );
  let start = null;
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] === WHITE) {
        start = [i, j];
        break;
      }
    }
    if (start) break;
  }
  if (!start) return true; // No white squares
  let queue = [start];
  visited[start[0]][start[1]] = true;
  while (queue.length > 0) {
    let [x, y] = queue.shift();
    for (let [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      let nx = x + dx,
        ny = y + dy;
      if (
        0 <= nx &&
        nx < SIZE &&
        0 <= ny &&
        ny < SIZE &&
        grid[nx][ny] === WHITE &&
        !visited[nx][ny]
      ) {
        visited[nx][ny] = true;
        queue.push([nx, ny]);
      }
    }
  }
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] === WHITE && !visited[i][j]) return false;
    }
  }
  return true;
}

// Check every white square has at least one across and one down neighbor
function allWhiteHaveWords(grid) {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] === WHITE) {
        let left = j > 0 && grid[i][j - 1] === WHITE;
        let right = j < SIZE - 1 && grid[i][j + 1] === WHITE;
        let up = i > 0 && grid[i - 1][j] === WHITE;
        let down = i < SIZE - 1 && grid[i + 1][j] === WHITE;
        if (!(left || right) || !(up || down)) return false;
      }
    }
  }
  return true;
}

// Validity check combining all above
function isValid(grid) {
  return (
    isSymmetric(grid) &&
    hasMinWordLength(grid) &&
    allWhiteConnected(grid) &&
    allWhiteHaveWords(grid)
  );
}

// Place black squares with symmetry and validation
function placeBlackSquares(numBlack) {
  let grid = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(WHITE)
  );
  let positions = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      // Only fill half + center diagonal for symmetry
      if (
        i < SIZE / 2 ||
        (i === Math.floor(SIZE / 2) && j <= Math.floor(SIZE / 2))
      ) {
        positions.push([i, j]);
      }
    }
  }
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  let placed = 0;
  for (let idx = 0; idx < positions.length; idx++) {
    if (placed >= Math.floor(numBlack / 2)) break;
    let [i, j] = positions[idx];
    let symI = SIZE - 1 - i,
      symJ = SIZE - 1 - j;
    if (grid[i][j] === WHITE && grid[symI][symJ] === WHITE) {
      grid[i][j] = BLACK;
      grid[symI][symJ] = BLACK;
      if (isValid(grid)) {
        placed++;
      } else {
        grid[i][j] = WHITE;
        grid[symI][symJ] = WHITE;
      }
    }
  }
  return grid;
}

// --- Word placement and backtracking solver ---

function sortWordsByLengthDesc(words) {
  return [...words].sort((a, b) => b.Word.length - a.Word.length);
}

function hasEnoughSpace(grid, row, col, length, direction) {
  if (direction === "across") {
    if (col + length > SIZE) return false;
    for (let j = col; j < col + length; j++) {
      if (grid[row][j] === BLACK) return false;
    }
  } else {
    if (row + length > SIZE) return false;
    for (let i = row; i < row + length; i++) {
      if (grid[i][col] === BLACK) return false;
    }
  }
  return true;
}

function canPlaceWord(grid, word, row, col, direction) {
  if (!hasEnoughSpace(grid, row, col, word.length, direction))
    return false;

  for (let i = 0; i < word.length; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;

    const cell = grid[r][c];
    if (cell === BLACK) return false;
    if (typeof cell === "string" && cell !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word, row, col, direction) {
  const modified = [];
  for (let i = 0; i < word.length; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;

    if (grid[r][c] !== word[i]) {
      grid[r][c] = word[i];
      modified.push([r, c]);
    }
  }
  return modified;
}

function removeWord(grid, positions) {
  for (const [r, c] of positions) {
    grid[r][c] = WHITE;
  }
}

function solveCrossword(grid, words, index = 0) {
  if (index === words.length) return true;

  const word = words[index].Word.toUpperCase();

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      for (let dir of ["across", "down"]) {
        if (canPlaceWord(grid, word, row, col, dir)) {
          const placed = placeWord(grid, word, row, col, dir);
          if (solveCrossword(grid, words, index + 1)) {
            return true;
          }
          removeWord(grid, placed);
        }
      }
    }
  }
  return false;
}

// --- Rendering functions ---

function renderGridWithLetters(grid) {
  const container = document.getElementById("crossword-container");
  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${SIZE}, 30px)`;
  container.style.gridGap = "1px";

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const cell = document.createElement("div");
      const val = grid[i][j];
      cell.className = "cell";

      if (val === BLACK) {
        cell.classList.add("black");
      } else if (typeof val === "string") {
        cell.textContent = val;
        cell.classList.add("filled");
      }

      container.appendChild(cell);
    }
  }
}

// --- Load words and start crossword ---

function startCrossword() {
  const numBlack = 36 + Math.floor(Math.random() * 7);
  let grid = placeBlackSquares(numBlack);

  // Copy to avoid mutating black squares array
  let crosswordGrid = grid.map((row) => row.slice());

  const sortedWords = sortWordsByLengthDesc(wordList);
  const success = solveCrossword(crosswordGrid, sortedWords);

  if (!success) {
    console.warn("Failed to place all words.");
  }

  renderGridWithLetters(crosswordGrid);
}

// --- Load word list JSON and initialize ---

fetch("nytcrosswords.json")
  .then((response) => response.json())
  .then((data) => {
    wordList = data.filter((row) => row.Word && row.Clue);
    startCrossword();
  })
  .catch((err) => console.error("Failed to load words:", err));