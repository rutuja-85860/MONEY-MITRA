💰 MONEY-MITRA

AI-Powered Personal Finance & Risk Management Platform

MONEY-MITRA is a full-stack MERN application designed to help users track expenses, analyze spending behavior, assess financial risk, and receive AI-driven insights through a smart voice-enabled assistant.
Built for scalability, real-world use cases, and hackathon-grade evaluation.

🚀 Key Features
🔐 Authentication & User Management

Secure user registration & login (JWT-based)

Protected routes for authenticated users

User profile & financial configuration management

📊 Financial Intelligence Engine

Income vs Expense analysis

Spending heatmaps & trend detection

Safe-to-Spend calculation engine

Risk analysis & overspending alerts

Automated weekly/monthly summaries

🛑 Kill Switch System

Emergency spending lock

Prevents high-risk transactions dynamically

Rule-based + AI-assisted decision logic

🧠 AI-Powered Insights

AI-generated financial summaries

Smart spending advice

Risk prediction using financial behavior

Voice-enabled assistant powered by Groq LLM

🎙 Voice Assistant

Ask finance-related questions via voice

Real-time AI responses

Integrated with backend intelligence services

🏗 Tech Stack
Frontend

React (Vite)

JavaScript

CSS

Chart-based data visualization

Modular component architecture

Backend

Node.js

Express.js

MongoDB

JWT Authentication

RESTful API design

Modular service-based architecture

AI & Automation

Groq LLM API

Custom Financial Engines:

RiskEngine

SafeToSpendEngine

KillSwitchEngine

Automated cron-based summaries

📁 Project Structure
MONEY-MITRA/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md

⚙️ Environment Variables
Backend (backend/.env)
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key

Frontend (frontend/.env)
VITE_API_BASE_URL=http://localhost:5000


⚠️ Never commit .env files. They are ignored via .gitignore.

▶️ How to Run the Project Locally
1️⃣ Clone the Repository
git clone https://github.com/rutuja-85860/MONEY-MITRA.git
cd MONEY-MITRA

2️⃣ Backend Setup
cd backend
npm install
npm start


Backend runs on:
👉 http://localhost:5000

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev


Frontend runs on:
👉 http://localhost:5173

🧪 API Capabilities

/auth – Authentication

/transactions – Expense & income tracking

/summary – AI-generated financial summaries

/analytics – Spending analytics

/voice – Voice assistant endpoint

/killSwitch – Emergency controls

/safeToSpend – Budget enforcement logic

🎯 Use Cases

Personal finance management

Risk-aware spending control

AI-driven budgeting assistant

Hackathons & fintech prototypes

Internship / placement-grade full-stack project

