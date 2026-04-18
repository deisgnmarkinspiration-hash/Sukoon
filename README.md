# Sukoon - Mental Clarity & Emotional Peace

Sukoon is a production-grade mental health support application built with React, TypeScript, and Firebase. It features a calming "Sanctuary" (Calm tab), periodic "Future Me" messages, and an AI-powered conversational partner to help you navigate life's heavy moments.

## ✨ Features

- **Guided Mood Flow**: A step-by-step experience to help you ground yourself when feeling overwhelmed.
- **Calm Sanctuary**: A dedicated space with thematic background ambience, curated soundscapes, and low-stimulation micro-tasks.
- **Wall of Hope**: A collaborative public wall where users can share anonymous words of encouragement.
- **AI Reassurance**: Production-grade integration with Google Gemini AI for empathetic feedback and actionable mental health tips.
- **Future Me**: Messages sent to your future self as a "lifeline" to remind you of your strength.
- **Journaling**: A private record of your emotional journey over time.
- **Sukoon Mode**: A toggleable low-stimulation interface designed specifically for moments of sensory overload.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **State Management**: Zustand (Global state, auth, real-time data)
- **Styling**: Tailwind CSS (Utility-first, responsive, custom themes)
- **Animations**: Framer Motion (Fluid transitions, background dynamics)
- **Backend/DB**: Firebase (Firestore for real-time data, Auth for secure login)
- **AI**: Google Gemini AI (via @google/genai SDK)

## 📁 Project Structure

```bash
src/
├── components/          # Reusable UI components (Button, Card, Input)
├── features/            # Feature-based logic and views
│   ├── chat/            # Gemini AI Chat integration
│   ├── calm/            # Sanctuary, Soundscapes, Wall of Hope
│   └── home/            # Timeline and Guided Home Flow
├── hooks/               # Custom hooks (initialization, data fetching)
├── lib/                 # Utilities and helpers (class merging, sanitization)
├── services/            # Service layer abstractions (Firebase, Gemini)
├── store/               # Zustand store for global application state
├── types/               # Centralized TypeScript definitions
└── translations.ts      # Multi-language support (EN, HI, UR)
```

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- Firebase project set up

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🛡 Security

- **Strict Path Authorization**: Firestore rules ensure users can only access their own private data.
- **Input Sanitization**: All user input is sanitized before processing.
- **Service Layer Abstraction**: UI components never interact with external APIs directly, ensuring a clean and secure separation of concerns.

## 📄 License

This project is specialized for private wellness and development.
