/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * This is the weaver.js file for the Weaver game.
 */

(function() {   
    "use strict"; 

    const wordLength = 4;
    let board = [["", "", "", ""]];
    let wordList = [];
    let start_word = "";
    let end_word = "";
    let finished = false;
    let currentRow = 1;
    let currentCol = 0;


    /**
     * Attaches event listeners to buttons and keys. Then sets up the board.
     */
    async function init() {
        const wordList = await load_list();

        // Attach event listeners
        document.querySelector("#button1").addEventListener("click", toggleView);
        document.querySelector("#button2").addEventListener("click", back);
        document.querySelector("#button3").addEventListener("click", setupBoard);

        const resumeData = localStorage.getItem("weaver resume");

        if (resumeData) {
            const gameData = JSON.parse(resumeData);
            localStorage.removeItem("weaver resume");
            toggleView();
            loadGameFromData(gameData);
        }
    }

    /**
     * Loads the game state from saved data and updates the board and UI.
     * @param {object} gameData - JSON string of the saved game data
     */
    function loadGameFromData(gameData){
        const game_data = gameData;
        const board = game_data.board;
        const grid = document.querySelector(".weaver-grid");
        grid.innerHTML = ""; // Clear existing board

        currentRow = board.length - 2;
        currentCol = 0;

        // Set up starting and ending words
        start_word = board[0].join('');
        end_word = board[board.length - 1].join('');

        for (let r = 0; r < board.length; r++) {
            const row = document.createElement("div");
            row.classList.add("row");

            for (let c = 0; c < wordLength; c++) {
                const tile = document.createElement("div");
                tile.classList.add("tile");
                tile.id = `box-${r}-${c}`;
                tile.textContent = board[r][c];

                // Only add "correct" class if letter matches the target
                if (r !== 0 && r !== board.length - 1) {
                    if (board[r][c] === end_word[c]) {
                        tile.classList.add("correct");
                    }
                }
                if (r === board.length - 1) {
                    if (board[r][c] === board[r - 2][c]) {
                        tile.classList.add("correct");
                    }
                }

                row.appendChild(tile);
            }

            grid.appendChild(row);
        }
    }

    /**
     * Toggles the visibility of the game and instructions view, and sets up key event listeners.
     */
    function toggleView() {
        document.querySelector("#howto").classList.toggle("hidden");
        document.querySelector("#examples").classList.toggle("hidden");
        document.querySelector("#row1").classList.toggle("hidden");
        document.querySelector(".weaver-grid").classList.toggle("hidden");
        document.querySelector("#row2").classList.toggle("hidden");
        document.querySelector("#footer").classList.toggle("hidden");

        document.addEventListener("keydown", (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission or default behavior
                handleKey('ENTER');
            }
            else {
                handleKey(e.key.toUpperCase());
            }
        });
    }

    /**
     * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
     */
    function back(){
        if (!finished && currentRow > 1 && window.localStorage.getItem("user")) {
            const user = JSON.parse(window.localStorage.getItem("user"));
            const grid = document.querySelector(".weaver-grid");
            const rows = grid.querySelectorAll(".row");
            const board = [];

            for (let r = 0; r < rows.length; r++) {
                const rowData = [];
                let isComplete = true;
              
                for (let c = 0; c < wordLength; c++) {
                  const box = document.getElementById(`box-${r}-${c}`);
                  const text = box ? box.textContent.trim() : "";
                  rowData.push(text);
                  if (text === "") {
                    isComplete = false;
                  }
                }
              
                if (isComplete) {
                  board.push(rowData);
                } else {
                  board.push(Array(wordLength).fill("")); // Push empty row
                }
            }
            const gameData = {
                "board": board
            }
            fetch("/new_puzzle_session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user?.username,
                    puzzle_name: "Weaver",
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
     * Builds a graph where each word is a node and edges connect words differing by one letter.
     * @param {string[]} wordList - List of valid words
     * @returns {Map} Graph of word connections
     */
    function buildWordGraph(wordList) {
        const graph = new Map();
      
        for (const word of wordList) {
          graph.set(word, []);
          for (const other of wordList) {
            if (word !== other && isOneLetterDiff(word, other)) {
              graph.get(word).push(other);
            }
          }
        }
      
        return graph;
    }
      
    /**
     * Checks if two words differ by exactly one letter.
     * @param {string} w1 - First word
     * @param {string} w2 - Second word
     * @returns {boolean} True if words differ by one letter
     */
    function isOneLetterDiff(w1, w2) {
        let diff = 0;
        for (let i = 0; i < w1.length; i++) {
          if (w1[i] !== w2[i]) diff++;
          if (diff > 1) return false;
        }
        return diff === 1;
    }

    /**
     * Determines if there is a path between start and end words in the graph.
     * @param {Map} graph - Word graph
     * @param {string} start - Start word
     * @param {string} end - End word
     * @returns {boolean} True if solvable
     */
    function areWordsSolvable(graph, start, end) {
        const visited = new Set();
        const queue = [start];
      
        while (queue.length > 0) {
          const word = queue.shift();
          if (word === end) return true;
          visited.add(word);
      
          for (const neighbor of graph.get(word)) {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      
        return false;
    }

    /**
     * Sets up the Weaver board, including determining starting and ending word.
     */
    async function setupBoard() {
        const msgArea = document.getElementById("message-area");
        msgArea.classList.add("hidden");
        const graph = buildWordGraph(wordList);
        do {
            start_word = wordList[Math.floor(Math.random() * wordList.length)];
            end_word = wordList[Math.floor(Math.random() * wordList.length)];
        } while (start_word === end_word || !areWordsSolvable(graph, start_word, end_word));
        

        let grid = document.querySelector(".weaver-grid");
        grid.innerHTML = ""; // clears all child elements

        for (let i = 0; i < 3; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let c = 0; c < wordLength; c++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.id = `box-${i}-${c}`;
            row.appendChild(tile);
        }
        grid.appendChild(row);
        }
        for (let c = 0; c < wordLength; c++) {
            let box = document.getElementById(`box-${0}-${c}`);
            box.textContent = start_word[c];
            box.classList.remove("correct");
        }
        for (let c = 0; c < wordLength; c++) {
            let box = document.getElementById(`box-${1}-${c}`);
            box.classList.remove("correct");
        }
        for (let c = 0; c < wordLength; c++) {
            let box = document.getElementById(`box-${2}-${c}`);
            box.textContent = end_word[c];
            box.classList.remove("correct");
            if (start_word[c] === end_word[c]){
                box.classList.add("correct");
            }
        }  
        finished = false;
        currentRow = 1;
        currentCol = 0;
    }

    /**
     * Loads the list of valid words used for guessing and target selection.
     * @returns {string[]} - Array of uppercase 4-letter words.
     */
    async function load_list() {
        const resp = await fetch("../data/4-letter-words-processed-new.txt");
        if (!resp.ok) throw new Error("Failed to load word list");
        const text = await resp.text();
        wordList = text.split("\n").map(word => word.trim().toUpperCase()).filter(word => word.length === 4);
        setupBoard();
    }

    /**
     * Handles a key being pressed.
     * @param {object} key - pressed key
     */
    function handleKey(key) {
        if (!finished) {
            if (key === "ENTER") {
                if (currentCol === wordLength) {
                    checkWord();
                }
                return;
            }

            if (key === "BACKSPACE") {
                if (currentCol > 0) {
                    currentCol--;
                    const box = document.getElementById(`box-${currentRow}-${currentCol}`);
                    box.textContent = "";
                } else if (currentRow > 1) {

                    currentCol = wordLength - 1;
                    currentRow--;

                    const box = document.getElementById(`box-${currentRow}-${currentCol}`);
                    box.textContent = "";

                    for (let c = 0; c < wordLength; c++) {
                        const tile = document.getElementById(`box-${currentRow}-${c}`);
                        tile.classList.remove("correct");
                    }

                    const rowToRemove = document.querySelector(`#box-${currentRow + 1}-0`).parentElement;
                    rowToRemove.remove();

                    const grid = document.querySelector(".weaver-grid");
                    const rows = grid.querySelectorAll(".row");
                    for (let r = currentRow + 1; r < rows.length; r++) {
                        const tiles = rows[r].querySelectorAll(".tile");
                        tiles.forEach((tile, col) => {
                            tile.id = `box-${r}-${col}`;
                        });
                    }
                }

                return;
            }


            if (/^[A-Z]$/.test(key) && currentCol < wordLength) {
                let box = document.getElementById(`box-${currentRow}-${currentCol}`);
                box.textContent = key;
                currentCol++;
            }
        }
    }

    /**
     * Adds a row to the board at the given index.
     * @param {int} rowIndex index to add a row at
     */
    function addBoardRow(rowIndex) {
        const grid = document.querySelector(".weaver-grid");
        
        const newRow = document.createElement("div");
        newRow.classList.add("row");
    
        for (let c = 0; c < wordLength; c++) {
            // Create new box
            const newBox = document.createElement("div");
            newBox.classList.add("tile");
            newBox.id = `box-${rowIndex + 1}-${c}`;
    
            // Copy content and classes from previous box
            const prevBox = document.getElementById(`box-${rowIndex}-${c}`);
            if (prevBox) {
                newBox.textContent = prevBox.textContent;
                prevBox.textContent = ""; // clear previous
                newBox.className = prevBox.className; // copy all classes
                newBox.classList.add("tile"); // re-add tile class in case it's removed
                prevBox.className = "tile"; // reset previous to base
            }
    
            newRow.appendChild(newBox);
        }
        grid.appendChild(newRow);
    }

    /**
     * Checks that the word that was just entered is valid and updates the board accordingly.
     */
    function checkWord() {
        const msgArea = document.getElementById("message-area");
        msgArea.classList.add("hidden");
        let count = 0;
        let guess = ""
        for (let c = 0; c < wordLength; c++) {
            let box1 = document.getElementById(`box-${currentRow}-${c}`);
            let let1 = box1.textContent;
            guess += let1;
            let box2 = document.getElementById(`box-${currentRow - 1}-${c}`);
            let let2 = box2.textContent;
            if (let1 == let2) {
                count++;
            }
        }
        if (count != 3){
            return;
        }

        if (wordList.includes(guess)) {

            let target = end_word.toUpperCase();

            for (let c = 0; c < wordLength; c++) {
                const box = document.getElementById(`box-${currentRow}-${c}`);
                box.classList.remove("correct");

                if (box.textContent === target[c]) {
                    box.classList.add("correct");
                }
            }

            if (guess === target) {
                for (let c = 0; c < wordLength; c++) {
                    let box = document.getElementById(`box-${currentRow + 1}-${c}`);
                    box.classList.remove("correct");
                    box.classList.add("correct");
                    showMessage("You win!");
                }
                finished = true;
            } else {
                currentRow++;
                currentCol = 0;
            
                // Also create new DOM elements for this new row
                addBoardRow(currentRow);

                for (let c = 0; c < wordLength; c++) {
                    let box = document.getElementById(`box-${currentRow}-${c}`);
                    box.classList.remove("correct");

                    let box1 = document.getElementById(`box-${currentRow + 1}-${c}`);
                    box1.classList.remove("correct");

                    let box2 = document.getElementById(`box-${currentRow - 1}-${c}`);
                    box2.classList.remove("correct");
                    let letter = box2.textContent;
        
                    if (letter === target[c]) {
                        box1.classList.add("correct");
                        box2.classList.add("correct");
                    }
                }
            }
        }
        else{
            showMessage("Not a valid English word!");
        }
    }

    /**
     * Updates a text box on the screen with a message.
     * @param {string} msg - msg to be displayed
     */
    function showMessage(msg) {
        const msgArea = document.getElementById("message-area");
        msgArea.textContent = msg;
        msgArea.classList.remove("hidden");
    }
    
    init();
})();