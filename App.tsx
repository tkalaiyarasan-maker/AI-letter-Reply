import React, { useState, useCallback, useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { generateReply, refineReply } from './services/geminiService';
import type { FormState } from './types';

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    incomingLetter: '',
    pointsToConsider: '',
    contractClauses: '',
  });
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio) {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          // Fallback for environments without window.aistudio
          setHasApiKey(!!process.env.API_KEY);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(`An error occurred: ${err.message}`);
      if (err.message.includes('API Configuration Error')) {
        setHasApiKey(false);
      }
    } else {
      setError('An unknown error occurred.');
    }
  };

  const MAX_LETTER_LENGTH = 3000000;

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedReply('');
    setSuggestions('');

    try {
      const reply = await generateReply(formState);
      setGeneratedReply(reply);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [formState]);

  const handleRefine = useCallback(async () => {
    if (!suggestions.trim() || !generatedReply) return;
    setIsRefining(true);
    setError(null);

    try {
      const refined = await refineReply(generatedReply, suggestions);
      setGeneratedReply(refined);
      setSuggestions(''); // Clear suggestions after refinement
    } catch (err) {
       handleError(err);
    } finally {
      setIsRefining(false);
    }
  }, [generatedReply, suggestions]);
  
  const isGenerateDisabled =
    !formState.incomingLetter ||
    !formState.pointsToConsider || 
    isLoading ||
    formState.incomingLetter.length > MAX_LETTER_LENGTH;

  if (isCheckingKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            API Key Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            To start generating replies, you need to connect your Google Cloud project.
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <button
              onClick={handleSelectKey}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Select API Key
            </button>
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>
                Ensure your project has billing enabled. 
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-500 ml-1">
                  Learn more about billing.
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            AI Letter Reply Generator
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Draft and refine professional correspondence with the power of AI.
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8">
            <InputPanel
                formState={formState}
                setFormState={setFormState}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                isGenerateDisabled={isGenerateDisabled}
                maxLetterLength={MAX_LETTER_LENGTH}
            />
            <OutputPanel
                generatedReply={generatedReply}
                isLoading={isLoading}
                error={error}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                onRefine={handleRefine}
                isRefining={isRefining}
            />
        </div>
      </main>

      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;