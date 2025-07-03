/*
 * Author: Maria Vazhaeparambil
 * CS 132 Spring 2025
 * Date: June 6, 2025
 *
 * create-user.js - User creation logic for the game
 */

/**
 * Initializes the user creation form event listener and handles user creation logic.
 */
function init() {

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
    
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const isAdmin = document.getElementById("requestAdmin").checked;
      const role = isAdmin ? "admin" : "user";
    
      try {
        const res = await fetch("/new_user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, password, role })
        });
    
        const data = await res.json();
        const messageEl = document.getElementById("loginMessage");
    
        if (res.ok) {
          messageEl.textContent = "User created successfully!";
          messageEl.style.color = "green";
          setTimeout(() => {
              window.location.href = "/login.html"; // Change this to your desired landing page
          }, 1000);
        } else {
          messageEl.textContent = data.msg || "Failed to create user.";
          messageEl.style.color = "red";
        }
      } catch (err) {
        console.error(err);
        document.getElementById("createMessage").textContent = "Error connecting to server.";
      }
    });      
}

window.addEventListener("load", init);