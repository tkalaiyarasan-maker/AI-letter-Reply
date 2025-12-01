
import React, { useState, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { GenerateIcon } from './icons/GenerateIcon';

interface OutputPanelProps {
  generatedReply: string;
  status: 'idle' | 'loading' | 'generating' | 'refining' | 'success' | 'error';
  suggestions: string;
  setSuggestions: React.Dispatch<React.SetStateAction<string>>;
  onRefine: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
  generatedReply, 
  status, 
  suggestions,
  setSuggestions,
  onRefine
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    if (copyState === 'copied') {
      const timer = setTimeout(() => setCopyState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopyState('copied');
  };

  const isLoading = status === 'loading';
  const isGenerating = status === 'generating';
  const isRefining = status === 'refining';
  
  // Show spinner only during initial connection/loading, not during streaming
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="relative w-20 h-20 mb-6">
           <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
           <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Drafting Response</h3>
        <p className="text-gray-500 mt-2 max-w-xs">Connecting to AI service...</p>
      </div>
    );
  }

  if (!generatedReply && status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Ready to Draft</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Fill in the details in the form above and click Generate. The AI will produce a formatted professional reply here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleCopy}
          disabled={isGenerating || isRefining}
          className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isGenerating || isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {copyState === 'copied' ? (
            <>
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4 mr-2 text-gray-500" />
              Copy Text
            </>
          )}
        </button>
      </div>

      <div className="flex-grow bg-white border border-gray-200 rounded-lg shadow-inner p-8 overflow-y-auto mb-6">
        <div 
            className={`prose max-w-none text-gray-900 whitespace-pre-wrap leading-relaxed ${(isGenerating || isRefining) ? 'animate-pulse-subtle' : ''}`}
            style={{ fontSize: '11pt', lineHeight: '1.5' }}
        >
          {generatedReply}
          {(isGenerating || isRefining) && (
            <span className="inline-block w-2 h-4 ml-1 align-middle bg-blue-600 animate-pulse"></span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Refine Draft
        </label>
        <div className="flex gap-3">
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            rows={2}
            disabled={isGenerating || isRefining}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 resize-none bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-50"
            placeholder="e.g. 'Make it more formal' or 'Mention the attached invoice'"
          />
          <button
            onClick={onRefine}
            disabled={isRefining || isGenerating || !suggestions.trim()}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white shadow-sm flex-shrink-0
               ${isRefining || isGenerating || !suggestions.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900'}`}
          >
            {isRefining ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <GenerateIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
