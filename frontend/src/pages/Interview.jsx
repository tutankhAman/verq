import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function Interview() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load resume from localStorage on component mount
  useEffect(() => {
    const savedResume = localStorage.getItem('interviewResume');
    if (savedResume) {
      try {
        const resumeData = JSON.parse(savedResume);
        setResume(new File([resumeData.content], resumeData.name, { type: 'application/pdf' }));
      } catch (err) {
        console.error('Error loading resume from localStorage:', err);
        localStorage.removeItem('interviewResume');
      }
    }
  }, []);

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        // Read the file content
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          // Save to localStorage
          localStorage.setItem('interviewResume', JSON.stringify({
            name: file.name,
            content: content,
            type: file.type,
            lastModified: file.lastModified
          }));
          setResume(file);
          setError('');
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError('Failed to process resume. Please try again.');
        console.error('Error processing resume:', err);
      }
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleStartInterview = async () => {
    if (!resume) {
      setError('Please upload a resume first');
      return;
    }

    if (!jobRole) {
      setError('Please enter a job role');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('jobRole', jobRole);

      const response = await api.createInterview(formData);
      console.log('Interview creation response:', response);
      
      if (response.status === 'success' && response.data && response.data.interviewId) {
        // Store the interview data in localStorage before navigating
        localStorage.setItem('currentInterview', JSON.stringify({
          id: response.data.interviewId,
          question: response.data.question
        }));
        
        // Navigate to the interview session
        navigate(`/interview/session/${response.data.interviewId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err.message || 'Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResume = () => {
    localStorage.removeItem('interviewResume');
    setResume(null);
  };

  return (
    <div className="min-h-screen pt-32 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Your perfect interview starts here
        </h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Resume Upload Card */}
          <motion.div 
            className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-8 relative overflow-hidden"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-3xl"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-chakra font-semibold text-heading mb-2">Upload Resume</h3>
              <p className="text-sm text-paragraph mb-6">Upload your resume to get personalized interview preparation</p>
              
              <div className="w-full">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-white/10 file:text-white
                    hover:file:bg-white/15
                    dark:file:bg-white/10 dark:file:text-white"
                />
                {resume && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-paragraph">
                      {resume.name}
                    </span>
                    <button
                      onClick={handleClearResume}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Job Role Card */}
          <motion.div 
            className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-8 relative overflow-hidden"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-3xl"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-chakra font-semibold text-heading mb-2">Job Role</h3>
              <p className="text-sm text-paragraph mb-6">Specify your target job role for customized interview questions</p>
              
              <input
                type="text"
                value={jobRole}
                onChange={(e) => {
                  setJobRole(e.target.value);
                  setError('');
                }}
                placeholder="Enter the job role (e.g., Software Engineer, Data Scientist)"
                className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-full
                  focus:outline-none focus:ring-2 focus:ring-white/20
                  text-white placeholder-white/50"
              />
            </div>
          </motion.div>
        </div>

        {/* Start Interview Button */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={handleStartInterview}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full
              text-white font-semibold text-lg shadow-lg
              hover:from-indigo-600 hover:to-purple-700
              transform hover:scale-105 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!resume || !jobRole || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Interview...
              </div>
            ) : (
              'Start Interview'
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default Interview; 