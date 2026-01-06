import React, { useState } from 'react';
import { Flame, Check, Activity } from 'lucide-react';
import { ActivityEntry } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface AddActivityFormProps {
  onSave: (entry: ActivityEntry) => void;
  onCancel: () => void;
  initialData?: ActivityEntry | null;
  selectedDate?: string;
}

const AddActivityForm: React.FC<AddActivityFormProps> = ({ onSave, onCancel, initialData, selectedDate }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [calories, setCalories] = useState(initialData?.caloriesBurned?.toString() || '');

  const handleSave = () => {
    if (!name || !calories) return;
    
    // Use local time for date generation
    const getLocalYMD = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const newEntry: ActivityEntry = {
      id: initialData?.id || generateId(),
      name: name,
      caloriesBurned: Math.max(0, parseInt(calories, 10)),
      date: initialData?.date || selectedDate || getLocalYMD(),
      timestamp: initialData?.timestamp || Date.now()
    };
    onSave(newEntry);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200 animate-in fade-in zoom-in duration-200 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Flame className="text-orange-500" size={20} />
          {initialData ? 'Edit Activity' : 'Log Activity'}
        </h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-800">Cancel</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Activity Name</label>
          <input 
            type="text" 
            autoFocus
            placeholder="e.g. Morning Run, Gym, Cycling"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
           <label className="block text-xs font-medium text-slate-500 mb-1">Calories Burned</label>
           <div className="relative">
             <input 
               type="number" 
               min="0"
               placeholder="0"
               value={calories}
               onChange={(e) => setCalories(e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none pl-10"
             />
             <div className="absolute left-3 top-3.5 text-slate-400">
               <Activity size={18} />
             </div>
           </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={!name || !calories}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50 shadow-md shadow-orange-500/20 transition-colors"
        >
          <Check size={18} />
          {initialData ? 'Save Changes' : 'Add Activity'}
        </button>
      </div>
    </div>
  );
};

export default AddActivityForm;