const SIZE = 15;
const BLACK = 1;
const WHITE = 0;
 
// Helper: Check for 180-degree rotational symmetry
function isSymmetric(grid) {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] !== grid[SIZE-1-i][SIZE-1-j]) return false;
    }
  }
  return true;
}
 
// Helper: Check for minimum word length (no two-letter words)
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
 
// Helper: Check all white squares are connected (BFS)
function allWhiteConnected(grid) {
  let visited = Array.from({length: SIZE}, () => Array(SIZE).fill(false));
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
    for (let [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let nx = x + dx, ny = y + dy;
      if (0 <= nx && nx < SIZE && 0 <= ny && ny < SIZE) {
        if (grid[nx][ny] === WHITE && !visited[nx][ny]) {
          visited[nx][ny] = true;
          queue.push([nx, ny]);
        }
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
 
// Helper: Every white square is part of both an Across and Down word
function allWhiteHaveWords(grid) {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] === WHITE) {
        // Check across
        let left = j > 0 && grid[i][j-1] === WHITE;
        let right = j < SIZE-1 && grid[i][j+1] === WHITE;
        // Check down
        let up = i > 0 && grid[i-1][j] === WHITE;
        let down = i < SIZE-1 && grid[i+1][j] === WHITE;
        if (!(left || right) || !(up || down)) return false;
      }
    }
  }
  return true;
}
 
// Main validation function
function isValid(grid) {
  return isSymmetric(grid) && hasMinWordLength(grid) && allWhiteConnected(grid) && allWhiteHaveWords(grid);
}
 
// Place black squares with symmetry and validation
function placeBlackSquares(numBlack) {
  let grid = Array.from({length: SIZE}, () => Array(SIZE).fill(WHITE));
  let positions = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (i < SIZE/2 || (i === Math.floor(SIZE/2) && j <= Math.floor(SIZE/2))) {
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
    let symI = SIZE-1-i, symJ = SIZE-1-j;
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
 
// Generate crossword grid
function generateCrossword(numBlack = 36) {
  let grid = placeBlackSquares(numBlack);
  return grid;
}
 
// Example usage: generate and print grid
function printGrid(grid) {
  for (let i = 0; i < SIZE; i++) {
    let row = '';
    for (let j = 0; j < SIZE; j++) {
      row += grid[i][j] === BLACK ? '#' : '.';
    }
    console.log(row);
  }
}
  // Render the grid
  function renderGrid(grid) {
    const container = document.getElementById('crossword-container');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${SIZE}, 30px)`;
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell' + (grid[i][j] ? ' black' : '');
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.onclick = () => selectCell(i, j);
        container.appendChild(cell);
      }
    }
  }
 
  // Dummy mapping: every cell in first row is "across 1", first column is "down 1"
  function getClueForCell(row, col) {
    if (row === 0) return {direction: 'across', id: 1};
    if (col === 0) return {direction: 'down', id: 1};
    // Example: you can expand this logic to map to your real clues
    return null;
  }
 
  function selectCell(row, col) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
    // Highlight corresponding clue
    document.querySelectorAll('.clue').forEach(c => c.classList.remove('selected'));
    const clue = getClueForCell(row, col);
    if (clue) {
     const clueElem = document.querySelector(`#${clue.direction}-clues .clue[data-id="${clue.id}"]`);
      if (clueElem) clueElem.classList.add('selected');
    }
  }

  window.onload = function() {
    let numBlack = 36 + Math.floor(Math.random() * 7);
    let grid = generateCrossword(numBlack);
    renderGrid(grid);
  }