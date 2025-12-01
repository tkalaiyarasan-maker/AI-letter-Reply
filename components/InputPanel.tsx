
import React, { useState } from 'react';
import { GenerateIcon } from './icons/GenerateIcon';
import { UploadIcon } from './icons/UploadIcon';
import type { FormState } from '../types';

interface InputPanelProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onGenerate: () => void;
  isLoading: boolean;
  isGenerateDisabled: boolean;
  maxLetterLength: number;
}

const TextAreaField: React.FC<{
  id: keyof FormState;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  helperText?: string;
}> = ({ id, label, placeholder, value, onChange, required = false, rows = 4, helperText }) => (
  <div className="mb-5">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={id}
      name={id}
      rows={rows}
      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-white text-gray-900 placeholder-gray-400 transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
    {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
  </div>
);

export const InputPanel: React.FC<InputPanelProps> = ({
  formState,
  setFormState,
  onGenerate,
  isLoading,
  isGenerateDisabled,
  maxLetterLength,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const letterLength = formState.incomingLetter.length;
  const isOverLimit = letterLength > maxLetterLength;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Update state and clear file if user types in the letter box
    setFormState(prevState => ({ 
        ...prevState, 
        [name]: value,
        ...(name === 'incomingLetter' ? { incomingFile: null } : {})
    }));
    
    if (name === 'incomingLetter' && fileName) setFileName(null);
  };
  
  const processFile = (file: File) => {
    setFileName(file.name);
    
    // Check if it's a PDF
    if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            // result is "data:application/pdf;base64,......"
            // We need to strip the prefix for the API
            const base64Data = result.split(',')[1];
            
            setFormState(prevState => ({
                ...prevState,
                incomingLetter: '', // Clear text field
                incomingFile: {
                    name: file.name,
                    data: base64Data,
                    mimeType: 'application/pdf'
                }
            }));
        };
        reader.readAsDataURL(file);
    } else {
        // Assume text-based (txt, md)
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormState(prevState => ({
            ...prevState,
            incomingLetter: event.target?.result as string,
            incomingFile: null,
          }));
        };
        reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Incoming Letter Content <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                inputMode === 'paste' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Paste
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                inputMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload
            </button>
          </div>
        </div>

        {inputMode === 'paste' ? (
          <div className="relative">
            <textarea
              name="incomingLetter"
              rows={12}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-white text-gray-900 placeholder-gray-400"
              placeholder={formState.incomingFile ? "PDF Uploaded. Switch to Upload tab to manage." : "Paste the full text of the letter you want to reply to..."}
              value={formState.incomingLetter}
              onChange={handleChange}
              disabled={!!formState.incomingFile}
            />
             {formState.incomingFile ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 rounded-lg">
                     <p className="text-sm font-medium text-gray-600">PDF File Uploaded: {formState.incomingFile.name}</p>
                </div>
            ) : (
                <div className={`text-right text-xs mt-1 ${isOverLimit ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                  {letterLength.toLocaleString()} / {maxLetterLength.toLocaleString()} chars
                </div>
            )}
          </div>
        ) : (
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {fileName ? (
              <div className="text-center">
                 <p className="text-sm font-medium text-gray-900 break-all">{fileName}</p>
                 <button 
                    onClick={() => { 
                        setFileName(null); 
                        setFormState(s => ({...s, incomingLetter: '', incomingFile: null}));
                    }} 
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                 >
                    Remove File
                 </button>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md,.pdf,.TXT,.MD,.PDF" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, TXT, or MD files</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Verbosity Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Reply Style</label>
        <div className="flex space-x-4">
          <label className={`flex-1 relative rounded-lg border p-4 flex cursor-pointer focus:outline-none ${formState.verbosity === 'concise' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
            <input 
              type="radio" 
              name="verbosity" 
              value="concise" 
              className="sr-only" 
              checked={formState.verbosity === 'concise'}
              onChange={() => setFormState(s => ({...s, verbosity: 'concise'}))}
            />
            <div className="flex items-center justify-between w-full">
               <div className="flex items-center">
                  <div className="text-sm">
                    <p className={`font-medium ${formState.verbosity === 'concise' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Simple (Concise)
                    </p>
                    <p className={`text-xs inline ${formState.verbosity === 'concise' ? 'text-blue-700' : 'text-gray-500'}`}>
                      Brief, reasonable, and strictly to the point.
                    </p>
                  </div>
               </div>
               {formState.verbosity === 'concise' && (
                 <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                 </svg>
               )}
            </div>
          </label>

          <label className={`flex-1 relative rounded-lg border p-4 flex cursor-pointer focus:outline-none ${formState.verbosity === 'elaborated' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
            <input 
              type="radio" 
              name="verbosity" 
              value="elaborated" 
              className="sr-only" 
              checked={formState.verbosity === 'elaborated'}
              onChange={() => setFormState(s => ({...s, verbosity: 'elaborated'}))}
            />
             <div className="flex items-center justify-between w-full">
               <div className="flex items-center">
                  <div className="text-sm">
                    <p className={`font-medium ${formState.verbosity === 'elaborated' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Elaborated (Detailed)
                    </p>
                    <p className={`text-xs inline ${formState.verbosity === 'elaborated' ? 'text-blue-700' : 'text-gray-500'}`}>
                      Comprehensive explanation and context.
                    </p>
                  </div>
               </div>
               {formState.verbosity === 'elaborated' && (
                 <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                 </svg>
               )}
            </div>
          </label>
        </div>
      </div>

      <TextAreaField
        id="pointsToConsider"
        label="Points to Cover"
        placeholder="What should this reply say? List key arguments, approvals, denials, or facts."
        value={formState.pointsToConsider}
        onChange={handleChange}
        required
        rows={6}
      />

      <TextAreaField
        id="contractClauses"
        label="Contract Clauses / References"
        placeholder="Optional: Paste relevant contract clauses or specific IDs."
        value={formState.contractClauses}
        onChange={handleChange}
        rows={4}
      />

      <div className="pt-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className={`w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-all duration-200
            ${isGenerateDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <GenerateIcon className="w-5 h-5 mr-2" />
              Generate Professional Reply
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
