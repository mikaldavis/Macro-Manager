import React, { useState, useRef } from 'react';
import { Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { analyzeFoodText, analyzeFoodImage } from '../services/geminiService';
import { FoodEntry, Macros } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface AddFoodFormProps {
  onAdd: (entry: FoodEntry) => void;
  onCancel: () => void;
  defaultFavorite?: FoodEntry; // If adding from favorites
}

const AddFoodForm: React.FC<AddFoodFormProps> = ({ onAdd, onCancel, defaultFavorite }) => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{ name: string; macros: Macros } | null>(
    defaultFavorite ? { name: defaultFavorite.name, macros: defaultFavorite } : null
  );
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleError = (e: any) => {
    let msg = e.message || "Could not identify food. Please try again or use manual entry.";
    
    // Provide helpful hint for the specific API key error
    if (msg.includes("API Key") || msg.includes("403") || msg.includes("401")) {
      msg = "API Key missing or invalid. Please add API_KEY to your .env file or deployment settings.";
    }
    setError(msg);
  };

  const handleTextAnalysis = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeFoodText(inputText);
      setPreviewResult(result);
    } catch (e: any) {
      handleError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setMode('image');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const result = await analyzeFoodImage(base64String, file.type);
        setPreviewResult(result);
      } catch (err: any) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!previewResult) return;
    const newEntry: FoodEntry = {
      id: generateId(),
      name: previewResult.name,
      ...previewResult.macros,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      isFavorite: false
    };
    onAdd(newEntry);
  };

  // Manual override of values
  const handleUpdateValue = (key: keyof Macros | 'name', value: string | number) => {
    if (!previewResult) return;
    if (key === 'name') {
       setPreviewResult({ ...previewResult, name: value as string });
    } else {
       setPreviewResult({
         ...previewResult,
         macros: { ...previewResult.macros, [key]: Number(value) }
       });
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200 animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Log Food</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-800">Cancel</button>
      </div>

      {!previewResult && (
        <div className="space-y-4">
          {/* Input Method Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
             <button 
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setMode('text')}
             >
               Text
             </button>
             <button 
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'image' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => { setMode('image'); fileInputRef.current?.click(); }}
             >
               Camera
             </button>
          </div>

          {mode === 'text' && (
            <div className="space-y-3">
              <textarea
                placeholder="e.g., Grilled chicken breast with 1 cup of brown rice"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                onClick={handleTextAnalysis}
                disabled={isLoading || !inputText.trim()}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md shadow-primary/20"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Analyze with AI
              </button>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleImageUpload}
          />
          
          {mode === 'image' && isLoading && (
             <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Analyzing image...</p>
             </div>
          )}
          
          {error && (
            <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Result Preview & Confirmation */}
      {previewResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
            <span className="text-primary"><Check size={20} /></span>
            <input 
                type="text" 
                value={previewResult.name}
                onChange={(e) => handleUpdateValue('name', e.target.value)}
                className="bg-transparent text-slate-900 font-bold text-lg w-full focus:outline-none placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
             {Object.entries(previewResult.macros).map(([key, val]) => (
                <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                   <label className="text-xs text-slate-500 uppercase block mb-1">{key}</label>
                   <input 
                      type="number"
                      value={val}
                      onChange={(e) => handleUpdateValue(key as keyof Macros, e.target.value)}
                      className="w-full bg-transparent text-slate-900 font-mono font-medium focus:outline-none"
                   />
                </div>
             ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setPreviewResult(null); setInputText(''); setError(null); }}
              className="flex-1 py-3 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 rounded-lg font-bold text-white bg-primary hover:bg-emerald-700 transition-colors shadow-lg shadow-primary/20"
            >
              Add Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFoodForm;