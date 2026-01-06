import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Utensils, Star, Plus, Trash2, Heart, PieChart, Settings2, Flame, Activity, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { DailyLog, FoodEntry, ActivityEntry, Tab, AVAILABLE_MACROS, MacroKey } from './types';
import MacroChart from './components/MacroChart';
import AddFoodForm from './components/AddFoodForm';
import AddActivityForm from './components/AddActivityForm';

// Helper to get local date string YYYY-MM-DD
const getLocalYMD = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [favorites, setFavorites] = useState<FoodEntry[]>([]);
  
  // UI State for Forms
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityEntry | null>(null);
  const [favoriteToAdding, setFavoriteToAdding] = useState<FoodEntry | null>(null);

  // View State
  const [viewDate, setViewDate] = useState<string>(getLocalYMD());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Graph configuration
  const [visibleMacros, setVisibleMacros] = useState<MacroKey[]>(['calories', 'protein', 'fiber']);

  // Settings Ref for click outside
  const settingsRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('entries');
    const savedActivities = localStorage.getItem('activities');
    const savedFavorites = localStorage.getItem('favorites');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

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
    
    // Get all unique dates from both entries and activities
    const allDates = new Set([...entries.map(e => e.date), ...activities.map(a => a.date)]);

    allDates.forEach(date => {
      logs[date] = {
        date,
        entries: [],
        activities: [],
        caloriesBurned: 0,
        totals: { calories: 0, protein: 0, fiber: 0, carbs: 0, fat: 0, sugar: 0 }
      };
    });

    entries.forEach(entry => {
      if (logs[entry.date]) {
        logs[entry.date].entries.push(entry);
        logs[entry.date].totals.calories += entry.calories;
        logs[entry.date].totals.protein += entry.protein;
        logs[entry.date].totals.fiber += entry.fiber;
        logs[entry.date].totals.carbs += entry.carbs;
        logs[entry.date].totals.fat += entry.fat;
        logs[entry.date].totals.sugar = (logs[entry.date].totals.sugar || 0) + (entry.sugar || 0);
      }
    });

    activities.forEach(activity => {
      if (logs[activity.date]) {
        logs[activity.date].activities.push(activity);
        logs[activity.date].caloriesBurned += activity.caloriesBurned;
      }
    });

    // Sort by date string safely
    return Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, activities]);

  // Today's Data (using local time)
  const todayDateStr = getLocalYMD();
  
  // Data for the currently viewed date in Log tab
  const viewedLog = dailyLogs.find(log => log.date === viewDate) || {
    date: viewDate,
    entries: [],
    activities: [],
    caloriesBurned: 0,
    totals: { calories: 0, protein: 0, fiber: 0, carbs: 0, fat: 0, sugar: 0 }
  };

  // Handlers
  const handleSaveFood = (entry: FoodEntry) => {
    // Check if updating or new
    if (editingFood) {
      setEntries(entries.map(e => e.id === entry.id ? entry : e));
      setEditingFood(null);
    } else {
      setEntries([...entries, entry]);
      setIsAddingFood(false);
      setFavoriteToAdding(null);
    }
    setActiveTab(Tab.LOG); 
  };

  const handleSaveActivity = (entry: ActivityEntry) => {
    if (editingActivity) {
      setActivities(activities.map(a => a.id === entry.id ? entry : a));
      setEditingActivity(null);
    } else {
      setActivities([...activities, entry]);
      setIsAddingActivity(false);
    }
    setActiveTab(Tab.LOG);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const toggleFavorite = (entry: FoodEntry) => {
    const exists = favorites.find(f => f.name === entry.name);
    if (exists) {
      setFavorites(favorites.filter(f => f.name !== entry.name));
    } else {
      // Create a clean favorite entry
      setFavorites([...favorites, { ...entry, id: 'fav-' + Date.now(), isFavorite: true }]);
    }
  };

  const toggleGraphMacro = (key: MacroKey) => {
    if (visibleMacros.includes(key)) {
      if (visibleMacros.length > 1) { 
        setVisibleMacros(visibleMacros.filter(k => k !== key));
      }
    } else {
      if (visibleMacros.length < 4) { 
         setVisibleMacros([...visibleMacros, key]);
      }
    }
  };

  const startAddFromFavorite = (fav: FoodEntry) => {
    setFavoriteToAdding(fav);
    setIsAddingFood(true);
    setActiveTab(Tab.LOG);
  };

  const changeViewDate = (days: number) => {
    const d = new Date(viewDate + "T12:00:00"); // Safety: set to noon to avoid timezone shift on just date parsing
    d.setDate(d.getDate() + days);
    setViewDate(getLocalYMD(d));
  };

  // --- Render Helpers ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Progress</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
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

      {/* Today's Summary (Using current date, not viewed date) */}
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Today's Summary</h3>
         <span className="text-xs text-slate-400">{todayDateStr}</span>
      </div>
      
      {(() => {
        // We calculate Today's summary specifically for the dashboard, regardless of log view
        const todayLog = dailyLogs.find(l => l.date === todayDateStr) || { totals: {calories:0, protein:0, fiber:0, carbs:0, fat:0}, caloriesBurned: 0 };
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Flame size={18} />
                  <span className="text-sm font-bold uppercase">Burned</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{todayLog.caloriesBurned}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Activity size={18} />
                  <span className="text-sm font-bold uppercase">Net Calories</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{todayLog.totals.calories - todayLog.caloriesBurned}</p>
              </div>
            </div>

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
          </>
        );
      })()}
    </div>
  );

  const renderLog = () => (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="sticky top-0 bg-slate-50/95 backdrop-blur z-20 pt-4 pb-2 border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-2xl font-bold text-slate-900">Daily Log</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddingActivity(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
              title="Log Activity"
            >
              <Flame size={20} />
            </button>
            <button 
              onClick={() => setIsAddingFood(true)}
              className="bg-primary hover:bg-emerald-700 text-white p-2.5 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
              title="Log Food"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Date Strip */}
        <div className="flex items-center justify-between bg-white/50 p-1 rounded-2xl mb-1 select-none">
          <button onClick={() => changeViewDate(-1)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex-1 flex justify-around px-1 gap-1">
            {(() => {
                // Generate window of 5 days
                const dates = [];
                const center = new Date(viewDate + "T12:00:00");
                for (let i = -2; i <= 2; i++) {
                    const d = new Date(center);
                    d.setDate(center.getDate() + i);
                    dates.push(getLocalYMD(d));
                }
                
                return dates.map(dateStr => {
                    const dateObj = new Date(dateStr + "T12:00:00");
                    const isSelected = dateStr === viewDate;
                    const isToday = dateStr === todayDateStr;
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    
                    return (
                      <button 
                        key={dateStr}
                        onClick={() => setViewDate(dateStr)}
                        className={`flex flex-col items-center justify-center w-11 h-14 rounded-xl transition-all duration-200 relative ${
                          isSelected 
                            ? 'bg-primary text-white shadow-lg shadow-emerald-500/20 scale-110 z-10' 
                            : 'text-slate-400 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">{dayName}</span>
                        <span className="text-lg font-bold leading-none mt-0.5">{dayNum}</span>
                        {isToday && !isSelected && (
                            <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    )
                });
            })()}
          </div>

          <button onClick={() => changeViewDate(1)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {isAddingFood && (
        <AddFoodForm 
          onSave={handleSaveFood} 
          onCancel={() => { setIsAddingFood(false); setFavoriteToAdding(null); }}
          initialValues={favoriteToAdding}
          selectedDate={viewDate}
        />
      )}
      
      {editingFood && (
        <AddFoodForm 
          onSave={handleSaveFood}
          onCancel={() => setEditingFood(null)}
          initialData={editingFood}
        />
      )}

      {isAddingActivity && (
        <AddActivityForm 
          onSave={handleSaveActivity}
          onCancel={() => setIsAddingActivity(false)}
          selectedDate={viewDate}
        />
      )}

      {editingActivity && (
        <AddActivityForm 
          onSave={handleSaveActivity}
          onCancel={() => setEditingActivity(null)}
          initialData={editingActivity}
        />
      )}

      {/* Activity List */}
      {viewedLog.activities.length > 0 && (
         <div className="space-y-2 mb-6">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Activities</h3>
           {viewedLog.activities.slice().reverse().map(act => (
             <div key={act.id} className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex justify-between items-center group">
               <div className="flex items-center gap-3">
                 <div className="bg-orange-100 p-2 rounded-lg text-orange-500">
                   <Activity size={18} />
                 </div>
                 <div>
                    <h4 className="font-semibold text-slate-900">{act.name}</h4>
                    <p className="text-xs text-slate-500">{new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-600 mr-2">-{act.caloriesBurned} kcal</span>
                  <button 
                   onClick={() => setEditingActivity(act)}
                   className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                 >
                   <Pencil size={16} />
                 </button>
                  <button 
                   onClick={() => deleteActivity(act.id)}
                   className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
             </div>
           ))}
         </div>
      )}

      {/* Food List */}
      <div className="space-y-3">
         {viewedLog.entries.length > 0 && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Meals</h3>}
         {viewedLog.entries.length === 0 && viewedLog.activities.length === 0 && !isAddingFood && !isAddingActivity && !editingFood && !editingActivity ? (
            <div className="text-center py-12 text-slate-400">
                <Utensils size={48} className="mx-auto mb-4 opacity-50 text-slate-300" />
                <p>No activity logged for {viewDate === todayDateStr ? "today" : new Date(viewDate + "T12:00:00").toLocaleDateString(undefined, { weekday: 'long' })}.</p>
                <div className="flex justify-center gap-4 mt-2">
                  <button onClick={() => setIsAddingFood(true)} className="text-primary font-medium hover:underline">Log Food</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setIsAddingActivity(true)} className="text-orange-500 font-medium hover:underline">Log Activity</button>
                </div>
            </div>
          ) : (
            viewedLog.entries.slice().reverse().map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-primary/30 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">{entry.name}</h4>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-medium" style={{ color: '#f59e0b' }}>{entry.calories} kcal</span>
                    <span className="font-medium" style={{ color: '#059669' }}>{entry.protein}g Pro</span>
                    <span className="font-medium" style={{ color: '#2563eb' }}>{entry.fiber}g Fib</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => toggleFavorite(entry)}
                    className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${favorites.some(f => f.name === entry.name) ? 'text-yellow-400' : 'text-slate-400'}`}
                  >
                     <Star size={18} fill={favorites.some(f => f.name === entry.name) ? "currentColor" : "none"} />
                   </button>
                   <button 
                     onClick={() => setEditingFood(entry)}
                     className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                   >
                     <Pencil size={18} />
                   </button>
                   <button 
                     onClick={() => deleteEntry(entry.id)}
                     className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            ))
          )}
      </div>
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
             <div key={fav.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-primary transition-colors cursor-pointer group" onClick={() => startAddFromFavorite(fav)}>
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