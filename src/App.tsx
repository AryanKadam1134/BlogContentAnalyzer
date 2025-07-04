import { useState, useEffect } from 'react';
import { FileText, Link, Brain, Volume2, Play, Pause, Square, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchContentFromUrl } from './services/contentService';
import { generateInsights } from './services/geminiService';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking, isSpeaking, isSpeechPaused } from './services/speechService';

interface AnalysisState {
  content: string;
  url: string;
  insights: string;
  isLoading: boolean;
  isFetching: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  error: string;
}

function App() {
  const [state, setState] = useState<AnalysisState>({
    content: '',
    url: '',
    insights: '',
    isLoading: false,
    isFetching: false,
    isSpeaking: false,
    isPaused: false,
    error: ''
  });

  // Update speech status periodically with more frequent checks
  useEffect(() => {
    const interval = setInterval(() => {
      const speaking = isSpeaking();
      const paused = isSpeechPaused();
      
      // Debug logging
      console.log('Speech status check:', {
        uiSpeaking: state.isSpeaking,
        uiPaused: state.isPaused,
        actualSpeaking: speaking,
        actualPaused: paused,
        speechSynthesisSpeaking: window.speechSynthesis?.speaking,
        speechSynthesisPaused: window.speechSynthesis?.paused
      });
      
      // Update state if there's a change
      if (state.isSpeaking !== speaking || state.isPaused !== paused) {
        console.log('Updating speech state:', { speaking, paused });
        setState(prev => ({
          ...prev,
          isSpeaking: speaking,
          isPaused: paused
        }));
      }
      
      // Reset state if speech has ended and we're not tracking it correctly
      if (!speaking && !paused && (state.isSpeaking || state.isPaused)) {
        console.log('Resetting speech state - speech ended');
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          isPaused: false
        }));
      }
    }, 200); // Check every 200ms for better responsiveness

    return () => clearInterval(interval);
  }, [state.isSpeaking, state.isPaused]);

  // Cleanup speech on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const clearError = () => setState(prev => ({ ...prev, error: '' }));

  const handleFetchContent = async () => {
    if (!state.url.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a valid URL' }));
      return;
    }

    setState(prev => ({ ...prev, isFetching: true, error: '' }));
    
    try {
      const fetchedContent = await fetchContentFromUrl(state.url);
      setState(prev => ({ 
        ...prev, 
        content: fetchedContent, 
        isFetching: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch content',
        isFetching: false 
      }));
    }
  };

  const handleGenerateInsights = async () => {
    const contentToAnalyze = state.content.trim();
    
    if (!contentToAnalyze) {
      setState(prev => ({ ...prev, error: 'Please provide content to analyze' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));
    
    try {
      const insights = await generateInsights(contentToAnalyze);
      setState(prev => ({ 
        ...prev, 
        insights, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate insights',
        isLoading: false 
      }));
    }
  };

  const handleReadAloud = async () => {
    if (!state.insights.trim()) {
      setState(prev => ({ ...prev, error: 'No insights available to read' }));
      return;
    }

    // Clear any previous errors and set initial state
    setState(prev => ({ ...prev, isSpeaking: true, isPaused: false, error: '' }));
    
    try {
      await speakText(state.insights);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to read text aloud',
        isSpeaking: false,
        isPaused: false
      }));
    }
    // Note: The finally block is removed because the speech end event will handle state cleanup
  };

  const handlePauseSpeech = () => {
    console.log('User clicked pause button');
    try {
      pauseSpeaking();
      // Immediately update the UI state to show pause button is clicked
      setState(prev => ({ ...prev, isPaused: true, isSpeaking: false }));
    } catch (error) {
      console.error('Failed to pause speech:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to pause speech'
      }));
    }
  };

  const handleResumeSpeech = () => {
    console.log('User clicked resume button');
    try {
      resumeSpeaking();
      // Immediately update the UI state to show resume button is clicked
      setState(prev => ({ ...prev, isPaused: false, isSpeaking: true }));
    } catch (error) {
      console.error('Failed to resume speech:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to resume speech'
      }));
    }
  };

  const handleStopSpeech = () => {
    try {
      stopSpeaking();
      setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
    } catch (error) {
      console.error('Failed to stop speech:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to stop speech',
        isSpeaking: false,
        isPaused: false
      }));
    }
  };

  const renderSpeechControls = () => {
    if (!state.insights) return null;

    if (state.isSpeaking && !state.isPaused) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePauseSpeech}
            className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm border-2 border-orange-300"
          >
            <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>
          <button
            onClick={handleStopSpeech}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Square className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        </div>
      );
    }

    if (state.isPaused) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleResumeSpeech}
            className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm border-2 border-green-300"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Resume</span>
          </button>
          <button
            onClick={handleStopSpeech}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Square className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleReadAloud}
        className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg transition duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Read Aloud</span>
        <span className="sm:hidden">Read</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-700 to-green-700 rounded-2xl mb-4 sm:mb-6">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 px-4">
            Content Analyzer
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Extract insights from any blog or article using Google Gemini AI
          </p>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 sm:mb-8 mx-4 sm:mx-0 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base text-red-800 break-words">{state.error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Input Section */}
          <div className="space-y-4 lg:space-y-6">
            {/* URL Input */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <Link className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Fetch from URL
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <input
                  type="url"
                  placeholder="https://example.com/blog-post"
                  value={state.url}
                  onChange={(e) => setState(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
                <button
                  onClick={handleFetchContent}
                  disabled={state.isFetching}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 sm:py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {state.isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching Content...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Fetch Content
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Input */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Paste Content
                </h2>
              </div>
              <textarea
                placeholder="Paste your blog content here..."
                value={state.content}
                onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 resize-none responsive-textarea"
              />
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm text-gray-500">
                <span>{state.content.length} characters</span>
                {state.content.length > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Content ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateInsights}
              disabled={state.isLoading || !state.content.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="text-sm sm:text-base">Analyzing Content...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Generate Insights</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-4 lg:space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Gemini AI Insights
                </h2>
                <div className="flex-shrink-0">
                  {renderSpeechControls()}
                </div>
              </div>
              
              <div className="min-h-[300px] sm:min-h-[400px] max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                {state.insights ? (
                  <div className="prose prose-gray max-w-none prose-sm sm:prose-base">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm sm:text-base">
                      {state.insights}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg mb-1 sm:mb-2">No insights generated yet</p>
                    <p className="text-gray-400 text-xs sm:text-sm px-4">
                      Add content and click "Generate Insights" to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 text-center mx-4 sm:mx-0">
          <p className="text-gray-500 text-xs sm:text-sm px-4">
            Powered by Google Gemini AI • Built with React & Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;