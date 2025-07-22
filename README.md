AI Sales Chatbot
This project is a simple AI chatbot designed to answer sales-related questions using natural language. It connects to a Supabase PostgreSQL database for data and leverages the Google Gemini API for natural language understanding and query parsing.

Features
Natural Language Queries: Ask questions like "What was the total sales yesterday?", "Which store made the most profit?", or "How many items were sold today?".

Time Filters: Supports fuzzy time filters (e.g., "last week", "this month", "July").

Sales Data Analysis: Retrieves and processes sales data from Supabase.

User-Friendly Responses: Provides clear, concise answers.

Minimal UI: A straightforward React-based chat interface.

Tech Stack
Frontend: React.js (with Tailwind CSS)

Backend: Node.js (Express.js)

Database: Supabase (PostgreSQL)

AI/NLP: Google Gemini API (gemini-2.0-flash)

Setup Instructions
To run this project locally, follow these steps:

Prerequisites
Node.js (LTS version) and npm

A Supabase project with a sale_records table (see detailed instructions below).

A Google Gemini API key.

1. Supabase Database Setup
Create Project: Go to Supabase, create a new project. Get your Project URL and anon (public) key from "Project Settings" > "API".

Enable uuid-ossp: In "Database" > "Extensions", enable uuid-ossp.

Create Table: In "SQL Editor", run this SQL:

CREATE TABLE sale_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store TEXT NOT NULL,
  date DATE NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  revenue FLOAT NOT NULL
);

Populate Data: In "SQL Editor", insert sample data (provided in the full README/conversation history).

2. Backend Setup (chatbot-backend directory)
Navigate: cd chatbot-backend

Install: npm install

Create .env: In chatbot-backend, create .env file with:

SUPABASE_URL="https://YOUR_SUPABASE_PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3001

(Replace placeholders with your actual keys. Ensure SUPABASE_URL does NOT contain credentials.)

Start Server: node server.js (Keep terminal open)

3. Frontend Setup (chatbot-frontend directory)
Navigate: cd chatbot-frontend

Install: npm install

Tailwind CSS: Ensure tailwind.config.js and src/index.css (or App.css) are configured for Tailwind and Inter font (refer to full README/conversation history for exact content).

Start Server: npm run dev (Keep terminal open)

Usage
Ensure both backend and frontend servers are running.

Open your browser to http://localhost:5173.

Type your sales questions in the chat interface.