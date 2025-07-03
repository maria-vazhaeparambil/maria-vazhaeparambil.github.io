GET /puzzle_list
parameters: None
return: JSON [{"puzzle_name": "string",            "puzzle_img": "string",     "puzzle_url": "string",
               "solver_url": "string",             "puzzle_type": "string",    "play_solve": "string"}]
    example: [{"puzzle_name": "Sudoku",            "puzzle_img": "sudoku.png", "puzzle_url": "sudoku.html",
               "solver_url": "sudoku-solver.html", "puzzle_type": "logic",     "play_solve": "play"}]
error handling: 500: { "msg": "Server is currently down. Please try again later." }

GET /puzzle_info
parameters: puzzle_name (string, required, query)
return: JSON {"puzzle_name": "string", "puzzle_img": "string",     "puzzle_url": "string", 
              "puzzle_type": "string", "play_solve": "string"}
    example: {"puzzle_name": "Sudoku", "puzzle_img": "sudoku.png", "puzzle_url": "sudoku.html", 
              "puzzle_type": "logic",  "play_solve": "play"}
error handling: 400: { "msg": "Missing puzzle_name parameter" }
                404: { "msg": "Puzzle not found" }
                500: { "msg": "Server error" }

GET /in_progress_games
parameters: username (string, required, query)
return: JSON {"games": ["string", ...]}
    example: {"games": ["Sudoku", "Connect 4"]}
error handling: 400: { "msg": "Missing username" }
                500: { "msg": "Server error while fetching games" }

GET /clicked_puzzle_session
parameters: username (string, required, query), puzzle_name (string, required, query)
return: JSON {"game_data": object}
    example: {"game_data": {"board": [[0,1],[1,0]], "currentPlayer": 1}}
error handling: 400: { "msg": "Missing username or puzzle_name" }
                404: { "msg": "No saved session found" }
                500: { "msg": "Server error" }

POST /login
parameters: username (string, required, body), password (string, required, body)
return: JSON {"msg": "string",           "username": "string", "role": "string"}
    example: {"msg": "Login successful", "username": "alice",  "role": "user"}
error handling: 400: { "msg": "Missing username or password" }
                401: { "msg": "Invalid username or password" }
                500: { "msg": "Server error during login" }

POST /new_user
parameters: username (string, required, body), password (string, required, body), role (string, required, body)
return: JSON {"msg": "string"}
    example: {"msg": "User created successfully"}
error handling: 400: { "msg": "Missing username, password, or role" }
                409: { "msg": "Username already exists" }
                500: { "msg": "Server error while creating user" }

POST /new_puzzle_session
parameters: username (string, required, body), puzzle_name (string, required, body), game_data (object, required, body)
return: JSON {"msg": "string"}
    example: {"msg": "Puzzle session saved successfully"}
error handling: 400: { "msg": "Missing username, puzzle_name, or game_data" }
                500: { "msg": "Server error while updating puzzle session" }

DELETE /old_puzzle_session
parameters: username (string, required, body), puzzle_name (string, required, body)
return: JSON {"game_data": object}
    example: {"game_data": {"board": [[0,1],[1,0]], "currentPlayer": 1}}
error handling: 400: { "error": "Missing data" }
                404: { "msg": "No saved session found" }
                500: { "msg": "Server error" }