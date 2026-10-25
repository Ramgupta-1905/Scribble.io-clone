# 🎨 Skribbl.io Clone — Real-Time Multiplayer Drawing Game

A browser-based multiplayer drawing and guessing game inspired by [skribbl.io](https://skribbl.io/). Players can join game rooms, take turns drawing a secret word, submit guesses through chat, and compete to earn points.

## 🚀 Live Demo

**Play the game:** [Skribbl.io Clone](https://skribbl-clone-frontend-vla2.onrender.com)

**Source Code:** [GitHub Repository](https://github.com/Ramgupta-1905/Scribble.io-clone)

## 📌 Project Overview

This project recreates the core experience of an online drawing and guessing game. It combines a React frontend with a Node.js backend and Socket.IO to manage multiplayer communication and game events in real time.

The project was developed as part of a Full Stack Intern Assignment.

## ✨ Features

- **Multiplayer Rooms:** Create or join game rooms.
- **Turn-Based Gameplay:** Players take turns selecting words and drawing.
- **Interactive Drawing Canvas:** Draw using a browser-based HTML5 Canvas.
- **Drawing Tools:** Pencil, multiple colors, adjustable brush size, and eraser.
- **Real-Time Communication:** Socket.IO events synchronize game activity between connected players.
- **Word Selection:** The drawer selects a secret word from available choices.
- **Guessing and Chat:** Players submit guesses and receive game feedback.
- **Scoring and Leaderboard:** Track player scores throughout the game.
- **Round Timer:** Timed drawing rounds.
- **Hints:** Display word-length or letter hints to help players guess.
- **Responsive Interface:** A browser-based interface for accessing the game.

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- HTML5 Canvas API
- CSS
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO

### Deployment
- Render — frontend and backend services

## 🏗️ Architecture Overview

The application uses a client-server architecture.

### Frontend
The React application manages the user interface, room interactions, drawing tools, chat, player information, and game state. The Canvas API captures and renders drawing strokes.

### Backend
The Node.js server manages rooms, player connections, turn order, word selection, guesses, scoring, and round progression.

### Real-Time Communication
Socket.IO enables event-based communication between the frontend and backend.

Examples of drawing events include:

- `draw_start` — begins a drawing stroke.
- `draw_move` — sends drawing coordinates.
- `draw_end` — finishes a stroke.
- `game_state` — communicates the current game state.
- `chat_message` — distributes chat messages.
- `round_start` and `round_end` — communicate round transitions.

### Typical Game Flow

1. A player joins or creates a room.
2. Players enter the game lobby.
3. The drawer receives word choices and selects a word.
4. The drawer draws on the canvas.
5. Other players submit guesses.
6. Correct guesses update the scores.
7. The round ends and the game proceeds to the next turn.

## 📁 Project Structure

```text
Scribble.io-clone/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── server.js
│   └── package.json
└── README.md
```

*The structure above is a simplified overview; individual files may vary.*

## ⚙️ Run Locally

### Prerequisites

- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Ramgupta-1905/Scribble.io-clone.git
cd Scribble.io-clone
```

### 2. Start the backend

```bash
cd backend
npm install
npm start
```

Keep the backend terminal running.

### 3. Configure and start the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

Replace `3000` with the port configured by your backend if it differs.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🌐 Deployment Configuration

The application is deployed on Render.

| Service | URL |
|---|---|
| Frontend | https://skribbl-clone-frontend-vla2.onrender.com |
| Backend | https://skribbl-clone-backend-kmz9.onrender.com |

Configure the frontend environment variable in Render:

```env
VITE_SERVER_URL=https://skribbl-clone-backend-kmz9.onrender.com
```

Configure the backend environment variable:

```env
FRONTEND_URL=https://skribbl-clone-frontend-vla2.onrender.com
```

Ensure the backend allows the deployed frontend origin and supports Socket.IO connections.

## 🧠 Key Technical Concepts

This project demonstrates practical use of:

- React components and state management
- TypeScript for typed frontend development
- HTML5 Canvas drawing operations
- WebSocket-based real-time communication through Socket.IO
- Event-driven client-server architecture
- Room and player management
- Turn-based game logic and score tracking
- Environment variables and full-stack deployment

## 🔮 Future Improvements

- Improve drawing synchronization and canvas recovery.
- Make countdown and round transitions more reliable.
- Improve cleanup of disconnected players.
- Add additional word categories and game settings.
- Improve reconnect handling and multiplayer testing.
- Add automated tests for room management and game flow.

## 👨‍💻 Author

**Ram Gupta**

- GitHub: [Ramgupta-1905](https://github.com/Ramgupta-1905)

---

Built as a full-stack multiplayer game project to explore real-time web development, interactive canvas rendering, and event-driven communication.
