/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * weaver-solver.js - Word Weaver game solver logic
 */

(function () {
  "use strict";

  const wordLength = 4;
  let wordList = [];

  /**
   * Initializes the solver UI and event listeners.
   */
  function init() {
    window.addEventListener("DOMContentLoaded", async () => {
      wordList = await loadWordList();

      document.getElementById("solve-btn").addEventListener("click", () => {
        const start = document.getElementById("start-word").value.trim().toUpperCase();
        const end = document.getElementById("end-word").value.trim().toUpperCase();
        const msgArea = document.getElementById("message-area");
        const grid = document.querySelector(".weaver-grid");

        msgArea.classList.add("hidden");
        grid.classList.add("hidden");
        grid.innerHTML = "";

        if (!start || !end) {
          showMessage("Please enter both a start and end word.");
          return;
        }

        if (start.length !== 4 || end.length !== 4) {
          showMessage("Words must be 4 letters long.");
          return;
        }

        if (!wordList.includes(start) || !wordList.includes(end)) {
          showMessage("Start or end word not found in dictionary.");
          return;
        }

        const graph = buildWordGraph(wordList);
        const path = findShortestPath(graph, start, end);

        if (!path) {
          showMessage("No solution exists between those words.");
          return;
        }

        for (const word of path) {
          const row = document.createElement("div");
          row.classList.add("row");
          for (let c = 0; c < wordLength; c++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.textContent = word[c];
            if (word[c] === end[c]) tile.classList.add("correct");
            row.appendChild(tile);
          }
          grid.appendChild(row);
        }

        grid.classList.remove("hidden");
      });
    });
  }

  /**
   * Displays a message in the message area.
   * @param {string} msg - The message to display
   */
  function showMessage(msg) {
    const msgArea = document.getElementById("message-area");
    msgArea.textContent = msg;
    msgArea.classList.remove("hidden");
  }

  /**
   * Loads the list of valid 4-letter words from a file.
   * @returns {Promise<string[]>} Array of words
   */
  async function loadWordList() {
    const resp = await fetch("../data/4-letter-words-processed-new.txt");
    if (!resp.ok) throw new Error("Failed to load word list");
    const text = await resp.text();
    return text.split("\n").map(word => word.trim().toUpperCase()).filter(word => word.length === 4);
  }

  /**
   * Builds a graph where each word is a node and edges connect words differing by one letter.
   * @param {string[]} words - List of valid words
   * @returns {Map} Graph of word connections
   */
  function buildWordGraph(words) {
    const graph = new Map();
    for (const word of words) {
      graph.set(word, []);
      for (const other of words) {
        if (word !== other && isOneLetterDiff(word, other)) {
          graph.get(word).push(other);
        }
      }
    }
    return graph;
  }

  /**
   * Checks if two words differ by exactly one letter.
   * @param {string} a - First word
   * @param {string} b - Second word
   * @returns {boolean} True if words differ by one letter
   */
  function isOneLetterDiff(a, b) {
    let diff = 0;
    for (let i = 0; i < wordLength; i++) {
      if (a[i] !== b[i]) diff++;
      if (diff > 1) return false;
    }
    return diff === 1;
  }

  /**
   * Finds the shortest path between start and end words in the graph.
   * @param {Map} graph - Word graph
   * @param {string} start - Start word
   * @param {string} end - End word
   * @returns {string[]|null} Array of words in the path, or null if no path
   */
  function findShortestPath(graph, start, end) {
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      if (last === end) return path;

      for (const neighbor of graph.get(last) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null;
  }
  
  init();
})();