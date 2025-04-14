# PLANNING.md - VerQ 5-Hour MVP

## Project Overview
VerQ is an AI-powered mock interview platform that generates personalized interview questions based on a user's resume and target role, captures voice responses, and provides AI feedback.

## 5-Hour MVP Goals
- Create a minimal functional version demonstrating core value proposition
- Focus on essential features only
- Skip complex infrastructure and advanced features

## Hour-by-Hour Roadmap

### Hour 1: Project Setup (60 mins)
- ✅ Initialize React + Vite frontend with Tailwind CSS
- ✅ Set up basic Express.js backend
- ✅ Create minimal MongoDB schema
- ✅ Configure OpenAI API integration
- ✅ Set up project repository

### Hour 2: Core Backend Development (60 mins)
- ✅ Implement basic API endpoints:
  - Resume text input endpoint (skip file upload parsing)
  - Job role selection endpoint
  - Question generation with GPT-4
  - Simple interview session management
- ✅ Connect to MongoDB
- ✅ Test API endpoints with Postman/Thunder Client

### Hour 3: Frontend Core Components (60 mins)
- ✅ Build minimal UI components:
  - Resume input form (text area instead of file upload)
  - Job role dropdown (pre-defined list)
  - Interview session page
  - Voice recording component using Web Speech API
  - Basic navigation

### Hour 4: AI Integration (60 mins)
- ✅ Implement browser-based speech-to-text (Web Speech API)
- ✅ Configure GPT-4 prompt for question generation
- ✅ Set up basic answer evaluation with GPT-4
- ✅ Create simple feedback display component
- ✅ Connect frontend components to API services

### Hour 5: Integration & Deployment (60 mins)
- ✅ Integrate all components end-to-end
- ✅ Add minimal styling with Tailwind
- ✅ Fix critical bugs
- ✅ Deploy frontend to Vercel
- ✅ Deploy backend to Render
- ✅ Test full user flow

## MVP Feature Set

### Must-Have Features
1. **Text-based Resume Input**: Simple form for pasting resume text
2. **Basic Job Role Selection**: Dropdown with 5-7 common roles
3. **Question Generation**: Generate 3 relevant questions using GPT-4
4. **Voice Response**: Record answers using browser's Web Speech API
5. **Basic Evaluation**: Process transcript with GPT-4 for simple feedback
6. **Minimal Feedback Display**: Show strengths and improvement areas

### Technical Shortcuts
1. **Skip Authentication**: Use browser storage for session management
2. **Use Browser APIs**: Web Speech API instead of dedicated APIs
3. **Simplified Storage**: Basic MongoDB schema with minimal fields
4. **Minimal UI**: Focus on functionality over design
5. **Manual Deployment**: Direct deployment without CI/CD

## Project Structure

### Frontend Structure
```
verq-client/
├── public/
├── src/
│   ├── components/
│   │   ├── ResumeInput.jsx          # Resume text input form
│   │   ├── JobSelection.jsx         # Job role dropdown
│   │   ├── InterviewSession.jsx     # Interview Q&A interface
│   │   ├── VoiceRecorder.jsx        # Speech recording component
│   │   └── FeedbackDisplay.jsx      # Displays AI evaluation
│   ├── services/
│   │   └── api.js                   # API client for backend
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # Application entry point
│   └── index.css                    # Global styles and Tailwind
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### Backend Structure
```
verq-server/
├── controllers/
│   └── interviewController.js       # Handles interview logic
├── models/
│   ├── Interview.js                 # Interview session model
│   └── Question.js                  # Question model
├── routes/
│   └── api.js                       # API route definitions
├── services/
│   └── openaiService.js             # OpenAI integration
├── app.js                           # Express application setup
├── server.js                        # Server entry point
├── .env                             # Environment variables
└── package.json
```

## API Endpoints

### MVP API Routes
- `POST /api/resume` - Submit resume text and job role
- `POST /api/questions` - Generate interview questions
- `POST /api/answers` - Submit voice answer transcript
- `POST /api/feedback` - Get AI evaluation of answer

## Database Schema (Simplified)

### Interview Session
```javascript
{
  _id: ObjectId,
  resumeText: String,
  jobRole: String,
  questions: [
    {
      text: String,
      answer: String,
      feedback: String
    }
  ],
  createdAt: Date
}
```

## Post-MVP Roadmap

After completing the 5-hour MVP, prioritize these enhancements:

### Next Steps (1-2 days)
1. Add proper file-based resume upload and parsing
2. Improve question generation quality with better prompts
3. Enhance feedback detail and specificity
4. Add user authentication
5. Implement proper error handling

### Medium-term Improvements (1 week)
1. Replace Web Speech API with Whisper for better transcription
2. Add professional TTS for question reading
3. Implement mock interview mode with timing
4. Create progress tracking dashboard
5. Add resource recommendations based on weaknesses

### Long-term Features (1 month+)
1. Implement voice confidence analysis
2. Create industry-specific question banks
3. Add video recording option
4. Develop social features (peer feedback)
5. Build mobile companion app