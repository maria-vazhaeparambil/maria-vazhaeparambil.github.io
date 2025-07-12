/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * memory.js - Memory game logic
 */

(function () {
  "use strict";

  let numPairs = 4;
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let tried = false;

  let board = [];
  let currentPlayer = 1;
  let scores = { 1: 0, 2: 0 };
  let matchedPairs = [];

  window.addEventListener("load", init);

  /**
   * Initializes the game, sets up event listeners, and loads a saved game if present.
   */
  function init() {
    tried = false;
    document.querySelector("#button1").addEventListener("click", toggleView);
    document.querySelector("#button2").addEventListener("click", back);
    document.querySelector("#button3").addEventListener("click", startGame);
    document.querySelector("#pairCount").addEventListener("input", updatePairCount);
    startGame();

    const resumeData = localStorage.getItem("memory game resume");

      if (resumeData) {
          const gameData = JSON.parse(resumeData);
          localStorage.removeItem("memory game resume");
          toggleView();
          loadGameFromData(gameData);
      }
  }

  /**
   * Loads the game state from saved data and updates the board, player, and scores.
   * @param {string} gameData - JSON string of the saved game data
   */
  function loadGameFromData(gameData) {
    const game_data = gameData;
    board = game_data.board;
    currentPlayer = game_data.currentPlayer;
    matchedPairs = game_data.matchedPairs;
    scores = game_data.scores;
    tried = true;
  
    const game = document.querySelector("#game-board");
    game.innerHTML = "";
  
    // Track how many times each matched value has been rendered as revealed
    const matchedRevealCount = {};
  
    board.forEach((num, idx) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.dataset.value = num;
      
      // Check if we should reveal this card as matched
      if (matchedPairs.includes(String(num))) {
        matchedRevealCount[num] = (matchedRevealCount[num] || 0) + 1;
        if (matchedRevealCount[num] <= 2) {
          card.textContent = num;
          card.classList.add("matched");
        }
      }
  
      card.addEventListener("click", flipCard);
      game.appendChild(card);
    });
  
    updateScoreDisplay();
  }  

  /**
   * Handles the back button: saves the game if in progress and user is logged in, then navigates back.
   */
  function back(){
    if (numPairs !== matchedPairs.length && tried && window.localStorage.getItem("user")) {
        const user = JSON.parse(window.localStorage.getItem("user"));
        
        const gameData = {
            "board": board,
            "currentPlayer": currentPlayer,
            "matchedPairs": matchedPairs,
            "scores": scores
        }
        fetch("/new_puzzle_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              username: user?.username,
              puzzle_name: "Memory Game",
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
   * Toggles the visibility of the game and instructions/settings view.
   */
  function toggleView() {
    document.querySelector("#howto").classList.toggle("hidden");
    document.querySelector("#row1").classList.toggle("hidden");
    document.querySelector("#settings-form").classList.toggle("hidden");
    document.querySelector("#game-board").classList.toggle("hidden");
    document.querySelector(".scoreboard").classList.toggle("hidden");
    document.querySelector("#row2").classList.toggle("hidden");
  }

  /**
   * Updates the number of pairs for the game based on user input.
   */
  function updatePairCount() {
    const value = parseInt(this.value);
    if (!isNaN(value) && value >= 2 && value <= 10) {
      numPairs = value;
    }
  }

  /**
   * Starts a new game, shuffles the cards, and resets all state.
   */
  function startGame() {
    matchedPairs = [];
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    tried = false;
    currentPlayer = 1;
    scores = { 1: 0, 2: 0 };
    updateScoreDisplay();

    const game = document.querySelector("#game-board");
    game.innerHTML = "";

    board = [];
    for (let i = 1; i <= numPairs; i++) {
      board.push(i, i); // Add pair
    }
    shuffle(board);

    board.forEach((num) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.dataset.value = num;
      card.addEventListener("click", flipCard);
      game.appendChild(card);
    });
  }

  /**
   * Handles flipping a card and checks for a match.
   */
  function flipCard() {
    if (lockBoard || this.classList.contains("matched") || this === firstCard) return;

    this.textContent = this.dataset.value;
    this.classList.add("flipped");

    if (!firstCard) {
      firstCard = this;
      return;
    }

    secondCard = this;
    checkMatch();
  }

  /**
   * Checks if the two flipped cards are a match and updates the game state.
   */
  function checkMatch() {
    tried = true;
    lockBoard = true;
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;
  
    if (isMatch) {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      scores[currentPlayer]++;
      matchedPairs.push(firstCard.dataset.value);
      updateScoreDisplay();
  
      if (matchedPairs.length === numPairs) {
        displayWinner();
        return;
      }
  
      resetFlips();
    } else {
      setTimeout(() => {
        firstCard.textContent = "";
        secondCard.textContent = "";
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateScoreDisplay();
        resetFlips();
      }, 1000);
    }
  }  

  /**
   * Displays the winner or tie message at the end of the game.
   */
  function displayWinner() {
    const p1 = scores[1];
    const p2 = scores[2];
    let message = "";
  
    if (p1 > p2) {
      message = "Player 1 Wins!";
    } else if (p2 > p1) {
      message = "Player 2 Wins!";
    } else {
      message = "It's a Tie!";
    }
  
    document.querySelector("#turn-indicator").textContent = message;
  }
  

  /**
   * Resets the flipped cards and unlocks the board for the next turn.
   */
  function resetFlips() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
  }

  /**
   * Shuffles the array of cards using Fisher-Yates algorithm.
   * @param {Array} array - The array to shuffle
   */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Updates the score display and turn indicator in the UI.
   */
  function updateScoreDisplay() {
    document.querySelector("#player1-score").textContent = `Player 1: ${scores[1]}`;
    document.querySelector("#player2-score").textContent = `Player 2: ${scores[2]}`;
    document.querySelector("#turn-indicator").textContent = `Turn: Player ${currentPlayer}`;
  }
})();
