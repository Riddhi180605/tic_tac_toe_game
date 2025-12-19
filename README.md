# 🎮 TicToc – Advanced Tic-Tac-Toe Game

**TicToc** is a modern, feature-rich **Tic-Tac-Toe web application** built using **HTML, CSS, JavaScript, and Firebase**.  
It supports **Offline Multiplayer**, **Play vs Computer (AI)**, and **Real-Time Online Multiplayer** with room-based matchmaking.

This project demonstrates advanced frontend development, real-time synchronization, AI algorithms, and modern UI/UX design.

---

## 🚀 Live Overview

TicToc enhances the classic Tic-Tac-Toe game with:
- Real-time online gameplay
- Intelligent AI using the **Minimax algorithm**
- Smooth animations & modern UI
- Score tracking and match feedback

Designed to be **fast, interactive, and visually engaging**.

---

## 🧠 Game Modes

### 👥 Offline Multiplayer
- Two players play on the same device
- Alternating turns (X and O)
- Score tracking across rounds

### 🤖 Play vs Computer
- Play against an unbeatable AI
- AI powered by **Minimax algorithm**
- Smart decision-making with optimal moves

### 🌐 Online Multiplayer (Real-Time)
- Create or join a room using a **6-digit room code**
- Real-time synchronization using **Firebase Realtime Database**
- Turn-based logic with move validation
- Automatic opponent detection

---

## ✨ Key Features

- 🎨 Modern UI with glassmorphism & neon effects
- 🔄 Smooth transitions and animations
- 🧠 AI opponent using Minimax
- 🌐 Real-time multiplayer using Firebase
- 🔐 Room-based matchmaking
- 🏆 Score tracking
- 🎉 Confetti celebration on win
- 🔔 Toast notifications
- ⌨️ Keyboard support
- 📱 Fully responsive design

---

## 🛠️ Tech Stack

- **HTML5** – Application structure  
- **CSS3** – Styling, animations, responsive UI  
- **JavaScript (Vanilla)** – Game logic & state management  
- **Firebase Realtime Database** – Online multiplayer  
- **Canvas-Confetti** – Win celebration animations  

---

## 📂 Project Structure

tic-toc/
│
├── index.html # Main HTML file
├── style.css # UI styling & animations
├── script.js # Game logic, AI & Firebase integration
└── README.md # Project documentation

---

## ⚙️ How It Works (High Level)

1. User selects a game mode
2. Game board is dynamically rendered
3. Player actions update game state
4. AI uses Minimax for best move selection
5. Online mode syncs board state via Firebase
6. Winner is detected using predefined patterns
7. UI updates scores, highlights winning cells, and shows confetti

---

## 🧪 AI Logic

- Uses **Minimax algorithm**
- Ensures optimal move selection
- Impossible to beat
- Depth-based scoring for faster wins

---

## 🔐 Online Multiplayer Logic

- Room creation using random 6-digit code
- Firebase acts as the single source of truth
- Turn validation prevents double moves
- Real-time board sync between players

---

## 🎯 Learning Outcomes

This project demonstrates:
- Advanced DOM manipulation
- State management in JavaScript
- Real-time data synchronization
- AI game algorithms (Minimax)
- Firebase integration
- Clean, scalable code architecture
- UI/UX animation principles

---
⚠️ Firebase credentials are client-side and safe to expose.
This project uses open database rules for demo purposes only.
