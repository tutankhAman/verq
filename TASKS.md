# TASKS.md - VerQ 5-Hour MVP

## Project: VerQ AI Mock Interview Platform
A breakdown of specific tasks for the 5-hour MVP development sprint, organized by component and priority.

---

## Hour 1: Project Setup

### Frontend Initialization
- [ ] Create new React project with Vite: `npm create vite@latest verq-client -- --template react`
- [ ] Install dependencies: `npm install axios tailwindcss postcss autoprefixer`
- [ ] Configure Tailwind CSS: `npx tailwindcss init -p`
- [ ] Set up basic folder structure (components, services)
- [ ] Create basic layout component

### Backend Initialization
- [x] Create new Express project: `mkdir verq-server && cd verq-server && npm init -y`
- [x] Install dependencies: `npm install express mongoose dotenv cors openai`
- [x] Create basic Express server setup in `server.js`
- [x] Set up environment variables in `.env` file
- [x] Create `.env.example` file with all required variables
- [ ] Configure MongoDB connection

### API Setup
- [x] Create OpenAI service configuration
- [x] Test OpenAI API connection with a simple prompt
- [x] Set up CORS for local development
- [x] Add Gemini API configuration
- [ ] Test Gemini API connection
- [ ] Implement fallback mechanism between OpenAI and Gemini

---

## Hour 2: Core Backend Development

### Models
- [ ] Create Interview model with schema:
  ```
  resumeText: String,
  jobRole: String,
  questions: Array,
  createdAt: Date
  ```

### Controllers
- [x] Create interview controller with methods:
  - `submitResume`: Store resume text and job role
  - `generateQuestions`: Generate questions with GPT-4/Gemini
  - `submitAnswer`: Store answer transcript
  - `generateFeedback`: Evaluate answer with GPT-4/Gemini

### Routes
- [x] Set up API routes:
  - `POST /api/upload-pdf` (Added PDF upload endpoint)
  - [ ] `POST /api/resume`
  - [ ] `POST /api/questions`
  - [ ] `POST /api/answers`
  - [ ] `POST /api/feedback`

### AI Integration
- [x] Create prompts for question generation
- [x] Create prompts for answer evaluation
- [x] Implement error handling for API calls
- [ ] Add Gemini-specific prompts
- [ ] Implement AI service selection logic
- [ ] Add fallback question generation

---

## Hour 3: Frontend Core Components

### Resume Input Component
- [ ] Create form with text area for resume input
- [ ] Add validation for minimum content length
- [ ] Style with Tailwind CSS

### Job Selection Component
- [ ] Create dropdown with common job roles:
  - Software Engineer
  - Data Scientist
  - Product Manager
  - UX Designer
  - Marketing Specialist
  - Sales Representative
  - Financial Analyst
- [ ] Add option for custom role input
- [ ] Style with Tailwind CSS

### Interview Session Component
- [ ] Create question display area
- [ ] Implement navigation between questions
- [ ] Add session progress indicator
- [ ] Style with Tailwind CSS

### Voice Recorder Component
- [ ] Implement Web Speech API integration
- [ ] Create start/stop recording controls
- [ ] Add real-time transcript display
- [ ] Implement error handling for browser compatibility
- [ ] Style with Tailwind CSS

---

## Hour 4: AI Integration

### API Service
- [ ] Create axios instance for API calls
- [ ] Implement functions for all endpoints:
  - `submitResume(resumeText, jobRole)`
  - `getQuestions(sessionId)`
  - `submitAnswer(questionId, answerText)`
  - `getFeedback(questionId, answerText)`

### Speech-to-Text Integration
- [ ] Configure Web Speech API with appropriate settings
- [ ] Handle browser compatibility issues
- [ ] Implement transcript cleanup and formatting

### Feedback Component
- [ ] Create feedback display layout
- [ ] Implement strengths/weaknesses sections
- [ ] Add overall evaluation score display
- [ ] Style with Tailwind CSS

### State Management
- [ ] Implement basic state management for interview flow
- [ ] Set up local storage for session persistence
- [ ] Handle error states and loading indicators

---

## Hour 5: Integration & Deployment

### Integration
- [ ] Connect all frontend components to API services
- [ ] Implement complete interview flow from resume to feedback
- [ ] Test end-to-end functionality
- [ ] Fix critical bugs

### Styling
- [ ] Apply consistent styling across all components
- [ ] Ensure mobile responsiveness
- [ ] Add minimal animations for better UX

### Deployment Preparation
- [ ] Prepare frontend for production build
- [ ] Configure backend for production
- [ ] Set up environment variables for production

### Deployment
- [ ] Deploy backend to Render:
  - Create new Render Web Service
  - Connect to GitHub repository
  - Configure environment variables
- [ ] Deploy frontend to Vercel:
  - Create new Vercel project
  - Connect to GitHub repository
  - Configure build settings
- [ ] Test deployed application

---

## Testing Checklist

### Resume Submission
- [ ] Can enter resume text
- [ ] Can select job role
- [ ] Form validation works correctly
- [ ] Submission creates new interview session

### Question Generation
- [ ] Questions are relevant to resume and job role
- [ ] Questions display properly
- [ ] Navigation between questions works

### Voice Recording
- [ ] Recording starts and stops correctly
- [ ] Transcript appears in real-time
- [ ] Transcript is saved correctly

### Feedback Generation
- [ ] Feedback is relevant to the answer
- [ ] Strengths and weaknesses are identified
- [ ] Feedback is displayed clearly

---

## Deployment URLs

- Frontend: _________________ (fill after deployment)
- Backend API: ______________ (fill after deployment)

---

## Critical Bugs/Issues Tracker

| Issue | Status | Priority | Notes |
|-------|--------|----------|-------|
|       |        |          |       |
|       |        |          |       |
|       |        |          |       |

---

## Time Tracking

| Hour | Planned Tasks | Completed Tasks | Remaining/Carried Over |
|------|---------------|----------------|------------------------|
| 1    | Project Setup |                |                        |
| 2    | Backend Dev   |                |                        |
| 3    | Frontend Dev  |                |                        |
| 4    | AI Integration|                |                        |
| 5    | Deployment    |                |                        |