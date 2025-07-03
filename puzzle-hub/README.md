# PuzzleHub 🧩

PuzzleHub is a modular browser-based gaming hub that currently features interactive versions of Sudoku and Wordle. The platform is designed to allow seamless addition of new logic puzzle games in the future.

## Getting Started

Follow the steps below to run the project locally:

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/puzzlehub.git
cd puzzlehub
```

### 2. Install Dependencies
Install the necessary Node.js packages:

```bash
npm install
```

If you're using nodemon for development, install it globally (optional):

```bash
npm install -g nodemon
```

Then isntall required packages:
```bash
npm install express multer promise-mysql
```

### 3. Set Up the Database
Make sure MySQL is installed and running.

Then, run the following command to create the required database and tables:

```bash
mysql -u root -p < setup-db.sql
```

This will prompt you for your MySQL root password.

### 4. Start the Server
To start the Node.js backend with automatic reloading on changes:

```bash
nodemon app.js
```

Alternatively, you can run it normally with:

```bash
node app.js
```

### 5. Open in Browser
Visit http://127.0.0.1:8080/ to start playing games on PuzzleHub!
