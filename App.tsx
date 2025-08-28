import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ResumePreview } from './components/ResumePreview';
import { Loader } from './components/Loader';
import { generateResumeFromCV } from './services/geminiService';
import type { ResumeData } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResumeData(null);
    setError(null);
    setIsEditing(false);
  };

  const handleGenerateClick = useCallback(async () => {
    if (!file) {
      setError('Please upload a CV file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResumeData(null);
    setIsEditing(false);

    try {
      const generatedData = await generateResumeFromCV(file, pageCount);
      setResumeData(generatedData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during AI generation.');
    } finally {
      setIsLoading(false);
    }
  }, [file, pageCount]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-xl shadow-md sticky top-8">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Controls</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">1. Upload your CV</label>
                  <FileUpload onFileChange={handleFileChange} />
                </div>
                
                <div>
                  <label htmlFor="page-count" className="block text-sm font-medium text-slate-600 mb-2">2. Set Target Page Count</label>
                  <select
                    id="page-count"
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value={1}>1 Page</option>
                    <option value={2}>2 Pages</option>
                    <option value={3}>3 Pages</option>
                  </select>
                </div>
                
                <button
                  onClick={handleGenerateClick}
                  disabled={!file || isLoading}
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader />
                      Generating...
                    </>
                  ) : (
                    'Generate Resume'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white p-6 rounded-xl shadow-md min-h-[60vh] flex flex-col">
              <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">Generated Resume</h2>
              {isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center">
                   <Loader size="lg"/>
                   <p className="text-slate-500 mt-4 text-center">AI is crafting your resume... <br/> This may take a moment.</p>
                </div>
              )}
              {error && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              {!isLoading && !error && !resumeData && (
                 <div className="flex-grow flex items-center justify-center text-center text-slate-400">
                    <p>Your formatted resume will appear here once generated.</p>
                 </div>
              )}
              {resumeData && (
                <ResumePreview 
                  data={resumeData} 
                  onSave={setResumeData}
                  isEditing={isEditing}
                  onToggleEdit={setIsEditing}
                />
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;