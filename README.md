# 🎨 Skribbl.io Clone

A full-stack **Skribbl.io clone** inspired by the original online drawing and guessing game. This project recreates the core multiplayer experience, allowing players to join rooms, draw secret words, guess what other players are drawing, and compete for the highest score.

🌐 **Live Demo:** [Play Skribbl.io Clone](https://skribbl-clone-frontend-vla2.onrender.com)

> **Disclaimer:** This is an independent educational project inspired by Skribbl.io. It is not the official Skribbl.io application and is not affiliated with its original creators.

## ✨ Features

- **Real-Time Multiplayer:** Play with other players using WebSockets.
- **Room-Based Gameplay:** Create rooms and join games with friends.
- **Interactive Drawing Canvas:** Draw with different colors, tools, and brush sizes.
- **Word Selection:** Choose a secret word when it is your turn to draw.
- **Live Word Hints:** Use hints to guess the secret word.
- **Countdown Timer:** Guess correctly before the round ends.
- **Scoring System:** Earn points for correct guesses.
- **Multiple Rounds:** Play through rounds with rotating drawers.
- **Real-Time Synchronization:** Keep game state and drawing events synchronized between players.
- **Leaderboard:** Compare scores and identify the winner.
- **Final Results:** View game results when the match finishes.
- **Responsive Interface:** Play across different screen sizes.

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO

### Deployment
- Render Static Site
- Render Web Service

## 🎮 How to Play

1. Open the [live game](https://skribbl-clone-frontend-vla2.onrender.com).
2. Create a room or join an existing room.
3. Wait for the game to start.
4. When it is your turn, select a word from the available options.
5. Draw the selected word on the canvas.
6. Other players try to guess the word before the timer runs out.
7. Earn points for correct guesses and continue playing through the rounds.
8. Check the final leaderboard to see the results.

## 🚀 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ramgupta-1905/Scribble.io-clone.git
cd Scribble.io-clone
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm start
```

### 3. Set Up the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Configure the backend URL in the frontend `.env` file using the environment variable expected by your source code. For example:

```env
VITE_SERVER_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL shown in your terminal, usually `http://localhost:5173`.

> **Note:** The environment variable names above are examples. Make sure they match the variables used in your actual frontend and backend code.

## 📁 Project Structure

```text
Scribble.io-clone/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── ...
└── README.md
```

## 🌐 Deployment

The project is deployed on Render.

- **Frontend:** [Skribbl.io Clone](https://skribbl-clone-frontend-vla2.onrender.com)
- **Backend:** [Backend Service](https://skribbl-clone-backend-kmz9.onrender.com)

The frontend communicates with the backend using Socket.IO to enable real-time multiplayer gameplay.

## 🧠 Key Learnings

This project demonstrates practical experience with:

- Building interactive applications with React and TypeScript.
- Developing backend services with Node.js and Express.
- Implementing real-time communication using Socket.IO.
- Managing multiplayer game state on the server.
- Synchronizing drawing events between players.
- Handling timers, rounds, scores, and game results.
- Configuring environment variables and deploying a full-stack application.

## 🔮 Future Improvements

- Improve reconnection handling when players lose connectivity.
- Add more drawing tools and canvas controls.
- Improve mobile gameplay and drawing support.
- Introduce additional game customization options.
- Optimize real-time event handling for larger rooms.

## 📄 License

This project is intended for educational and learning purposes. A specific open-source license can be added if you decide to distribute the project under one.

---

**Built with ❤️ using React, TypeScript, Node.js, and Socket.IO.**
