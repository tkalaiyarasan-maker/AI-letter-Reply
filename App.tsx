
import React, { useState, useCallback } from 'react';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { generateReplyStream, refineReplyStream } from './services/geminiService';
import type { FormState } from './types';

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    incomingLetter: '',
    incomingFile: null,
    pointsToConsider: '',
    contractClauses: '',
    verbosity: 'concise',
  });
  
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'generating' | 'refining' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MAX_LETTER_LENGTH = 100000; // Safe limit for token context

  const handleGenerate = useCallback(async () => {
    // Validate: Must have points to consider, and EITHER text letter OR file letter
    if ((!formState.incomingLetter && !formState.incomingFile) || !formState.pointsToConsider) return;

    setStatus('loading');
    setErrorMessage(null);
    setGeneratedReply('');
    setSuggestions('');

    try {
      const stream = await generateReplyStream(formState);
      setStatus('generating');
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text;
        setGeneratedReply(fullText);
      }
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || "Failed to generate reply. Please check your API key and try again.");
    }
  }, [formState]);

  const handleRefine = useCallback(async () => {
    if (!suggestions.trim() || !generatedReply) return;
    
    const previousReply = generatedReply;
    setStatus('refining');
    setErrorMessage(null);
    setGeneratedReply(''); // Clear for streaming the new version (or could append, but replacement is clearer for refine)

    try {
      const stream = await refineReplyStream(previousReply, suggestions);
      setSuggestions(''); // Clear input
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text;
        setGeneratedReply(fullText);
      }
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setGeneratedReply(previousReply); // Restore if failed
      setErrorMessage(err.message || "Failed to refine reply.");
    }
  }, [generatedReply, suggestions]);
  
  const hasIncomingContent = !!formState.incomingLetter || !!formState.incomingFile;
  
  const isGenerateDisabled =
    !hasIncomingContent ||
    !formState.pointsToConsider || 
    status === 'loading' ||
    status === 'generating' ||
    status === 'refining' ||
    formState.incomingLetter.length > MAX_LETTER_LENGTH;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: '"Calibri", "Segoe UI", sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              LetterGen <span className="text-blue-600">AI</span>
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Professional Reply Generator
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {status === 'error' && errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* Top Section: Inputs */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-2">1</span>
                Input Details
              </h2>
              <InputPanel
                formState={formState}
                setFormState={setFormState}
                onGenerate={handleGenerate}
                isLoading={status === 'loading' || status === 'generating'}
                isGenerateDisabled={isGenerateDisabled}
                maxLetterLength={MAX_LETTER_LENGTH}
              />
            </div>
          </section>

          {/* Bottom Section: Output */}
          <section className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-full min-h-[500px] transition-opacity duration-200`}>
            <div className="p-6 flex-grow flex flex-col">
               <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-2">2</span>
                Generated Reply
              </h2>
              <OutputPanel
                generatedReply={generatedReply}
                status={status}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                onRefine={handleRefine}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
