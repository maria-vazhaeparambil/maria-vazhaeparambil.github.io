/*
 * NAME: Maria Vazhaeparambil
 * DATE: June 2, 2025
 * CS 132 Spring 2023
 * 
 * This is the app.js file for my final project, a game manager.
 * This API supports the following endpoints:
 * 
 * GET /puzzle_list
 * GET /puzzle_info
 * GET /in_progress_games
 * GET /clicked_puzzle_session
 * 
 * POST /login
 * POST /new_user
 * POST /new_puzzle_session
 * 
 * DELETE /old_puzzle_session
 */

const DEBUG = false;

"use strict";
const express = require("express");
const mysql = require("promise-mysql");

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  if (DEBUG) {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

const SERVER_ERR_CODE = 500;
const SERVER_ERROR = "Server is currently down. Please try again later.";

const fs = require("fs");
const bcrypt = require("bcrypt"); // assuming you hash passwords

async function getDB() {
  try {
    const path = require("path");
    const caPath = path.join(__dirname, "ca.pem"); // resolves to full path
    console.log("CA file exists:", fs.existsSync(caPath));
    
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caPath)
      }
    });
    return db;
  } catch (err) {
    if (DEBUG){
      console.error("Database connection failed:", err.message);
    }
    console.error("Database connection failed:", err.message);
    throw err;
  }
}

/**
 * GET /puzzle_list
 * Returns all available puzzles with their details.
 * Response: Array of puzzles [{ puzzle_name, puzzle_img, puzzle_url, solver_url, puzzle_type, play_solve }]
 */
app.get("/puzzle_list", async (req, res, next) => {
  let db;
  try {
    console.log("Fetching puzzle list");
    db = await getDB();
    let qry = "SELECT * FROM puzzle_list";
    let rows = await db.query(qry);
    let jsonResponse = rows.map(row => {
      return {"puzzle_name": row.puzzle_name, "puzzle_img": row.puzzle_img, 
              "puzzle_url": row.puzzle_url, "solver_url": row.solver_url, 
              "puzzle_type": row.puzzle_type, "play_solve": row.playsolve};
      
    });
    res.json(jsonResponse);
  } catch (error) {
    console.log(process.env.DB_HOST);
    console.log(process.env.DB_PORT);
    console.log(process.env.DB_USER);
    console.log(process.env.DB_PASSWORD);
    console.log(process.env.DB_NAME);
    res.status(SERVER_ERR_CODE).json({"msg": SERVER_ERROR});
  }
  if (db) { // otherwise if error, then db not defined
    db.end();
  }
});

/**
 * GET /puzzle_info
 * Returns details for the specified puzzle.
 * Params: puzzle_name (string, required)
 * Response: { puzzle_name, puzzle_img, puzzle_url, puzzle_type, play_solve }
 */
app.get("/puzzle_info", async (req, res) => {
  const { puzzle_name } = req.query;
  let db;

  if (!puzzle_name) {
    return res.status(400).json({ msg: "Missing puzzle_name parameter" });
  }

  try {
    db = await getDB();
    const rows = await db.query("SELECT * FROM puzzle_list WHERE puzzle_name = ?", [puzzle_name]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Puzzle not found" });
    }

    const row = rows[0];
    const puzzle = {
      puzzle_name: row.puzzle_name,
      puzzle_img: row.puzzle_img,
      puzzle_url: row.puzzle_url,
      puzzle_type: row.puzzle_type,
      play_solve: row.playsolve
    };

    res.json(puzzle);
  } catch (err) {
    if (DEBUG) {
      console.error(err);
    }
    res.status(500).json({ msg: "Server error" });
  } finally {
    if (db) db.end();
  }
});

/**
 * GET /in_progress_games
 * Returns a list of in-progress games for the user.
 * Params: username (string, required)
 * Response: { games: [puzzle_name, ...] }
 */
app.get("/in_progress_games", async (req, res) => {
  const username = req.query.username;
  let db;

  if (!username) {
    return res.status(400).json({ msg: "Missing username" });
  }

  try {
    db = await getDB();
    let rows = await db.query(
      "SELECT puzzle_name FROM puzzle_sessions WHERE username = ?",
      [username]
    ); 
    let puzzleNames = [];
    for (const row of rows) {
      puzzleNames.push(row.puzzle_name);
    }
  
    res.json({ games: puzzleNames });
  } catch (error) {
    if (DEBUG) {
      console.error("Error fetching in-progress games:", error);
    }
    res.status(500).json({ msg: "Server error while fetching games" });
  } finally {
    if (db) db.end();
  }
});

/**
 * GET /clicked_puzzle_session
 * Returns and deletes the saved game session for the user and puzzle.
 * Params: username (string, required), puzzle_name (string, required)
 * Response: { game_data }
 */
