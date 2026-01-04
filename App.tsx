import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Utensils, Star, Plus, Trash2, Heart, PieChart, Settings2 } from 'lucide-react';
import { DailyLog, FoodEntry, Tab, AVAILABLE_MACROS, MacroKey } from './types';
import MacroChart from './components/MacroChart';
import AddFoodForm from './components/AddFoodForm';

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [favorites, setFavorites] = useState<FoodEntry[]>([]);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Graph configuration
  const [visibleMacros, setVisibleMacros] = useState<MacroKey[]>(['calories', 'protein', 'fiber']);

  // Settings Ref for click outside
  const settingsRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('entries');
    const savedFavorites = localStorage.getItem('favorites');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Click outside listener for settings
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derived Data
  const dailyLogs: DailyLog[] = useMemo(() => {
    const logs: { [date: string]: DailyLog } = {};
    
    // Sort entries by date ascending
    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

    sorted.forEach(entry => {
      if (!logs[entry.date]) {
        logs[entry.date] = {
          date: entry.date,
          entries: [],
          totals: { calories: 0, protein: 0, fiber: 0, carbs: 0, fat: 0, sugar: 0 }
        };
      }
      logs[entry.date].entries.push(entry);
      logs[entry.date].totals.calories += entry.calories;
      logs[entry.date].totals.protein += entry.protein;
      logs[entry.date].totals.fiber += entry.fiber;
      logs[entry.date].totals.carbs += entry.carbs;
      logs[entry.date].totals.fat += entry.fat;
      logs[entry.date].totals.sugar = (logs[entry.date].totals.sugar || 0) + (entry.sugar || 0);
    });

    return Object.values(logs);
  }, [entries]);

  // Today's Data
  const todayDate = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find(log => log.date === todayDate) || {
    date: todayDate,
    entries: [],
    totals: { calories: 0, protein: 0, fiber: 0, carbs: 0, fat: 0, sugar: 0 }
  };

  // Handlers
  const addEntry = (entry: FoodEntry) => {
    setEntries([...entries, entry]);
    setIsAddingFood(false);
    setActiveTab(Tab.LOG); // Switch to log to see it
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const toggleFavorite = (entry: FoodEntry) => {
    const exists = favorites.find(f => f.name === entry.name);
    if (exists) {
      setFavorites(favorites.filter(f => f.name !== entry.name));
    } else {
      setFavorites([...favorites, { ...entry, id: 'fav-' + Date.now(), isFavorite: true }]);
    }
  };

  const toggleGraphMacro = (key: MacroKey) => {
    if (visibleMacros.includes(key)) {
      if (visibleMacros.length > 1) { // Prevent empty graph
        setVisibleMacros(visibleMacros.filter(k => k !== key));
      }
    } else {
      if (visibleMacros.length < 4) { // Limit max lines for readability
         setVisibleMacros([...visibleMacros, key]);
      }
    }
  };

  const addFromFavorite = (fav: FoodEntry) => {
    const newEntry = {
      ...fav,
      id: Math.random().toString(36).substring(2, 9),
      date: todayDate,
      timestamp: Date.now()
    };
    addEntry(newEntry);
  };

  // --- Render Helpers ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Progress</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           {/* Simple Macro Toggle */}
           <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-md transition-colors ${isSettingsOpen ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:text-primary hover:bg-slate-50'}`}
              >
                <Settings2 size={20} />
              </button>
              {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                   <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Graph Metrics (Max 4)</p>
                   {AVAILABLE_MACROS.map(m => (
                     <div 
                        key={m.key} 
                        className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded cursor-pointer"
                        onClick={() => toggleGraphMacro(m.key)}
                     >
                       <span className="text-sm text-slate-700">{m.label}</span>
                       <div className={`w-4 h-4 rounded border flex items-center justify-center ${visibleMacros.includes(m.key) ? 'bg-primary border-primary' : 'border-slate-300 bg-white'}`}>
                          {visibleMacros.includes(m.key) && <div className="w-2 h-2 bg-white rounded-sm" />}
                       </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <MacroChart data={dailyLogs} activeMacros={visibleMacros} />
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visibleMacros.map(key => {
          const config = AVAILABLE_MACROS.find(m => m.key === key);
          const value = todayLog.totals[key];
          return (
            <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-slate-500 font-medium">{config?.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: config?.color }}>
                {Math.round(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderLog = () => (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 py-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Today's Food</h2>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button 
          onClick={() => setIsAddingFood(true)}
          className="bg-primary hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAddingFood && (
        <AddFoodForm 
          onAdd={addEntry} 
          onCancel={() => setIsAddingFood(false)} 
        />
      )}

      {todayLog.entries.length === 0 && !isAddingFood ? (
         <div className="text-center py-12 text-slate-400">
            <Utensils size={48} className="mx-auto mb-4 opacity-50 text-slate-300" />
            <p>No food logged today.</p>
            <button onClick={() => setIsAddingFood(true)} className="text-primary mt-2 font-medium hover:underline">Add your first meal</button>
         </div>
      ) : (
        <div className="space-y-3">
          {todayLog.entries.slice().reverse().map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-primary/30 transition-colors">
              <div>
                <h4 className="font-semibold text-slate-900 text-lg">{entry.name}</h4>
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-medium" style={{ color: '#f59e0b' }}>{entry.calories} kcal</span>
                  <span className="font-medium" style={{ color: '#059669' }}>{entry.protein}g Pro</span>
                  <span className="font-medium" style={{ color: '#2563eb' }}>{entry.fiber}g Fib</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={() => toggleFavorite(entry)}
                  className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${favorites.some(f => f.name === entry.name) ? 'text-yellow-400' : 'text-slate-400'}`}
                >
                   <Star size={18} fill={favorites.some(f => f.name === entry.name) ? "currentColor" : "none"} />
                 </button>
                 <button 
                   onClick={() => deleteEntry(entry.id)}
                   className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Saved Favorites</h2>
      {favorites.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
           <Heart size={48} className="mx-auto mb-4 opacity-50 text-slate-300" />
           <p>Star items in your log to see them here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
           {favorites.map(fav => (
             <div key={fav.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-primary transition-colors cursor-pointer group" onClick={() => addFromFavorite(fav)}>
               <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{fav.name}</h4>
                  <p className="text-xs text-slate-500">{fav.calories} kcal • {fav.protein}g P • {fav.fiber}g F</p>
               </div>
               <div className="bg-slate-100 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-all">
                 <Plus size={20} />
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20 max-w-xl mx-auto border-x border-slate-200 shadow-2xl relative bg-slate-50">
      <header className="p-4 flex items-center gap-2 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <PieChart className="text-white" size={20} />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-slate-900">Macro Manager</h1>
      </header>

      <main className="p-4">
        {activeTab === Tab.DASHBOARD && renderDashboard()}
        {activeTab === Tab.LOG && renderLog()}
        {activeTab === Tab.FAVORITES && renderFavorites()}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-around max-w-xl mx-auto z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab(Tab.DASHBOARD)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.DASHBOARD ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-medium">Trends</span>
        </button>
        <button 
          onClick={() => setActiveTab(Tab.LOG)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.LOG ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Utensils size={24} />
          <span className="text-[10px] font-medium">Log</span>
        </button>
        <button 
          onClick={() => setActiveTab(Tab.FAVORITES)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.FAVORITES ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Heart size={24} />
          <span className="text-[10px] font-medium">Favorites</span>
        </button>
      </nav>
    </div>
  );
};

export default App;