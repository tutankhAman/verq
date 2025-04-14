import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const ServiceNode = ({ service, status, isActive }) => (
  <motion.div
    className={`p-4 rounded-lg border ${
      isActive
        ? 'bg-indigo-500/20 border-indigo-500/50'
        : status === 'completed'
        ? 'bg-green-500/20 border-green-500/50'
        : 'bg-gray-500/20 border-gray-500/50'
    }`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${
        isActive
          ? 'bg-indigo-500 animate-pulse'
          : status === 'completed'
          ? 'bg-green-500'
          : 'bg-gray-500'
      }`} />
      <div>
        <h3 className="font-semibold text-white">{service}</h3>
        <p className="text-sm text-gray-400">
          {isActive ? 'Processing...' : status === 'completed' ? 'Completed' : 'Pending'}
        </p>
      </div>
    </div>
  </motion.div>
);

function InterviewSession() {
  const { interviewId: paramsInterviewId } = useParams();
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [serviceStatus, setServiceStatus] = useState({
    pdfExtraction: 'pending',
    geminiQuestion: 'pending',
    textToSpeech: 'pending',
    speechToText: 'pending',
    geminiEvaluation: 'pending'
  });
  const [activeService, setActiveService] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [overallEvaluation, setOverallEvaluation] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // Get the actual interviewId from either params or localStorage
  const interviewId = paramsInterviewId || (() => {
    const savedInterview = localStorage.getItem('currentInterview');
    if (savedInterview) {
      try {
        const { id } = JSON.parse(savedInterview);
        return id;
      } catch (err) {
        console.error('Error parsing saved interview:', err);
        return null;
      }
    }
    return null;
  })();

  // Fetch interview data and set initial question
  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) {
        setError('No interview ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setActiveService('pdfExtraction');
        setServiceStatus(prev => ({ ...prev, pdfExtraction: 'in_progress' }));

        const { data } = await api.getInterviewById(interviewId);
        setInterview(data);
        
        // Set current question only if it's not already set
        if (!currentQuestion) {
          // First try to get the last question from the questions array
          const lastQuestion = data.questions?.[data.questions.length - 1]?.question;
          if (lastQuestion) {
            setCurrentQuestion(lastQuestion);
          } else {
            // If no questions in the array, try to get the current question from the interview data
            if (data.currentQuestion) {
              setCurrentQuestion(data.currentQuestion);
            } else {
              // If still no question, try to get it from localStorage
              const savedInterview = localStorage.getItem('currentInterview');
              if (savedInterview) {
                try {
                  const { question } = JSON.parse(savedInterview);
                  if (question) {
                    setCurrentQuestion(question);
                  } else {
                    setError('No questions available for this interview');
                  }
                } catch (err) {
                  console.error('Error parsing saved interview:', err);
                  setError('No questions available for this interview');
                }
              } else {
                setError('No questions available for this interview');
              }
            }
          }
        }
        
        setServiceStatus(prev => ({ ...prev, pdfExtraction: 'completed' }));
        setActiveService(null);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]); // Only depend on interviewId

  const startRecording = async () => {
    try {
      // Reset states
      setAudioURL(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus'
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        await submitAnswer(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the media recorder
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const submitAnswer = async (audioBlob) => {
    try {
      if (!interviewId) {
        throw new Error('Interview ID is missing');
      }

      setActiveService('speechToText');
      setServiceStatus(prev => ({ ...prev, speechToText: 'in_progress' }));

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('currentQuestion', currentQuestion);

      setActiveService('geminiEvaluation');
      setServiceStatus(prev => ({ 
        ...prev, 
        speechToText: 'completed',
        geminiEvaluation: 'in_progress' 
      }));

      const { data } = await api.submitAnswer(interviewId, formData);

      // Store the evaluation and show it
      setCurrentEvaluation(data.evaluation);
      setShowEvaluation(true);

      if (data.isComplete) {
        setIsComplete(true);
        setOverallEvaluation(data.overallEvaluation);
        setServiceStatus(prev => ({ 
          ...prev, 
          geminiEvaluation: 'completed'
        }));
      } else {
        setServiceStatus(prev => ({ 
          ...prev, 
          geminiEvaluation: 'completed',
          geminiQuestion: 'in_progress' 
        }));
        setActiveService('geminiQuestion');

        // Update current question with the next one
        if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
        }
      }
      
      // Refresh interview data to show updated questions
      const { data: updatedInterview } = await api.getInterviewById(interviewId);
      setInterview(updatedInterview);

      if (!data.isComplete) {
        setServiceStatus(prev => ({ ...prev, geminiQuestion: 'completed' }));
      }
      setActiveService(null);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.message || 'Failed to submit answer');
      setServiceStatus(prev => ({
        ...prev,
        speechToText: 'pending',
        geminiEvaluation: 'pending',
        geminiQuestion: 'pending'
      }));
      setActiveService(null);
    }
  };

  const handleGenerateFollowUp = async () => {
    try {
      setIsGeneratingQuestion(true);
      setActiveService('geminiQuestion');
      setServiceStatus(prev => ({ ...prev, geminiQuestion: 'in_progress' }));

      const { data } = await api.generateFollowUpQuestion(interviewId);
      
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setShowEvaluation(false);
        setCurrentEvaluation(null);
      }

      setServiceStatus(prev => ({ ...prev, geminiQuestion: 'completed' }));
      setActiveService(null);
    } catch (err) {
      console.error('Error generating follow-up question:', err);
      setError(err.message || 'Failed to generate follow-up question');
      setServiceStatus(prev => ({ ...prev, geminiQuestion: 'pending' }));
      setActiveService(null);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 sm:pt-32 px-4 sm:px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 sm:pt-32 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-center text-sm sm:text-base">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-32 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Section - Interview Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                Interview for {interview?.jobRole}
              </h2>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Status: {interview?.status}
              </div>
            </div>

            {currentQuestion && (
              <motion.div 
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                  Current Question
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
                  {currentQuestion}
                </p>

                <div className="flex flex-col items-center gap-4">
                  {!isRecording ? (
                    <motion.button
                      onClick={startRecording}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-500 text-white rounded-full
                        hover:bg-indigo-600 transition-colors duration-200
                        flex items-center gap-2 text-sm sm:text-base"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Start Recording
                    </motion.button>
                  ) : (
                    <>
                      <div className="text-center mb-2">
                        <span className="text-sm text-gray-400">
                          Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <motion.button
                        onClick={stopRecording}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-full
                          hover:bg-red-600 transition-colors duration-200
                          flex items-center gap-2 text-sm sm:text-base animate-pulse"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop Recording
                      </motion.button>
                    </>
                  )}
                  
                  {audioURL && (
                    <div className="mt-4 w-full max-w-md">
                      <audio src={audioURL} controls className="w-full" />
                      <p className="text-sm text-gray-400 text-center mt-2">
                        Preview your recording before it's processed
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Evaluation Results */}
            {showEvaluation && currentEvaluation && (
              <motion.div
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                  Evaluation Results
                </h3>
                
                {/* Overall Score */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Overall Score:</span>
                    <div className="flex items-center">
                      {[...Array(10)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(currentEvaluation?.overallScore || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {(currentEvaluation?.overallScore || 0).toFixed(1)}/10.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="space-y-4 mb-6">
                  {/* Clarity Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clarity</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {currentEvaluation?.clarity?.score || 0}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentEvaluation?.clarity?.explanation || 'No clarity feedback available'}
                    </p>
                  </div>

                  {/* Technical Accuracy Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Technical Accuracy</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {currentEvaluation?.technicalAccuracy?.score || 0}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentEvaluation?.technicalAccuracy?.explanation || 'No technical accuracy feedback available'}
                    </p>
                  </div>

                  {/* Language & Communication Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language & Communication</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {currentEvaluation?.language?.score || 0}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentEvaluation?.language?.explanation || 'No language feedback available'}
                    </p>
                  </div>
                </div>

                {/* Strengths and Areas for Improvement */}
                <div className="space-y-4">
                  {/* Strengths */}
                  {currentEvaluation?.strengths?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Key Strengths
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {currentEvaluation.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {currentEvaluation?.areasForImprovement?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Areas for Improvement
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {currentEvaluation.areasForImprovement.map((area, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {currentEvaluation?.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Recommendations
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {currentEvaluation.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Next Button - Only show if interview is not complete */}
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => setShowEvaluation(false)}
                    className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    Close Evaluation
                  </button>
                  {!isComplete && (
                    <motion.button
                      onClick={handleGenerateFollowUp}
                      className="px-6 py-2 bg-indigo-500 text-white rounded-full
                        hover:bg-indigo-600 transition-colors duration-200
                        flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isGeneratingQuestion}
                    >
                      {isGeneratingQuestion ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          Next Question
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Overall Evaluation */}
            {isComplete && overallEvaluation && (
              <motion.div
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-8 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  Final Interview Evaluation
                </h2>

                {/* Scores Section */}
                <div className="space-y-6 mb-8">
                  {/* Technical Proficiency */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Technical Proficiency
                      </span>
                      <span className="text-2xl font-bold text-indigo-500">
                        {overallEvaluation.technicalProficiency.score}/10
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {overallEvaluation.technicalProficiency.explanation}
                    </p>
                  </div>

                  {/* Communication Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Communication Skills
                      </span>
                      <span className="text-2xl font-bold text-indigo-500">
                        {overallEvaluation.communicationSkills.score}/10
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {overallEvaluation.communicationSkills.explanation}
                    </p>
                  </div>

                  {/* Problem Solving */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Problem-Solving Ability
                      </span>
                      <span className="text-2xl font-bold text-indigo-500">
                        {overallEvaluation.problemSolvingAbility.score}/10
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {overallEvaluation.problemSolvingAbility.explanation}
                    </p>
                  </div>
                </div>

                {/* Hiring Recommendation */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Hiring Recommendation:
                    </h3>
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                      overallEvaluation.hiringRecommendation.decision === 'STRONG HIRE'
                        ? 'bg-green-500/20 text-green-500'
                        : overallEvaluation.hiringRecommendation.decision === 'HIRE'
                        ? 'bg-blue-500/20 text-blue-500'
                        : overallEvaluation.hiringRecommendation.decision === 'CONSIDER'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {overallEvaluation.hiringRecommendation.decision}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {overallEvaluation.hiringRecommendation.justification}
                  </p>
                </div>

                {/* Feedback Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Key Strengths */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Key Strengths
                    </h4>
                    <ul className="list-disc list-inside space-y-2">
                      {overallEvaluation.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Growth */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Areas for Growth
                    </h4>
                    <ul className="list-disc list-inside space-y-2">
                      {overallEvaluation.areasForGrowth.map((area, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400">
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Final Recommendations
                    </h4>
                    <ul className="list-disc list-inside space-y-2">
                      {overallEvaluation.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="mt-8 text-center">
                  <div className="inline-block">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Overall Interview Score
                    </h3>
                    <div className="text-4xl font-bold text-indigo-500">
                      {overallEvaluation.overallScore}/10
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {interview?.questions?.map((qa, index) => (
              <motion.div
                key={index}
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Question {index + 1}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {qa.question}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Your Answer:
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {qa.answer}
                </p>
                {qa.evaluation && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Evaluation
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {qa.evaluation.feedback}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Right Section - Service Status */}
          <div className="space-y-4 sm:space-y-8">
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Service Status
              </h3>
              <div className="space-y-3">
                <ServiceNode 
                  service="PDF Extraction" 
                  status={serviceStatus.pdfExtraction} 
                  isActive={activeService === 'pdfExtraction'} 
                />
                <ServiceNode 
                  service="Question Generation" 
                  status={serviceStatus.geminiQuestion} 
                  isActive={activeService === 'geminiQuestion'} 
                />
                <ServiceNode 
                  service="Speech to Text" 
                  status={serviceStatus.speechToText} 
                  isActive={activeService === 'speechToText'} 
                />
                <ServiceNode 
                  service="Evaluation" 
                  status={serviceStatus.geminiEvaluation} 
                  isActive={activeService === 'geminiEvaluation'} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewSession; 