app.get("/clicked_puzzle_session", async (req, res) => {
  const { username, puzzle_name } = req.query;
  let db;

  if (!username || !puzzle_name) {
    return res.status(400).json({ msg: "Missing username or puzzle_name" });
  }

  try {
    db = await getDB();

    const rows = await db.query(
      "SELECT game_data FROM puzzle_sessions WHERE username = ? AND puzzle_name = ?",
      [username, puzzle_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "No saved session found" });
    }

    const gameData = rows[0].game_data;

    await db.query(
      "DELETE FROM puzzle_sessions WHERE username = ? AND puzzle_name = ?",
      [username, puzzle_name]
    );

    res.json({ game_data: gameData });
  } catch (err) {
    if (DEBUG) {
      console.error(err);
    }  
    res.status(500).json({ msg: "Server error" });
  } finally {
    if (db) db.end();
  }
});

/**
 * POST /login
 * Authenticates a user.
 * Body: { username, password }
 * Response: { msg, username, role } on success, error message on failure.
 */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let db;

  if (!username || !password) {
    return res.status(400).json({ msg: "Missing username or password" });
  }

  try {
    db = await getDB();

    const rows = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    res.json({
      msg: "Login successful",
      username: user.username,
      role: user.role
    });

  } catch (error) {
    if (DEBUG) {
      console.error(error);
    }
    res.status(500).json({ msg: "Server error during login" });
  } finally {
    if (db) db.end();
  }
});

/**
 * POST /new_puzzle_session
 * Saves or updates a puzzle session for a user.
 * Body: { username, puzzle_name, game_data }
 * Response: { msg }
 */
app.post("/new_puzzle_session", async (req, res) => {
  const { username, puzzle_name, game_data } = req.body;
  let db;

  if (!username || !puzzle_name || !game_data) {
    return res.status(400).json({ msg: "Missing username, puzzle_name, or game_data" });
  }

  try {
    db = await getDB();

    // Check if a session already exists for this user and puzzle
    const existing = await db.query(
      "SELECT * FROM puzzle_sessions WHERE username = ? AND puzzle_name = ?",
      [username, puzzle_name]
    );

    if (existing.length > 0) {
      // Update the existing session
      await db.query(
        `UPDATE puzzle_sessions
         SET game_data = ?
         WHERE username = ? AND puzzle_name = ?`,
        [JSON.stringify(game_data), username, puzzle_name]
      );
    } else {
      // Insert a new session
      await db.query(
        `INSERT INTO puzzle_sessions (username, puzzle_name, game_data)
         VALUES (?, ?, ?)`,
        [username, puzzle_name, JSON.stringify(game_data)]
      );
    }

    res.json({ msg: "Puzzle session saved successfully" });
  } catch (error) {
    if (DEBUG) {
      console.error("Error updating puzzle session:", error);
    }
    res.status(500).json({ msg: "Server error while updating puzzle session" });
  } finally {
    if (db) db.end();
  }
});
  

/**
 * POST /new_user
 * Registers a new user.
 * Body: { username, password, role }
 * Response: { msg }
 */
app.post("/new_user", async (req, res) => {
    const { username, password, role } = req.body;
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    let db;
  
    if (!username || !password || !role) {
      return res.status(400).json({ msg: "Missing username, password, or role" });
    }
  
    try {
      db = await getDB();
  
      // Check if username already exists
      const existing = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );
  
      if (existing.length > 0) {
        return res.status(409).json({ msg: "Username already exists" });
      }
  
      // Insert new user
      await db.query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, hashedPassword, role]
      );
  
      res.json({ msg: "User created successfully" });
    } catch (error) {
      if (DEBUG) {
        console.error(error);
      }    
      res.status(500).json({ msg: "Server error while creating user" });
    } finally {
      if (db) db.end();
    }
});

/**
 * DELETE /old_puzzle_session
 * Deletes a saved puzzle session for a user and returns its data.
 * Body: { username, puzzle_name }
 * Response: { game_data }
 */
app.delete('/old_puzzle_session', async (req, res) => {
  const { username, puzzle_name } = req.body;

  if (!username || !puzzle_name) {
    return res.status(400).json({ error: "Missing data" });
  }

  let db;
  try {
    db = await getDB();

    const rows = await db.query(
      "SELECT game_data FROM puzzle_sessions WHERE username = ? AND puzzle_name = ?",
      [username, puzzle_name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "No saved session found" });
    }

    const gameData = rows[0].game_data;

    await db.query(
      "DELETE FROM puzzle_sessions WHERE username = ? AND puzzle_name = ?",
      [username, puzzle_name]
    );

    res.json({ game_data: gameData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  } finally {
    if (db) await db.end();
  }
});


const PORT = process.env.PORT || 11450;
app.listen(PORT, () => console.log("Listening on port " + PORT));