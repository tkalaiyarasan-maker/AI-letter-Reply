import React, { useState, useCallback, useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { generateReply, refineReply } from './services/geminiService';
import type { FormState } from './types';

// A custom error class to handle specific API key related issues
class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    incomingLetter: '',
    pointsToConsider: '',
    contractClauses: '',
  });
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = useCallback(async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } catch (e) {
      console.error('Error checking for API key:', e);
      setHasApiKey(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Optimistically assume the user selected a key to avoid race conditions.
      setHasApiKey(true);
      setError(null); // Clear previous errors
    } catch (e) {
      console.error('Error opening select key dialog:', e);
      setError('Could not open the API key selection dialog.');
    }
  };

  const handleError = (err: unknown) => {
    if (err instanceof ApiKeyError) {
      setError(err.message);
      // Reset the key state to force the user to select a key again
      setHasApiKey(false);
    } else if (err instanceof Error) {
      setError(`An error occurred: ${err.message}`);
    } else {
      setError('An unknown error occurred.');
    }
  };

  const MAX_LETTER_LENGTH = 3000000;

  const handleGenerate = useCallback(async () => {
    if (!hasApiKey) {
      setError("Please select a Gemini API key to proceed.");
      return;
    }
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
  }, [formState, hasApiKey]);

  const handleRefine = useCallback(async () => {
    if (!suggestions.trim() || !generatedReply) return;
    if (!hasApiKey) {
      setError("Please select a Gemini API key to proceed.");
      return;
    }
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
  }, [generatedReply, suggestions, hasApiKey]);
  
  const isGenerateDisabled =
    !hasApiKey ||
    !formState.incomingLetter ||
    !formState.pointsToConsider || 
    isLoading ||
    formState.incomingLetter.length > MAX_LETTER_LENGTH;

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
                hasApiKey={hasApiKey}
                onSelectKey={handleSelectKey}
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
