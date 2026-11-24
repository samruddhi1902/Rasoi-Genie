import { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Calendar,
  CheckCircle,
  Loader2,
  Settings,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Shuffle,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];
const MEAL_META = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  lunch: { label: 'Lunch', emoji: '☀️' },
  snacks: { label: 'Snacks', emoji: '🍿' },
  dinner: { label: 'Dinner', emoji: '🌙' }
};

const DIET_LABELS = { veg: 'Vegetarian', 'non-veg': 'Non-veg', vegan: 'Vegan' };

const sortMeals = (meals) =>
  [...meals].sort((a, b) => {
    const ia = MEAL_ORDER.indexOf(a);
    const ib = MEAL_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

function DashboardPage({ onNavigate, user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [menuHistory, setMenuHistory] = useState([]);
  const [swapping, setSwapping] = useState(null); // "Day-meal" being swapped
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text }
  const toastTimer = useRef(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = authUtils.getToken();
        if (token) {
          try {
            const preferencesData = await apiService.getPreferences(token);
            setHasPreferences(!!preferencesData);
            setPreferences(preferencesData);
          } catch (err) {
            setHasPreferences(false);
          }

          try {
            setCurrentMenu(await apiService.getCurrentMenu(token));
          } catch (err) {
            console.log('No current menu found');
          }

          try {
            setMenuHistory(await apiService.getMenuHistory(token));
          } catch (err) {
            console.log('Failed to fetch menu history');
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => clearTimeout(toastTimer.current);
  }, []);

  const handleLogout = () => {
    authUtils.clearAuth();
    onLogout();
    onNavigate('landing');
  };

  const handleGenerateMenu = async () => {
    if (!hasPreferences) {
      onNavigate('preferences');
      return;
    }

    setMenuLoading(true);
    try {
      const token = authUtils.getToken();
      const menuData = await apiService.generateMenu(token);
      setCurrentMenu(menuData);
      setMenuHistory(await apiService.getMenuHistory(token));
      showToast('success', 'Your new weekly menu is ready!');
    } catch (err) {
      console.error('Failed to generate menu:', err);
      showToast('error', 'Could not generate the menu. Please try again in a moment.');
    } finally {
      setMenuLoading(false);
    }
  };

  const handleSwapDish = async (day, meal) => {
    if (!currentMenu?.menu_id) return;
    const key = `${day}-${meal}`;
    setSwapping(key);
    try {
      const token = authUtils.getToken();
      const updated = await apiService.regenerateMeal(token, currentMenu.menu_id, day, meal);
      setCurrentMenu(updated);
    } catch (err) {
      console.error('Failed to swap dish:', err);
      showToast('error', 'Could not swap that dish. Please try again.');
    } finally {
      setSwapping(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const dietSummary = () => {
    if (!preferences?.diet_type) return 'Not set';
    return preferences.diet_type
      .split(',')
      .map((d) => DIET_LABELS[d.trim()] || d.trim())
      .join(' + ');
  };

  const cuisineSummary = () => {
    const list = preferences?.cuisine || [];
    if (list.length === 0) return 'Not set';
    return list
      .map((c) => c.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()))
      .join(', ');
  };

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-7 w-7 text-orange-600" />
              <span className="text-xl sm:text-2xl font-bold text-gray-800">Rasoi Genie</span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="hidden sm:inline text-gray-600">Hi, {user}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md">
          <div
            className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg border ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span className="text-sm font-medium">{toast.text}</span>
            <button onClick={() => setToast(null)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome + summary */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Welcome back, {user}!</h1>
            <p className="text-lg text-gray-600 mt-1">Here is your plan for the week.</p>
          </div>

          {/* Preferences summary bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {hasPreferences ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Diet:</span> {dietSummary()}
                  </p>
                  <p>
                    <span className="font-semibold">Cuisines:</span> {cuisineSummary()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                <span className="text-sm font-medium text-yellow-800">
                  Set up your preferences to get your first menu.
                </span>
              </div>
            )}
            <button
              onClick={() => onNavigate('preferences', { isUpdate: hasPreferences })}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              <Settings className="h-4 w-4" />
              <span>{hasPreferences ? 'Edit preferences' : 'Set up preferences'}</span>
            </button>
          </div>

          {/* Menu section */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentMenu ? 'Your weekly menu' : 'No menu yet'}
                </h2>
                {currentMenu && (
                  <p className="text-sm text-gray-500 mt-1">
                    Generated {formatDate(currentMenu.generated_at)}. Tap the{' '}
                    <Shuffle className="inline h-3 w-3" /> icon next to a dish to swap it.
                  </p>
                )}
              </div>
              <button
                onClick={handleGenerateMenu}
                disabled={menuLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-60"
              >
                {menuLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : currentMenu ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>
                  {menuLoading ? 'Generating...' : currentMenu ? 'New menu' : 'Generate my menu'}
                </span>
              </button>
            </div>

            {menuLoading && (
              <div className="mb-5 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
                Creating your menu. This usually takes under a minute, and a bit longer if the
                server has been idle.
              </div>
            )}

            {!currentMenu && !menuLoading && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>
                  {hasPreferences
                    ? 'Press "Generate my menu" to get your personalised week.'
                    : 'Set your preferences first, then generate your menu.'}
                </p>
              </div>
            )}

            {currentMenu && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DAYS.map((day) => {
                  const dayMeals = currentMenu.menu[day] || {};
                  const isToday = day === todayName;
                  return (
                    <div
                      key={day}
                      className={`rounded-xl p-4 border ${
                        isToday ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">{day}</h3>
                        {isToday && (
                          <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {sortMeals(Object.keys(dayMeals)).map((meal) => {
                          const meta = MEAL_META[meal] || { label: meal, emoji: '🍽️' };
                          const key = `${day}-${meal}`;
                          return (
                            <div key={meal} className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-wide text-gray-500">
                                  {meta.emoji} {meta.label}
                                </p>
                                <p className="text-gray-800 font-medium leading-snug break-words">
                                  {dayMeals[meal]}
                                </p>
                              </div>
                              <button
                                onClick={() => handleSwapDish(day, meal)}
                                disabled={swapping !== null || menuLoading}
                                title="Swap this dish"
                                aria-label={`Swap ${meta.label} on ${day}`}
                                className="mt-1 p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-white disabled:opacity-40 shrink-0"
                              >
                                {swapping === key ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Shuffle className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menu history */}
          {menuHistory.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Recent menus</h2>
              <div className="space-y-2">
                {menuHistory.slice(0, 3).map((menu) => (
                  <div
                    key={menu.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-800">{formatDate(menu.generated_at)}</span>
                    </div>
                    {menu.is_active && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
