// --- OPTIMIZED VERSION ---
// Combined all optimizations: useMemo, custom hooks, error boundaries, and enhanced features
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Check, TrendingUp, Award, Camera, DollarSign, FileText, Target, Users, Bed, Download, Upload, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom hook for localStorage with error handling
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue];
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Data export/import functionality
const useDataManager = () => {
  const exportData = useCallback((allData) => {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `soumik-lifestyle-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, []);

  const importData = useCallback((file, setAllData) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate the imported data structure
        if (typeof importedData !== 'object' || importedData === null) {
          throw new Error('Invalid data format');
        }
        
        setAllData(importedData);
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

  return { exportData, importData };
};

export default function SoumikLifestyle() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [habits, setHabits] = useLocalStorage('habits', []);
  const [todos, setTodos] = useLocalStorage('todos', []);
  const [expenses, setExpenses] = useLocalStorage('expenses', []);
  const [notes, setNotes] = useLocalStorage('notes', []);
  const [memories, setMemories] = useLocalStorage('memories', []);
  const [loans, setLoans] = useLocalStorage('loans', []);
  const [rewards, setRewards] = useLocalStorage('rewards', 0);
  const [sleepSessions, setSleepSessions] = useLocalStorage('sleepSessions', []);
  const [showImportModal, setShowImportModal] = useState(false);

  const { exportData, importData } = useDataManager();

  // Memoized calculations for better performance
  const completedTodosCount = useMemo(() => 
    todos.filter(t => t.completed).length, 
    [todos]
  );

  const pendingLoansAmount = useMemo(() => 
    loans.filter(l => !l.returned).reduce((sum, l) => sum + l.amount, 0), 
    [loans]
  );

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0), 
    [expenses]
  );

  const todayStr = new Date().toDateString();
  const todaySleep = useMemo(() => 
    sleepSessions
      .filter(s => new Date(s.date).toDateString() === todayStr)
      .reduce((sum, s) => sum + s.duration, 0),
    [sleepSessions, todayStr]
  );

  // Combined data for export
  const allData = useMemo(() => ({
    habits,
    todos,
    expenses,
    notes,
    memories,
    loans,
    rewards,
    sleepSessions,
    exportDate: new Date().toISOString()
  }), [habits, todos, expenses, notes, memories, loans, rewards, sleepSessions]);

  const setAllData = useCallback((newData) => {
    if (newData.habits) setHabits(newData.habits);
    if (newData.todos) setTodos(newData.todos);
    if (newData.expenses) setExpenses(newData.expenses);
    if (newData.notes) setNotes(newData.notes);
    if (newData.memories) setMemories(newData.memories);
    if (newData.loans) setLoans(newData.loans);
    if (newData.rewards) setRewards(newData.rewards);
    if (newData.sleepSessions) setSleepSessions(newData.sleepSessions);
  }, [setHabits, setTodos, setExpenses, setNotes, setMemories, setLoans, setRewards, setSleepSessions]);

  const addHabit = useCallback((name) => {
    const newHabit = {
      id: Date.now(),
      name,
      completedDates: [],
      createdAt: new Date().toISOString()
    };
    setHabits(prev => [...prev, newHabit]);
  }, [setHabits]);

  const toggleHabit = useCallback((id) => {
    const today = new Date().toDateString();
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const dates = h.completedDates || [];
        if (dates.includes(today)) {
          return { ...h, completedDates: dates.filter(d => d !== today) };
        } else {
          setRewards(prevRewards => prevRewards + 10);
          return { ...h, completedDates: [...dates, today] };
        }
      }
      return h;
    }));
  }, [setHabits, setRewards]);

  const addTodo = useCallback((task) => {
    const newTodo = {
      id: Date.now(),
      task,
      completed: false,
      photo: null,
      createdAt: new Date().toISOString()
    };
    setTodos(prev => [...prev, newTodo]);
  }, [setTodos]);

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(t => {
      if (t.id === id && !t.completed) {
        setRewards(prevRewards => prevRewards + 5);
        return { ...t, completed: !t.completed };
      }
      return t.id === id ? { ...t, completed: !t.completed } : t;
    }));
  }, [setTodos, setRewards]);

  const uploadTodoPhoto = useCallback((id, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, photo: e.target.result } : t
      ));
    };
    reader.readAsDataURL(file);
  }, [setTodos]);

  const addExpense = useCallback((description, amount, category) => {
    const newExpense = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString()
    };
    setExpenses(prev => [...prev, newExpense]);
  }, [setExpenses]);

  const addNote = useCallback((title, content) => {
    const newNote = {
      id: Date.now(),
      title,
      content,
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [...prev, newNote]);
  }, [setNotes]);

  const addMemory = useCallback((title, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newMemory = {
        id: Date.now(),
        title,
        photo: e.target.result,
        createdAt: new Date().toISOString()
      };
      setMemories(prev => [...prev, newMemory]);
    };
    reader.readAsDataURL(file);
  }, [setMemories]);

  const addLoan = useCallback((personName, amount, note) => {
    const newLoan = {
      id: Date.now(),
      personName,
      amount: parseFloat(amount),
      note,
      returned: false,
      dateGiven: new Date().toISOString()
    };
    setLoans(prev => [...prev, newLoan]);
  }, [setLoans]);

  const toggleLoanReturn = useCallback((id) => {
    setLoans(prev => prev.map(l => 
      l.id === id ? { 
        ...l, 
        returned: !l.returned, 
        dateReturned: !l.returned ? new Date().toISOString() : null 
      } : l
    ));
  }, [setLoans]);
  
  const addSleepSession = useCallback((duration, isAfternoon) => {
    const newSession = {
      id: Date.now(),
      duration: parseFloat(duration),
      isAfternoon,
      date: new Date().toISOString()
    };
    setSleepSessions(prev => [...prev, newSession]);
  }, [setSleepSessions]);
  
  const deleteItem = useCallback((type, id) => {
    const setters = {
      habit: setHabits,
      todo: setTodos,
      expense: setExpenses,
      note: setNotes,
      memory: setMemories,
      loan: setLoans,
      sleep: setSleepSessions
    };

    const setter = setters[type];
    if (setter) {
      setter(prev => prev.filter(item => item.id !== id));
    }
  }, [setHabits, setTodos, setExpenses, setNotes, setMemories, setLoans, setSleepSessions]);

  // Optimized chart data with useMemo
  const getChartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const habitsCompleted = habits.reduce((sum, h) => {
        return sum + (h.completedDates?.includes(dateStr) ? 1 : 0);
      }, 0);
      
      const todosCompleted = todos.filter(t => {
        const todoDate = new Date(t.createdAt).toDateString();
        return t.completed && todoDate === dateStr;
      }).length;

      const dayExpenses = expenses.filter(e => {
        return new Date(e.date).toDateString() === dateStr;
      }).reduce((sum, e) => sum + e.amount, 0);

      const daySleep = sleepSessions.filter(s => {
        return new Date(s.date).toDateString() === dateStr;
      }).reduce((sum, s) => sum + s.duration, 0);

      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Habits: habitsCompleted,
        Tasks: todosCompleted,
        Expenses: dayExpenses,
        Sleep: daySleep
      });
    }
    return last7Days;
  }, [habits, todos, expenses, sleepSessions]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-4">
          <header className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  Soumik's Lifestyle
                </h1>
                <p className="text-gray-600 mt-2">Track your life, one day at a time</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-4">
                <div className="bg-yellow-50 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Award className="text-yellow-500" size={24} />
                  <span className="text-xl font-bold text-yellow-700">{rewards} Points</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportData(allData)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 transition"
                    title="Export all data"
                  >
                    <Download size={18} />
                    Export
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition"
                    title="Import data"
                  >
                    <Upload size={18} />
                    Import
                  </button>
                </div>
              </div>
            </div>
          </header>

          {showImportModal && (
            <ImportModal
              onClose={() => setShowImportModal(false)}
              onImport={(file) => {
                importData(file, setAllData);
                setShowImportModal(false);
              }}
            />
          )}

          <nav className="bg-white rounded-lg shadow-md p-2 mb-6 flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'habits', label: 'Habits', icon: Target },
              { id: 'todos', label: 'To-Do', icon: Check },
              { id: 'sleep', label: 'Sleep', icon: Bed },
              { id: 'expenses', label: 'Expenses', icon: DollarSign },
              { id: 'loans', label: 'Money Lent', icon: Users },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'memories', label: 'Memories', icon: Camera }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'dashboard' && (
            <DashboardView
              habits={habits}
              todos={todos}
              loans={loans}
              sleepSessions={sleepSessions}
              completedTodosCount={completedTodosCount}
              pendingLoansAmount={pendingLoansAmount}
              todaySleep={todaySleep}
              getChartData={getChartData}
            />
          )}

          {activeTab === 'habits' && (
            <HabitTracker 
              habits={habits}
              onAdd={addHabit}
              onToggle={toggleHabit}
              onDelete={(id) => deleteItem('habit', id)}
            />
          )}

          {activeTab === 'todos' && (
            <TodoList
              todos={todos}
              onAdd={addTodo}
              onToggle={toggleTodo}
              onUploadPhoto={uploadTodoPhoto}
              onDelete={(id) => deleteItem('todo', id)}
            />
          )}
          
          {activeTab === 'sleep' && (
            <SleepTracker
              sleepSessions={sleepSessions}
              onAdd={addSleepSession}
              onDelete={(id) => deleteItem('sleep', id)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseTracker
              expenses={expenses}
              totalExpenses={totalExpenses}
              onAdd={addExpense}
              onDelete={(id) => deleteItem('expense', id)}
            />
          )}

          {activeTab === 'loans' && (
            <LoanTracker
              loans={loans}
              onAdd={addLoan}
              onToggle={toggleLoanReturn}
              onDelete={(id) => deleteItem('loan', id)}
            />
          )}

          {activeTab === 'notes' && (
            <NotesSection
              notes={notes}
              onAdd={addNote}
              onDelete={(id) => deleteItem('note', id)}
            />
          )}

          {activeTab === 'memories' && (
            <MemoriesSection
              memories={memories}
              onAdd={addMemory}
              onDelete={(id) => deleteItem('memory', id)}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Import Modal Component
function ImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Import Data</h3>
        <p className="text-gray-600 mb-4">
          Select a JSON file to import your data. This will replace all current data.
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border rounded-lg mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function DashboardView({ habits, todos, loans, sleepSessions, completedTodosCount, pendingLoansAmount, todaySleep, getChartData }) {
  const recentActivity = useMemo(() => {
    const today = new Date().toDateString();
    const completedHabits = habits
      .filter(h => h.completedDates?.includes(today))
      .slice(0, 3)
      .map(h => ({ type: 'habit', text: `Completed habit: ${h.name}` }));

    const completedTodos = todos
      .filter(t => t.completed)
      .slice(-3)
      .map(t => ({ type: 'todo', text: `Completed task: ${t.task}` }));

    return [...completedHabits, ...completedTodos].slice(0, 6);
  }, [habits, todos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Habits Tracked" value={habits.length} color="purple" />
        <StatCard title="Tasks Completed" value={completedTodosCount} color="blue" />
        <StatCard title="Today's Sleep" value={`${todaySleep.toFixed(1)} hrs`} color="teal" />
        <StatCard title="Money Lent Out" value={`$${pendingLoansAmount.toFixed(2)}`} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Last 7 Days Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Habits" fill="#9333ea" />
            <Bar dataKey="Tasks" fill="#3b82f6" />
            <Bar dataKey="Expenses" fill="#10b981" />
            <Bar dataKey="Sleep" fill="#14b8a6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentActivity.map((activity, index) => (
            <div key={index} className={`flex items-center gap-2 ${
              activity.type === 'habit' ? 'text-green-600' : 'text-blue-600'
            }`}>
              <Check size={16} />
              <span>{activity.text}</span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colors = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg shadow-md p-6 text-white`}>
      <h3 className="text-sm opacity-90">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function HabitTracker({ habits, onAdd, onToggle, onDelete }) {
  const [newHabit, setNewHabit] = useState('');

  const handleAdd = () => {
    if (newHabit.trim()) {
      onAdd(newHabit);
      setNewHabit('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Habit Tracker</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add new habit..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button onClick={handleAdd} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition">
          <Plus size={20} /> Add
        </button>
      </div>

      <div className="space-y-3">
        {habits.map(habit => {
          const today = new Date().toDateString();
          const isCompletedToday = habit.completedDates?.includes(today);
          return (
            <div key={habit.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <button
                onClick={() => onToggle(habit.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                  isCompletedToday ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                {isCompletedToday && <Check className="text-white" size={20} />}
              </button>
              <span className="flex-1 font-medium">{habit.name}</span>
              <span className="text-sm text-gray-500">
                {habit.completedDates?.length || 0} days
              </span>
              <button onClick={() => onDelete(habit.id)} className="text-red-500 hover:text-red-700 transition">
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
        {habits.length === 0 && (
          <p className="text-gray-500 text-center py-8">No habits yet. Add your first habit above!</p>
        )}
      </div>
    </div>
  );
}

function TodoList({ todos, onAdd, onToggle, onUploadPhoto, onDelete }) {
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = () => {
    if (newTodo.trim()) {
      onAdd(newTodo);
      setNewTodo('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">To-Do List</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add new task..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition">
          <Plus size={20} /> Add
        </button>
      </div>

      <div className="space-y-3">
        {todos.map(todo => (
          <div key={todo.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggle(todo.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                  todo.completed ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                {todo.completed && <Check className="text-white" size={20} />}
              </button>
              <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                {todo.task}
              </span>
              <label className="cursor-pointer text-blue-600 hover:text-blue-700 transition">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && onUploadPhoto(todo.id, e.target.files[0])}
                />
              </label>
              <button onClick={() => onDelete(todo.id)} className="text-red-500 hover:text-red-700 transition">
                <Trash2 size={18} />
              </button>
            </div>
            {todo.photo && (
              <img src={todo.photo} alt="Proof" className="mt-3 rounded-lg max-w-xs border" />
            )}
          </div>
        ))}
        {todos.length === 0 && (
          <p className="text-gray-500 text-center py-8">No tasks yet. Add your first task above!</p>
        )}
      </div>
    </div>
  );
}

function ExpenseTracker({ expenses, totalExpenses, onAdd, onDelete }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const handleAdd = () => {
    if (description.trim() && amount) {
      onAdd(description, amount, category);
      setDescription('');
      setAmount('');
    }
  };

  const categoryTotals = useMemo(() => {
    const totals = {};
    expenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });
    return totals;
  }, [expenses]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Expense Tracker</h2>
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-gray-600">Total Expenses</p>
        <p className="text-3xl font-bold text-green-600">${totalExpenses.toFixed(2)}</p>
      </div>

      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Entertainment</option>
            <option>Other</option>
          </select>
        </div>
        <button onClick={handleAdd} className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition">
          <Plus size={20} /> Add Expense
        </button>
      </div>

      {Object.keys(categoryTotals).length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-3">Spending by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">{category}</p>
                <p className="font-bold text-blue-600">${total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-bold mb-2">Expense History</h3>
        {expenses.slice().reverse().map(expense => (
          <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex-1">
              <p className="font-medium">{expense.description}</p>
              <p className="text-sm text-gray-500">{expense.category}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-red-600">${expense.amount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
            </div>
            <button onClick={() => onDelete(expense.id)} className="text-red-500 hover:text-red-700 transition ml-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
        )}
      </div>
    </div>
  );
}

function LoanTracker({ loans, onAdd, onToggle, onDelete }) {
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = () => {
    if (personName.trim() && amount) {
      onAdd(personName, amount, note);
      setPersonName('');
      setAmount('');
      setNote('');
    }
  };

  const totalLent = useMemo(() => loans.reduce((sum, l) => sum + l.amount, 0), [loans]);
  const totalReturned = useMemo(() => loans.filter(l => l.returned).reduce((sum, l) => sum + l.amount, 0), [loans]);
  const pendingAmount = totalLent - totalReturned;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Money Lent Tracker</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Lent</p>
          <p className="text-2xl font-bold text-blue-600">${totalLent.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Returned</p>
          <p className="text-2xl font-bold text-green-600">${totalReturned.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2">Add New Loan</h3>
        <input
          type="text"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="Person's name..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount lent"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
        />
        <button 
          onClick={handleAdd} 
          className="w-full bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 transition"
        >
          <Plus size={20} /> Add Loan Record
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold mb-2">Loan History</h3>
        {loans.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No loans recorded yet</p>
        ) : (
          loans.slice().reverse().map(loan => (
            <div key={loan.id} className={`p-4 rounded-lg border-l-4 ${
              loan.returned ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <span className="font-bold">{loan.personName}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      loan.returned ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
                    }`}>
                      {loan.returned ? 'Returned' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold my-1">${loan.amount.toFixed(2)}</p>
                  {loan.note && <p className="text-gray-600 text-sm">{loan.note}</p>}
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Lent: {new Date(loan.dateGiven).toLocaleDateString()}</p>
                    {loan.returned && loan.dateReturned && (
                      <p>Returned: {new Date(loan.dateReturned).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggle(loan.id)}
                    className={`px-3 py-1 rounded text-sm transition ${
                      loan.returned 
                        ? 'bg-gray-500 hover:bg-gray-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {loan.returned ? 'Mark Pending' : 'Mark Returned'}
                  </button>
                  <button 
                    onClick={() => onDelete(loan.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesSection({ notes, onAdd, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (title.trim() && content.trim()) {
      onAdd(title, content);
      setTitle('');
      setContent('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Notes</h2>
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Note content..."
          rows="4"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
        />
        <button onClick={handleAdd} className="w-full bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2 transition">
          <Plus size={20} /> Add Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.slice().reverse().map(note => (
          <div key={note.id} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 hover:bg-yellow-100 transition">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg">{note.title}</h3>
              <button onClick={() => onDelete(note.id)} className="text-red-500 hover:text-red-700 transition">
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-gray-500 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No notes yet. Add your first note above!
          </div>
        )}
      </div>
    </div>
  );
}

function MemoriesSection({ memories, onAdd, onDelete }) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleAdd = () => {
    if (title.trim() && selectedFile) {
      onAdd(title, selectedFile);
      setTitle('');
      setSelectedFile(null);
      // Reset file input
      document.getElementById('memory-file').value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">My Memories</h2>
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Memory title..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
        />
        <input
          id="memory-file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <button onClick={handleAdd} className="w-full bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 flex items-center justify-center gap-2 transition">
          <Plus size={20} /> Add Memory
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {memories.slice().reverse().map(memory => (
          <div key={memory.id} className="relative group">
            <img 
              src={memory.photo} 
              alt={memory.title} 
              className="w-full h-64 object-cover rounded-lg transition group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center rounded-lg">
              <button
                onClick={() => onDelete(memory.id)}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <p className="mt-2 font-medium">{memory.title}</p>
            <p className="text-xs text-gray-500">{new Date(memory.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No memories yet. Add your first memory above!
          </div>
        )}
      </div>
    </div>
  );
}

function SleepTracker({ sleepSessions, onAdd, onDelete }) {
  const [duration, setDuration] = useState('');
  const [isAfternoon, setIsAfternoon] = useState(false);

  const handleAdd = () => {
    if (duration) {
      onAdd(duration, isAfternoon);
      setDuration('');
      setIsAfternoon(false);
    }
  };

  // Calculate stats for today
  const todayStr = new Date().toDateString();
  const todaySessions = sleepSessions.filter(s => new Date(s.date).toDateString() === todayStr);
  
  const totalTodaySleep = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalTodayAfternoonSleep = todaySessions
    .filter(s => s.isAfternoon)
    .reduce((sum, s) => sum + s.duration, 0);

  // Process data for the sleep history chart, optimized with useMemo
  const sleepChartData = useMemo(() => {
    // Group sessions by date
    const sessionsByDate = sleepSessions.reduce((acc, session) => {
      const dateStr = new Date(session.date).toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(session);
      return acc;
    }, {});

    // Sum durations for each date
    const chartData = Object.keys(sessionsByDate).map(dateStr => {
      const sessions = sessionsByDate[dateStr];
      
      const afternoonSleep = sessions
        .filter(s => s.isAfternoon)
        .reduce((sum, s) => sum + s.duration, 0);
        
      const nightSleep = sessions
        .filter(s => !s.isAfternoon)
        .reduce((sum, s) => sum + s.duration, 0);

      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        nightSleep: nightSleep,
        afternoonSleep: afternoonSleep,
      };
    });

    // Sort by date to ensure the chart is chronological
    return chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

  }, [sleepSessions]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Sleep Tracker</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Sleep Today</p>
            <p className="text-2xl font-bold text-blue-600">{totalTodaySleep.toFixed(1)} hours</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Afternoon Sleep Today</p>
            <p className="text-2xl font-bold text-yellow-700">{totalTodayAfternoonSleep.toFixed(1)} hours</p>
          </div>
        </div>

        {/* Add Sleep Form */}
        <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Log New Sleep Session</h3>
          <input
            type="number"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration in hours (e.g., 7.5)"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAfternoon"
              checked={isAfternoon}
              onChange={(e) => setIsAfternoon(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isAfternoon" className="text-gray-700">
              Was this an afternoon nap?
            </label>
          </div>
          <button 
            onClick={handleAdd} 
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition"
          >
            <Plus size={20} /> Add Sleep
          </button>
        </div>
      </div>

      {/* Sleep Chart */}
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-4">Sleep Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sleepChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="nightSleep" stackId="a" name="Night Sleep" fill="#3b82f6" />
            <Bar dataKey="afternoonSleep" stackId="a" name="Afternoon Sleep" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep History */}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Sleep History (Recent First)</h3>
        {sleepSessions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No sleep sessions recorded yet</p>
        ) : (
          <div className="space-y-3">
            {sleepSessions.slice().reverse().map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex-1">
                  <p className="font-medium">{session.duration.toFixed(1)} hours</p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  {session.isAfternoon && (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-200 text-yellow-800">
                      Afternoon
                    </span>
                  )}
                </div>
                <button onClick={() => onDelete(session.id)} className="text-red-500 hover:text-red-700 transition ml-4">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}