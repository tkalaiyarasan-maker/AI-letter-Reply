import React, { useState, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { GenerateIcon } from './icons/GenerateIcon';

interface OutputPanelProps {
  generatedReply: string;
  isLoading: boolean;
  error: string | null;
  suggestions: string;
  setSuggestions: React.Dispatch<React.SetStateAction<string>>;
  onRefine: () => void;
  isRefining: boolean;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
  generatedReply, 
  isLoading, 
  error,
  suggestions,
  setSuggestions,
  onRefine,
  isRefining
}) => {
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReply).then(() => {
      setCopySuccess('Copied!');
    }, () => {
      setCopySuccess('Failed to copy.');
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <SpinnerIcon className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p className="text-lg font-medium">Drafting your reply...</p>
          <p className="text-sm">Please wait a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-600 bg-red-50 p-4 rounded-md">
          <p className="text-center">{error}</p>
        </div>
      );
    }

    if (generatedReply) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Generated Reply</h2>
              <button
                onClick={handleCopy}
                className="flex items-center px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition duration-150"
              >
                <CopyIcon className="w-4 h-4 mr-2" />
                {copySuccess || 'Copy'}
              </button>
          </div>
          <div className="flex-grow overflow-y-auto border rounded-md p-4 bg-gray-50">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {generatedReply}
            </pre>
          </div>
          <div className="flex-shrink-0 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Suggestions for Draft</h3>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              rows={4}
              className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 'Make the tone more assertive in the second paragraph.' or 'Add a sentence about the upcoming project deadline.'"
            />
            <button
              onClick={onRefine}
              disabled={isRefining || !suggestions.trim()}
              className="mt-3 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {isRefining ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-2 -ml-1 animate-spin"/>
                  Refining...
                </>
              ) : (
                <>
                  <GenerateIcon className="w-5 h-5 mr-2 -ml-1" />
                  Refine Draft
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">Your generated reply will appear here.</p>
        <p className="text-sm">Fill in the details on the left and click "Generate Reply".</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg relative min-h-[600px] lg:min-h-full">
      <div className="p-6 h-full">
        {renderContent()}
      </div>
    </div>
  );
};
