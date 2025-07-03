/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * wordle-solver.js - Wordle game solver logic
 */

(function () {
  "use strict";

  const COLORS = ["absent", "correct", "present"];
  let DICTIONARY = [];

  /**
   * Initializes the solver: loads word lists and sets up the solve button.
   */
  async function init() {
    // Load solution and guess word lists
    const solutions = await load_solution();
    const guesses = await load_guess();
    DICTIONARY = Array.from(new Set([...solutions, ...guesses]));

    // Enable solve button
    const solveBtn = document.getElementById("solve-btn");
    solveBtn.disabled = false;
    solveBtn.addEventListener("click", e => {
      e.preventDefault();
      solveWordle();
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    createInputRows();
    init(); // load dictionary and bind UI
  });

  /**
   * Loads the list of valid solution words from a file.
   * @returns {Promise<string[]>} Array of solution words
   */
  async function load_solution() {
    const resp = await fetch("../data/wordle-answers-alphabetical.txt");
    if (!resp.ok) throw new Error("Failed to load solution words");
    const text = await resp.text();
    return text.split("\n").map(w => w.trim().toUpperCase()).filter(w => w.length === 5);
  }

  /**
   * Loads the list of valid guess words from a file.
   * @returns {Promise<string[]>} Array of guess words
   */
  async function load_guess() {
    const resp = await fetch("../data/wordle-allowed-guesses.txt");
    if (!resp.ok) throw new Error("Failed to load guess words");
    const text = await resp.text();
    return text.split("\n").map(w => w.trim().toUpperCase()).filter(w => w.length === 5);
  }

  /**
   * Creates the input rows for guesses and color selectors in the UI.
   */
  function createInputRows() {
    const container = document.getElementById("input-rows");
    for (let r = 0; r < 6; r++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "row";

      for (let c = 0; c < 5; c++) {
        const letterInput = document.createElement("input");
        letterInput.type = "text";
        letterInput.maxLength = 1;
        letterInput.className = "tile-input";
        letterInput.setAttribute("data-row", r);
        letterInput.setAttribute("data-col", c);
        letterInput.autocomplete = "off";
        letterInput.spellcheck = false;
        letterInput.pattern = "[a-zA-Z]";
        letterInput.title = "Enter letter";

        const colorSelect = document.createElement("select");
        colorSelect.className = "color-select";
        colorSelect.setAttribute("data-row", r);
        colorSelect.setAttribute("data-col", c);
        colorSelect.title = "Select tile color";

        COLORS.forEach(color => {
          const option = document.createElement("option");
          option.value = color;
          option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
          colorSelect.appendChild(option);
        });

        const tileWrapper = document.createElement("div");
        tileWrapper.style.display = "flex";
        tileWrapper.style.flexDirection = "column";
        tileWrapper.style.alignItems = "center";
        tileWrapper.style.marginRight = "0.4rem";

        tileWrapper.appendChild(letterInput);
        tileWrapper.appendChild(colorSelect);
        rowDiv.appendChild(tileWrapper);
      }

      container.appendChild(rowDiv);
    }
  }

  /**
   * Solves Wordle based on user input and displays possible solutions.
   */
  function solveWordle() {
    const guesses = [];
    const rows = 6, cols = 5;

    for (let r = 0; r < rows; r++) {
      let word = "";
      let colors = [];
      let emptyRow = true;

      for (let c = 0; c < cols; c++) {
        const letterInput = document.querySelector(`input.tile-input[data-row="${r}"][data-col="${c}"]`);
        const colorSelect = document.querySelector(`select.color-select[data-row="${r}"][data-col="${c}"]`);
        const letter = letterInput.value.trim().toLowerCase();
        const color = colorSelect.value;

        if (letter.length === 1 && /[a-z]/.test(letter)) {
          word += letter;
          colors.push(color);
          emptyRow = false;
        } else {
          word += " ";
          colors.push("absent");
        }
      }

      if (!emptyRow) {
        guesses.push({ word, colors });
      }
    }

    const possibleWords = DICTIONARY.filter(word => wordMatchesGuesses(word, guesses));
    displaySolutions(possibleWords);
  }

  /**
   * Checks if a word matches all user guesses and color patterns.
   * @param {string} word - Candidate word
   * @param {Array} guesses - Array of guess objects
   * @returns {boolean} True if word matches all guesses
   */
  function wordMatchesGuesses(word, guesses) {
    for (const guess of guesses) {
      if (!matchesSingleGuess(word, guess.word, guess.colors)) return false;
    }
    return true;
  }

  /**
   * Checks if a candidate word matches a single guess and color pattern.
   * @param {string} candidate - Candidate word
   * @param {string} guessWord - User's guess word
   * @param {Array} colors - Array of color strings
   * @returns {boolean} True if candidate matches the guess
   */
  function matchesSingleGuess(candidate, guessWord, colors) {
    candidate = candidate.toLowerCase();
    guessWord = guessWord.toLowerCase();

    // Check "correct"
    for (let i = 0; i < 5; i++) {
      if (colors[i] === "correct" && candidate[i] !== guessWord[i]) {
        return false;
      }
    }

    // Check "present"
    for (let i = 0; i < 5; i++) {
      if (colors[i] === "present") {
        if (candidate[i] === guessWord[i]) return false;
        if (!candidate.includes(guessWord[i])) return false;
      }
    }

    // Check "absent"
    for (let i = 0; i < 5; i++) {
      if (colors[i] === "absent") {
        const letter = guessWord[i];
        const requiredOccurrences = colors.reduce((count, col, idx) => {
          return (guessWord[idx] === letter && (col === "correct" || col === "present")) ? count + 1 : count;
        }, 0);

        const actualOccurrences = candidate.split("").filter(ch => ch === letter).length;
        if (requiredOccurrences === 0 && candidate.includes(letter)) return false;
        if (requiredOccurrences > 0 && actualOccurrences > requiredOccurrences) return false;
      }
    }

    return true;
  }

  /**
   * Displays the possible solution words in the UI.
   * @param {Array} words - Array of possible solution words
   */
  function displaySolutions(words) {
    const results = document.getElementById("results");
    results.textContent = words.length === 0
      ? "No matching words found."
      : words.join(", ");
  }
})();
