/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * index.js - Main game logic for the Puzzle Hub
 */

(function () {
  "use strict";

  const filterSelect = document.getElementById('filter');
  const playList = document.getElementById('play-list');
  const solveList = document.getElementById('solve-list');
  const solveHeading = document.getElementById('solve-heading');

  document.addEventListener("DOMContentLoaded", () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
  
    const topBar = document.querySelector(".top-bar");
    const loginButton = topBar.querySelector(".login-button");
  
    if (user) {
      // Hide login button
      if (loginButton) loginButton.style.display = "none";
  
      // Create logout button
      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Logout";
      logoutBtn.className = "button logout-button";
      logoutBtn.onclick = () => {
        localStorage.removeItem("user");
        window.location.reload();
      };
      topBar.appendChild(logoutBtn);

      const inProgressBtn = document.createElement("button");
      inProgressBtn.textContent = "In Progress";
      inProgressBtn.className = "in-progress button";
      inProgressBtn.onclick = () => {
        window.location.href = "in-progress.html";
      };
      topBar.appendChild(inProgressBtn);
  
      // Show solve section if user is admin
      if (user.role === "admin") {
        document.getElementById("solve-heading").classList.remove("hidden");
        document.getElementById("solve-list").classList.remove("hidden");
      }
    }
  });
  

  /**
   * Creates a puzzle card element for the play or solve list.
   * @param {object} puzzle - Puzzle info object
   * @param {number} status - 0 for play, 1 for solve
   * @returns {HTMLElement} The puzzle card element
   */
  function createPuzzleCard(puzzle, status) {
    const card = document.createElement("a");
    card.href = puzzle.puzzle_url;
    if (status === 0){
      card.href = puzzle.puzzle_url;
    }
    else {
      card.href = puzzle.solver_url;
    }
    card.className = "game-card";
    card.setAttribute("data-type", puzzle.puzzle_type);

    const img = document.createElement("img");
    img.src = puzzle.puzzle_img;
    card.appendChild(img);

    const span = document.createElement("span");
    span.textContent = puzzle.puzzle_name;
    card.appendChild(span);

    return card;
  }

  /**
   * Loads all puzzles from the server and populates the play and solve lists.
   */
  async function loadPuzzles() {
    try {
      const resp = await fetch("/puzzle_list");
      const puzzles = await resp.json();
      console.log(puzzles);

      if (Array.isArray(puzzles)) {
        puzzles.forEach(puzzle => {
          const card = createPuzzleCard(puzzle, 0);
          playList.appendChild(card);
          if (puzzle.play_solve === 1) {
            const solveCard = createPuzzleCard(puzzle, 1);
            solveList.appendChild(solveCard);
          }
        });
      } else {
        console.error("Unexpected puzzle data:", puzzles);
      }
  
      // Do not unhide solve section here — keep hidden by default
    } catch (err) {
      console.error("Failed to load puzzles:", err);
    }
  }

  filterSelect.addEventListener("change", function () {
    const selected = this.value;
    const allCards = document.querySelectorAll(".game-card");

    allCards.forEach(card => {
      const type = card.getAttribute("data-type");
      if (selected === "all" || type === selected) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });

    if (selected === "two-player") {
      solveHeading.style.display = "none";
      solveList.style.display = "none";
    } else {
      if (!solveList.classList.contains("hidden")) {
        solveHeading.style.display = "";
        solveList.style.display = "";
      }
    }
  });

  // Load puzzles when page loads
  loadPuzzles();
})();
