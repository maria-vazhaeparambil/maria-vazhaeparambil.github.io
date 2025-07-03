/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * login.js - User login logic for the game
 */

/**
 * Initializes the login form event listener and handles user login logic.
 */
function init() {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    const messageElem = document.getElementById("loginMessage");

    if (response.ok) {
      messageElem.textContent = "Login successful! Redirecting...";
      messageElem.style.color = "green";

      // Save user info (make sure your server returns username and role)
      localStorage.setItem(
        "user",
        JSON.stringify({ username: result.username, role: result.role })
      );

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/index.html"; // Your main page
      }, 1000);
    } else {
      messageElem.textContent = result.msg || "Login failed.";
      messageElem.style.color = "red";
    }
  });
}

window.addEventListener("load", init);