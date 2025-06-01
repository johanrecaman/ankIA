<h1 align="center">AnkIA</h1>
<p align="center">
An AI-powered flashcard app.<br>
Built with React, Node.js, LangGraph, and SQLite. AI powered by Gemini.<br>
</p>
<p align="center">🚀 Currently in version V0.1</p>

---

## 🧠 About the Project
AnkIA is a flashcard-based study app where you upload a file and let the AI generate the flashcards for you.
The system processes your content using an AI agent to extract key concepts and automatically create cards, organizing everything in a study-friendly format.
The AI agent (built with LangGraph and Gemini) interacts with the backend and database to store and manage your flashcards — turning your notes into a personalized and intelligent learning experience.

*Note: The frontend was AI-generated and serves as a functional interface to showcase the core AI agent. The main focus of this project is the autonomous AI agent built with LangGraph.*

---

## 🧰 Tools & Tech Stack
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js + Express](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/)
- [Python + LangGraph](https://langgraph.org/)
- [Gemini API](https://aistudio.google.com/app/prompts/new_chat)

---

## ⚙️ How to Run
### 🔑 Requirements:
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- Gemini API Key

### 🔧 Environment Variables:
Create a `.env` file in the `ai-service` folder with the following:
```
GEMINI_API_KEY=your_key_here
```

---

### 🚀 Running the Project:
```bash
docker-compose up --build
```
This will start:
- Frontend on: `http://localhost:5173`
- Backend API on: `http://localhost:3001`
- AI Service on: `http://localhost:5050`
  
---

## 📦 Project Structure
```
.
├── ai-service         # LangGraph AI agent with Gemini
├── backend            # Node.js + Express + SQLite API
├── frontend           # React + Vite + Tailwind interface
└── docker-compose.yml # Orchestration
```

---

## 🤖 Features
- ✍️ Create, list, update, and delete flashcards
- 💬 Flashcard creation powered by Gemini AI
- 🧠 AI agent with LangGraph, capable of handling tasks autonomously
- 🔗 Full integration between AI, backend API, and database

---

## ✍️ Author
Made with 🔥 by Johan Stromberg
[![Instagram Badge](https://img.shields.io/badge/-Instagram-%23E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/_johanrecaman_)

---

## 💡 Future Improvements
- ✅ Authentication
- ✅ Manage flashcards by folder
- ✅ Improve UX/UI
- ✅ Switch to a more robust database (PostgreSQL or MongoDB)
- ✅ Deploy to the cloud
