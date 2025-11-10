import React, { useState, useCallback } from 'react';
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
      if (err instanceof Error) {
        setError(`Failed to generate reply: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
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
       if (err instanceof Error) {
        setError(`Failed to refine reply: ${err.message}`);
      } else {
        setError('An unknown error occurred during refinement.');
      }
    } finally {
      setIsRefining(false);
    }
  }, [generatedReply, suggestions]);
  
  const isGenerateDisabled = 
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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