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

const TextAreaWithLabel: React.FC<{
  id: keyof FormState;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
}> = ({ id, label, placeholder, value, onChange, required = false, rows = 6 }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={id}
      name={id}
      rows={rows}
      className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
     if (name === 'incomingLetter' && fileName) {
      setFileName(null);
    }
  };
  
  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFormState(prevState => ({
        ...prevState,
        incomingLetter: text,
      }));
    };
    reader.onerror = () => {
      console.error("Error reading file");
      setFileName(null);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setFormState(prevState => ({
      ...prevState,
      incomingLetter: '',
    }));
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
        Provide Letter Details
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incoming Letter <span className="text-red-500">*</span>
          </label>
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 -mb-px border-b-2 ${
                inputMode === 'paste' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 -mb-px border-b-2 ${
                inputMode === 'upload' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload File
            </button>
          </div>
          <div className="mt-4">
            {inputMode === 'paste' ? (
              <textarea
                id="incomingLetter"
                name="incomingLetter"
                rows={10}
                className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                placeholder="Paste the full content of the letter you received here."
                value={formState.incomingLetter}
                onChange={handleChange}
                required
              />
            ) : (
              <div>
                {fileName ? (
                  <div className="flex items-center justify-between p-3 bg-gray-100 border border-gray-200 rounded-md">
                    <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                    <button 
                      onClick={handleRemoveFile} 
                      className="text-sm text-red-600 hover:text-red-800 font-semibold ml-4 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-1 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">TXT, MD up to 1MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between items-start text-xs text-gray-500 mt-1">
            <div className="flex-grow pr-4">
                {isOverLimit && (
                  <p className="text-sm font-medium text-red-600">
                    Letter is too long. Please shorten it to enable generation.
                  </p>
                )}
            </div>
            <span className={`flex-shrink-0 font-mono ${isOverLimit ? 'font-bold text-red-600' : ''}`}>
              {letterLength.toLocaleString()} / {maxLetterLength.toLocaleString()}
            </span>
          </div>
        </div>

        <TextAreaWithLabel
          id="pointsToConsider"
          label="Points to Consider for Reply"
          placeholder="List the key points, arguments, or information you want to include in the reply."
          value={formState.pointsToConsider}
          onChange={handleChange}
          required
        />
        <TextAreaWithLabel
          id="contractClauses"
          label="Relevant Contract Clauses (Optional)"
          placeholder="Enter any specific contract clauses or references that support your points."
          value={formState.contractClauses}
          onChange={handleChange}
        />
        <div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerateDisabled}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <GenerateIcon className="w-5 h-5 mr-2 -ml-1" />
            {isLoading ? 'Generating...' : 'Generate Reply'}
          </button>
        </div>
      </div>
    </div>
  );
};