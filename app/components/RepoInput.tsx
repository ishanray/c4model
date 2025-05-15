
'use client';

import { useState } from 'react';

interface RepoInputProps {
  onSubmit: (repoUrl: string) => void;
  isLoading: boolean;
}

export default function RepoInput({ onSubmit, isLoading }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim() !== '') {
      onSubmit(repoUrl);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-center">Enter GitHub Repository URL</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repository"
          className="flex-grow p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || repoUrl.trim() === ''}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isLoading || repoUrl.trim() === ''
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </div>
          ) : (
            'Generate C4 Model'
          )}
        </button>
      </form>
      <p className="mt-2 text-sm text-gray-400">
        Example: https://github.com/octokit/octokit.js
      </p>
    </div>
  );
}
