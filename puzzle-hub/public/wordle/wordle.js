/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * This is the wordle.js file for the Wordle game.
 */

(function() {   
    "use strict"; 

    const maxRows = 6;
    const wordLength = 5;

    let wordGuessList = [];
    let wordSolutionList = [];
    let word = "";
    let finished = false;
    let currentRow = 0;
    let currentCol = 0;
    let board = Array.from({ length: maxRows }, () => Array(wordLength).fill(""));

    /**
     * Initializes the game page:
     * - Loads word list and randomly selects a target word.
     * - Attaches event listeners to buttons and keyboard inputs.
     * - Sets up initial game board.
     */
    async function init() {
        wordGuessList = await load_guess();
        wordSolutionList = await load_solution();

        document.querySelector("#button1").addEventListener("click", toggleView);
        document.querySelector("#button2").addEventListener("click", back);
        document.querySelector("#button3").addEventListener("click", setupBoard);

        const resumeData = localStorage.getItem("wordle resume");

        if (resumeData) {
            const gameData = JSON.parse(resumeData);
            localStorage.removeItem("wordle resume");
            toggleView();
            loadGameFromData(gameData);
            const store = currentRow;
            for (let i = 0; i < store; i++) {
                currentRow = i;
                checkWord(i);
            }
            currentRow = store;
            updateBoard();
        } else {
            word = wordSolutionList[Math.floor(Math.random() * wordSolutionList.length)];
            updateBoard();
        }
    }
    
    /**
     * Toggles the visibility of the game and instructions view, and sets up key event listeners.
     */
    function toggleView() {
        document.querySelector("#howto").classList.toggle("hidden");
        document.querySelector("#examples").classList.toggle("hidden");
        document.querySelector("#row1").classList.toggle("hidden");
        document.querySelector(".wordle-grid").classList.toggle("hidden");
        document.querySelector(".keyboard").classList.toggle("hidden");
        document.querySelector("#row2").classList.toggle("hidden");
        document.querySelector("#footer").classList.toggle("hidden");

        document.addEventListener("keydown", (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleKey('ENTER');
            } else {
                handleKey(e.key.toUpperCase());
            }
        });

        document.querySelectorAll(".key").forEach((btn) => {
            btn.addEventListener("click", () => {
                handleKey(btn.textContent.toUpperCase());
            });
        });
    }

    /**
     * Loads the game state from saved data and updates the board and current row.
     * @param {object} gameData - JSON string of the saved game data
     */
    function loadGameFromData(gameData){
        const game_data = JSON.parse(gameData);
        console.log(game_data);
        board = game_data.board;
        word = game_data.solution;
        currentRow = game_data.board.findIndex(row => row.every(cell => cell === ""));
    }

    /**
     * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
     */
    function back(){
        if (!finished && currentRow > 0 && window.localStorage.getItem("user")) {
            const user = JSON.parse(window.localStorage.getItem("user"));

            const change = []
            for (let r = 0; r < maxRows; r++) {
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
              
                if (!isComplete) {
                  change.push(Array(wordLength).fill("")); // Fill with blanks
                } else {
                  change.push(rowData);
                }
            }
            const gameData = {
                "board": change, 
                "solution": word
            }
            fetch("/new_puzzle_session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user?.username,
                    puzzle_name: "Wordle",
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
     * Resets the board and selects a new word.
     * Clears all tile content and styling, and resets game state variables.
     */
    function setupBoard() {
        word = wordSolutionList[Math.floor(Math.random() * wordSolutionList.length)];
        board = Array.from({ length: maxRows }, () => Array(wordLength).fill(""));
        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < wordLength; c++) {
                let box = document.getElementById(`box-${r}-${c}`);
                box.classList.remove("correct", "present", "absent");
            }
        }
        const keys = document.querySelectorAll(".key");

        keys.forEach(key => {
            key.classList.remove("correct", "present", "absent");
        });

        finished = false;
        currentRow = 0;
        currentCol = 0;
        updateBoard();
    }

    /**
     * Loads the list of valid words used for guessing and target selection.
     * @returns {string[]} - Array of uppercase 5-letter words.
     */
    async function load_solution() {
        const resp = await fetch("../data/wordle-answers-alphabetical.txt");
        if (!resp.ok) throw new Error("Failed to load word list");
        const text = await resp.text();
        const words = text.split("\n").map(word => word.trim().toUpperCase()).filter(word => word.length === 5);
        return words;
    }

    /**
     * Loads the list of valid words used for guessing and target selection.
     * @returns {string[]} - Array of uppercase 5-letter words.
     */
    async function load_guess() {
        const resp = await fetch("../data/wordle-allowed-guesses.txt");
        if (!resp.ok) throw new Error("Failed to load word list");
        const text = await resp.text();
        const words = text.split("\n").map(word => word.trim().toUpperCase()).filter(word => word.length === 5);
        return words;
    }

    /**
     * Updates the visual display of the game board based on the internal board state.
     */
    function updateBoard() {
        const msgArea = document.getElementById("message-area");
        msgArea.classList.add("hidden");
        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < wordLength; c++) {
                let box = document.getElementById(`box-${r}-${c}`);
                if (box) box.textContent = board[r][c];
            }
        }
    }

    /**
     * Handles key inputs from both physical and on-screen keyboards.
     * @param {string} key - The key input pressed by the user.
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
                    board[currentRow][currentCol] = "";
                    updateBoard();
                }
                return;
            }

            if (/^[A-Z]$/.test(key) && currentCol < wordLength) {
                board[currentRow][currentCol] = key;
                currentCol++;
                updateBoard();
            }
        }
    }

    /**
     * Checks the current guess against the target word and updates tile styling:
     * - "correct" for correct letter in correct position
     * - "present" for correct letter in wrong position
     * - "absent" for incorrect letter
     * Also advances the game state or ends the game if needed.
     */
    function checkWord() {
        const guess = board[currentRow].join("");
        const target = word.toUpperCase();

        if (!wordSolutionList.includes(guess) && !wordGuessList.includes(guess)) {
            showMessage("Not a valid English word!");
            return;
        }

        const letterCount = {};
        for (let letter of target) {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }

        const keyboardColor = {};

        // First pass: mark correct positions
        for (let c = 0; c < wordLength; c++) {
            const box = document.getElementById(`box-${currentRow}-${c}`);
            const letter = board[currentRow][c];
            box.classList.remove("correct", "present", "absent");

            if (letter === target[c]) {
                box.classList.add("correct");
                letterCount[letter]--;
                keyboardColor[letter] = "correct";
            }
        }

        // Second pass: mark present and absent
        for (let c = 0; c < wordLength; c++) {
            const box = document.getElementById(`box-${currentRow}-${c}`);
            const letter = board[currentRow][c];
            if (letter !== target[c]) {
                if (letterCount[letter] > 0) {
                    box.classList.add("present");
                    letterCount[letter]--;
                    if (keyboardColor[letter] !== "correct") {
                        keyboardColor[letter] = "present";
                    }
                } else {
                    box.classList.add("absent");
                    if (!keyboardColor[letter]) {
                        keyboardColor[letter] = "absent";
                    }
                }
            }
        }

        updateKeyboardColors(keyboardColor);

        if (guess === target) {
        finished = true;
        showMessage(`You win!`);
        } else if (currentRow === maxRows - 1) {
        finished = true;
        showMessage(`Out of guesses! The word was: ${target}`);
        } else {
        currentRow++;
        currentCol = 0;
        }
    }

    /**
     * Updates the colors of the on-screen keyboard based on the current guess results.
     * @param {object} colorMap - Map of letter to color ("correct", "present", "absent")
     */
    function updateKeyboardColors(colorMap) {
        document.querySelectorAll(".key").forEach((key) => {
            const keyText = key.textContent.trim().toUpperCase();
    
            if (colorMap[keyText]) {
                const current = colorMap[keyText];
    
                // Apply coloring based on priority: correct > present > absent
                if (current === "correct") {
                    key.classList.remove("present", "absent");
                    key.classList.add("correct");
                } else if (current === "present") {
                    if (!key.classList.contains("correct")) {
                        key.classList.remove("absent");
                        key.classList.add("present");
                    }
                } else if (current === "absent") {
                    if (!key.classList.contains("correct") && !key.classList.contains("present")) {
                        key.classList.add("absent");
                    }
                }
            }
        });
    }
    
    

    /**
     * Updates a text box on the screen with a message.
     * @param {string} msg - msg to be displayed
     */
    function showMessage(msg, duration = 10000) {
        const msgArea = document.getElementById("message-area");
        msgArea.textContent = msg;
        msgArea.classList.remove("hidden");
    }

    init();
})();