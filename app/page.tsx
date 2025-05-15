'use client';

import { useState } from 'react';
import RepoInput from './components/RepoInput';
import C4Viewer from './components/C4Viewer';
import { C4Model, analyzeRepository, extractRepoInfo } from './utils/githubAnalyzer';
import { useToast } from './components/ui/ToastProvider';

export default function Home() {
  const [model, setModel] = useState<C4Model | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (repoUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const repoInfo = extractRepoInfo(repoUrl);
      if (!repoInfo) {
        const errorMsg = 'Invalid GitHub repository URL. Please enter a valid URL in the format: https://github.com/username/repository';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }
      
      const { owner, repo } = repoInfo;
      showToast(`Analyzing repository: ${owner}/${repo}`, 'info');
      
      const generatedModel = await analyzeRepository(owner, repo);
      
      if (generatedModel.systems.length === 0) {
        const errorMsg = 'Could not generate C4 model. Repository structure could not be analyzed.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }
      
      setModel(generatedModel);
      showToast(`Successfully generated C4 model for ${owner}/${repo}`, 'success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="pt-10 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            C4 Model Generator
          </h1>
          <p className="text-xl text-center mt-3 text-gray-300 max-w-3xl mx-auto">
            Visualize software architecture from GitHub repositories using the C4 model
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 space-y-8 pb-20">
        <RepoInput onSubmit={handleSubmit} isLoading={isLoading} />
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-white">
            <h3 className="font-bold text-lg mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {model && !isLoading && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">C4 Model Visualization</h2>
            </div>
            <div className="h-[800px] w-full">
              <C4Viewer model={model} />
            </div>
          </div>
        )}

        {/* Information about C4 Model */}
        <div className="mt-16 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">About C4 Model</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">What is the C4 Model?</h3>
              <p className="text-gray-300">
                The C4 model is a simple way to communicate software architecture at different levels of abstraction, 
                allowing you to tell different stories to different audiences. It consists of a hierarchical set of diagrams
                for context, containers, components, and code.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">Levels of the C4 Model</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-2">
                <li><span className="font-medium">System Context:</span> Shows the big picture of how your software system fits into the world around it.</li>
                <li><span className="font-medium">Containers:</span> Zooms into the system to show the high-level technology choices and how containers communicate.</li>
                <li><span className="font-medium">Components:</span> Zooms into an individual container to show its major components and their interactions.</li>
                <li><span className="font-medium">Code:</span> Zooms into an individual component to show how it is implemented.</li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">How to Use This Tool</h3>
            <ol className="list-decimal pl-5 text-gray-300 space-y-2">
              <li>Enter a public GitHub repository URL in the input field above.</li>
              <li>Click "Generate C4 Model" to analyze the repository structure.</li>
              <li>Explore the generated C4 model by clicking on systems and containers to drill down.</li>
              <li>Use the controls to zoom, pan, and navigate through the visualization.</li>
            </ol>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>C4 Model Generator - Based on the C4 model by Simon Brown</p>
          <p className="mt-2">
            <a href="https://c4model.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Learn more about C4 Model
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
