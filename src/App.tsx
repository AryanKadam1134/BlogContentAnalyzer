import React, { useState, useEffect } from 'react';
import { FileText, Link, Brain, Volume2, VolumeX, Play, Pause, Square, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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

  // Update speech status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const speaking = isSpeaking();
      const paused = isSpeechPaused();
      
      if (state.isSpeaking !== speaking || state.isPaused !== paused) {
        setState(prev => ({
          ...prev,
          isSpeaking: speaking,
          isPaused: paused
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state.isSpeaking, state.isPaused]);

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

    setState(prev => ({ ...prev, isSpeaking: true, isPaused: false, error: '' }));
    
    try {
      await speakText(state.insights);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to read text aloud'
      }));
    } finally {
      setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
    }
  };

  const handlePauseSpeech = () => {
    pauseSpeaking();
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const handleResumeSpeech = () => {
    resumeSpeaking();
    setState(prev => ({ ...prev, isPaused: false }));
  };

  const handleStopSpeech = () => {
    stopSpeaking();
    setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
  };

  const renderSpeechControls = () => {
    if (!state.insights) return null;

    if (state.isSpeaking && !state.isPaused) {
      return (
        <div className="flex gap-2">
          <button
            onClick={handlePauseSpeech}
            className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
          <button
            onClick={handleStopSpeech}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>
      );
    }

    if (state.isPaused) {
      return (
        <div className="flex gap-2">
          <button
            onClick={handleResumeSpeech}
            className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
          <button
            onClick={handleStopSpeech}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleReadAloud}
        className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center gap-2"
      >
        <Volume2 className="w-4 h-4" />
        Read Aloud
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blog Content Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Extract insights from any blog or article using Google Gemini AI
          </p>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800">{state.error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* URL Input */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <Link className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Fetch from URL
                </h2>
              </div>
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="https://example.com/blog-post"
                  value={state.url}
                  onChange={(e) => setState(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
                <button
                  onClick={handleFetchContent}
                  disabled={state.isFetching}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Paste Content
                </h2>
              </div>
              <textarea
                placeholder="Paste your blog content here..."
                value={state.content}
                onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 resize-none"
              />
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>{state.content.length} characters</span>
                {state.content.length > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Content ready
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateInsights}
              disabled={state.isLoading || !state.content.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-lg"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Content...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Generate Insights
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gemini AI Insights
                </h2>
                {renderSpeechControls()}
              </div>
              
              <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
                {state.insights ? (
                  <div className="prose prose-gray max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {state.insights}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Brain className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">No insights generated yet</p>
                    <p className="text-gray-400 text-sm">
                      Add content and click "Generate Insights" to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500">
            Powered by Google Gemini AI • Built with React & Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;