# 🧠 AI Sales Chatbot

A simple AI-powered chatbot that answers **sales-related questions** using **natural language**. It connects to a **Supabase PostgreSQL** database and uses the **Google Gemini API** to intelligently parse queries and provide insights in real time.

---

## ✨ Features

- 🔍 Natural language sales queries
- 🗓️ Fuzzy time filters like "this month", "last week"
- 📊 Real-time sales data analysis via Supabase
- 💬 Conversational responses using Gemini AI
- 🖥️ Clean React-based chat UI with Tailwind CSS

---

## 🧰 Tech Stack

| Layer      | Technology               |
|------------|---------------------------|
| Frontend   | React.js + Tailwind CSS   |
| Backend    | Node.js + Express.js      |
| Database   | Supabase (PostgreSQL)     |
| AI / NLP   | Google Gemini API (v2.0)  |

---

## ⚙️ Full Setup Guide

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) (LTS version)
- A [Supabase](https://supabase.com/) account
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## 1️⃣ Supabase Setup

### Step 1: Create Supabase Project
- Go to [https://supabase.com](https://supabase.com) and create a new project.
- Copy your:
  - **Project URL**
  - **Anon/public API Key**  
  *(Found under Project Settings → API)*

### Step 2: Enable UUID Extension
- Navigate to: `Database > Extensions`
- Enable `uuid-ossp`

### Step 3: Create Sales Table

Go to the **SQL Editor** and run:

```sql
CREATE TABLE sale_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store TEXT NOT NULL,
  date DATE NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  revenue FLOAT NOT NULL
);

---


The sample data is added in the sampledata file.


 2️⃣ Backend Setup (backend/)

 Step 1: Navigate to backend folder

- cd backend

 Step 2: Install dependencies

- npm install

 Step 3: Create .env file

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
PORT=3001

⚠️ Replace placeholders with your actual Supabase and Gemini credentials.

 Step 4: Start backend server

- node server.js

 3️⃣ Frontend Setup (frontend/)

 Step 1: Navigate to frontend

- cd frontend

 Step 2: Install dependencies

- npm install

 Step 3: Start frontend

- npm run dev


🧪 Usage
Ask:
"What was the total sales yesterday?"
"Which store had the highest revenue this week?"
"How many items were sold in July?"

The bot will generate an SQL query, fetch data from Supabase, and respond.



✨ Thank You!
Built with ❤️ using React, Supabase, and Gemini.

