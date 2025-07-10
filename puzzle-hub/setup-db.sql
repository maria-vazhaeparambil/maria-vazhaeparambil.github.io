-- Create and use the database
CREATE DATABASE IF NOT EXISTS puzzledb;
USE puzzledb;

-- Drop tables if they already exist
DROP TABLE IF EXISTS puzzle_list;
DROP TABLE IF EXISTS puzzle_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS faq;

-- Create puzzle_list table (this was missing!)
CREATE TABLE puzzle_sessions (
    username VARCHAR(50) NOT NULL,
    puzzle_name VARCHAR(255) NOT NULL,
    game_data JSON NOT NULL,
    CONSTRAINT unique_pairing UNIQUE (username, puzzle_name)
);

-- Create users table
CREATE TABLE users (
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user'
);

-- Create faq table
CREATE TABLE faq (
    faq_id INT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

-- Create puzzle_list table (this was missing!)
CREATE TABLE puzzle_list (
    puzzle_name VARCHAR(100) NOT NULL,
    puzzle_img VARCHAR(255) NOT NULL,
    puzzle_url VARCHAR(255) NOT NULL,
    solver_url VARCHAR(255),
    puzzle_type VARCHAR(10) NOT NULL,
    playsolve BOOLEAN NOT NULL
);

-- Insert puzzle data
INSERT INTO puzzle_list(puzzle_name, puzzle_img, puzzle_url, solver_url, puzzle_type, playsolve) VALUES
('Connect 4', 'imgs/connect4-icon.png', 'connect4/connect4.html', NULL, 'two-player', FALSE),
('Memory Game', 'imgs/memory-icon.png', 'memory/memory.html', NULL, 'two-player', FALSE),
('Minesweeper', 'imgs/minesweeper-icon.png', 'minesweeper/minesweeper.html', 'minesweeper/minesweeper-solver.html', 'logic', TRUE),
('Sliding Game', 'imgs/sliding-icon.png', 'sliding/sliding.html', NULL, 'logic', FALSE),
('Sudoku', 'imgs/sudoku-icon.png', 'sudoku/sudoku.html', 'sudoku/sudoku-solver.html', 'logic', TRUE),
('Tic Tac Toe', 'imgs/tictactoe-icon.png', 'tictactoe/tictactoe.html', NULL, 'two-player', FALSE),
('Tower of Hanoi', 'imgs/tower-icon.png', 'hanoi/hanoi.html', NULL, 'logic', FALSE),
('Weaver', 'imgs/weaver-icon.png', 'weaver/weaver.html', 'weaver/weaver-solver.html', 'word', TRUE),
('Wordle', 'imgs/wordle-icon.png', 'wordle/wordle.html', 'wordle/wordle-solver.html', 'word', TRUE);