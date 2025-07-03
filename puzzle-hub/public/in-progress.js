/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * create-user.js - User creation logic for the game
 */

/**
 * Creates a puzzle card element for the in-progress games list, including event handlers for resume and remove.
 * @param {object} puzzle - Puzzle info object
 * @returns {HTMLElement} The puzzle card element
 */
function createPuzzleCard(puzzle) {

  const card = document.createElement("a");
  card.className = "game-card";
  card.className = "game-card";
  card.setAttribute("data-type", puzzle.puzzle_type);
  card.setAttribute("data-name", puzzle.puzzle_name);

  const img = document.createElement("img");
  img.src = puzzle.puzzle_img;
  card.appendChild(img);

  const span = document.createElement("span");
  span.textContent = puzzle.puzzle_name;
  card.appendChild(span);

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "✕"; // or any icon/text you want
  removeBtn.className = "remove-btn";
  removeBtn.title = "Remove puzzle";
  card.appendChild(removeBtn);

  removeBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    const card = removeBtn.closest(".game-card");
    const puzzleName = card.dataset.name;
    const username = JSON.parse(localStorage.getItem("user")).username;
  
    try {
      const response = await fetch("/old_puzzle_session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, puzzle_name: puzzleName }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      card.remove();
      // Update no-games message if no cards remain
      const gameList = document.querySelector('.game-list');
      const noGames = document.getElementById("no-games");
      if (gameList.children.length === 0) {
        noGames.textContent = "You have no games in progress.";
        noGames.style.display = "block";
      }
    } catch (err) {
      console.error("Failed to delete puzzle session:", err);
    }
  });
  
  // 👇 Click handler to resume puzzle
  card.addEventListener("click", async (e) => {
    console.log("card");
    e.preventDefault();
    const puzzleName = puzzle.puzzle_name;
    const username = JSON.parse(localStorage.getItem("user")).username;

    try {

      const sessionResp = await fetch(`/clicked_puzzle_session?username=${encodeURIComponent(username)}&puzzle_name=${encodeURIComponent(puzzleName)}`);
      if (!sessionResp.ok) throw new Error("Failed to fetch saved session.");
      const { game_data } = await sessionResp.json();

      const infoResp = await fetch(`/puzzle_info?puzzle_name=${encodeURIComponent(puzzleName)}`);
      if (!infoResp.ok) throw new Error("Failed to fetch puzzle info.");
      const puzzleInfo = await infoResp.json();

      localStorage.setItem(`${puzzleName.toLowerCase()} resume`, JSON.stringify(game_data));

      window.location.href = puzzleInfo.puzzle_url;

    } catch (err) {
      console.error("Error resuming puzzle:", err);
    }
  });


  return card;
}

/**
 * Loads and displays the user's in-progress games on DOMContentLoaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const gameList = document.querySelector('.game-list');
    const noGames = document.getElementById("no-games");

    // 🔄 Clear the game list container
    gameList.innerHTML = "";
    noGames.style.display = "none";
  
    if (!user || !user.username) {
      noGames.textContent = "Please log in to view your games.";
      noGames.style.display = "block";
      return;
    }
  
    try {
      const resp = await fetch(`/in_progress_games?username=${encodeURIComponent(user.username)}`);
      const data = await resp.json();
  
      if (!data.games || data.games.length === 0) {
        noGames.textContent = "You have no games in progress.";
        noGames.style.display = "block";
        return;
      }
  
      for (const puzzleName of data.games) {
        const puzzleResp = await fetch(`/puzzle_info?puzzle_name=${encodeURIComponent(puzzleName)}`);
        if (!puzzleResp.ok) continue; // skip if not found
  
        const puzzle = await puzzleResp.json();
  
        const card = createPuzzleCard(puzzle);
        gameList.appendChild(card);
      }
    } catch (err) {
      console.error("Error loading in-progress puzzles:", err);
      noGames.textContent = "Error loading games.";
      noGames.style.display = "block";
    }
});