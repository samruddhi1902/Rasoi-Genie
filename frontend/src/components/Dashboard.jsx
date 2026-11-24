import { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Loader2,
  RefreshCw,
  Shuffle,
  Lock,
  Unlock,
  Settings,
  Sparkles,
  Printer,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  Calendar,
  ShoppingCart,
  BookOpen,
  X,
  AlertCircle,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';
import {
  DAYS,
  MEAL_META,
  DIET_LABELS,
  TIME_LABELS,
  sortMeals,
  prettyCuisine,
  menuToText,
  store,
} from '../utils/menuMeta';
import RecipeModal from './RecipeModal';
import GroceryList from './GroceryList';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function DashboardPage({ onNavigate, user, onLogout }) {
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [swapping, setSwapping] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('menu');
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(todayName) ? todayName : DAYS[0]);
  const [servings, setServings] = useState(() => store.get('rg_servings', 4));
  const [notes, setNotes] = useState(() => store.get('rg_notes', ''));
  const [showNotes, setShowNotes] = useState(false);
  const [locks, setLocks] = useState(() => store.get('rg_locks', {}));
  const [recipeDish, setRecipeDish] = useState(null);
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
            const prefs = await apiService.getPreferences(token);
            setHasPreferences(!!prefs);
            setPreferences(prefs);
          } catch (err) {
            setHasPreferences(false);
          }
          try {
            setCurrentMenu(await apiService.getCurrentMenu(token));
          } catch (err) {
            // no menu yet
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    authUtils.clearAuth();
    onLogout();
    onNavigate('landing');
  };

  const changeServings = (delta) => {
    const next = Math.max(1, Math.min(12, servings + delta));
    setServings(next);
    store.set('rg_servings', next);
  };

  const changeNotes = (value) => {
    setNotes(value);
    store.set('rg_notes', value);
  };

  const lockKey = (day, meal) => `${day}|${meal}`;

  const toggleLock = (day, meal) => {
    setLocks((prev) => {
      const next = { ...prev, [lockKey(day, meal)]: !prev[lockKey(day, meal)] };
      store.set('rg_locks', next);
      return next;
    });
  };

  const buildLocked = () => {
    const out = {};
    if (!currentMenu) return out;
    Object.keys(locks).forEach((k) => {
      if (!locks[k]) return;
      const [day, meal] = k.split('|');
      const dish = currentMenu.menu?.[day]?.[meal];
      if (dish) {
        out[day] = out[day] || {};
        out[day][meal] = dish;
      }
    });
    return out;
  };

  const lockedCount = currentMenu
    ? Object.keys(locks).filter((k) => {
        if (!locks[k]) return false;
        const [day, meal] = k.split('|');
        return !!currentMenu.menu?.[day]?.[meal];
      }).length
    : 0;

  const handleGenerateMenu = async () => {
    if (!hasPreferences) {
      onNavigate('preferences');
      return;
    }
    setMenuLoading(true);
    try {
      const token = authUtils.getToken();
      const locked = buildLocked();
      const menuData = await apiService.generateMenu(token, {
        notes: notes.trim() || null,
        locked: Object.keys(locked).length ? locked : null,
      });
      setCurrentMenu(menuData);
      setTab('menu');
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
    setSwapping(`${day}|${meal}`);
    try {
      const updated = await apiService.regenerateMeal(authUtils.getToken(), currentMenu.menu_id, day, meal);
      setCurrentMenu(updated);
    } catch (err) {
      console.error('Failed to swap dish:', err);
      showToast('error', 'Could not swap that dish. Please try again.');
    } finally {
      setSwapping(null);
    }
  };

  const copyMenu = async () => {
    try {
      await navigator.clipboard.writeText(menuToText(currentMenu.menu));
      showToast('success', 'Menu copied.');
    } catch (e) {
      showToast('error', 'Could not copy. Try WhatsApp or Print instead.');
    }
  };

  const shareMenu = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(menuToText(currentMenu.menu))}`,
      '_blank',
      'noopener'
    );
  };

  const dietSummary = () =>
    (preferences?.diet_type || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => DIET_LABELS[d] || d)
      .join(' + ');

  const cuisines = (preferences?.cuisine || []).filter(Boolean);
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-forest-700 animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading your kitchen...</p>
        </div>
      </div>
    );
  }

  const dayMeals = currentMenu?.menu?.[selectedDay] || {};
  const todayMeals = currentMenu?.menu?.[todayName] || null;
  const printMeals = currentMenu ? sortMeals(Object.keys(currentMenu.menu[DAYS[0]] || {})) : [];

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Header */}
      <header className="bg-cream/90 backdrop-blur border-b border-line sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-forest-700" />
            <span className="font-display text-xl sm:text-2xl font-semibold text-forest-800">Rasoi Genie</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted">Signed in as {user}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm font-medium text-forest-800 px-3 py-2 rounded-lg hover:bg-forest-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md print:hidden">
          <div
            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-lg border ${
              toast.type === 'success'
                ? 'bg-forest-50 border-forest-200 text-forest-900'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span className="text-sm font-medium">{toast.text}</span>
            <button onClick={() => setToast(null)} aria-label="Dismiss message">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero */}
        <section
          className="rounded-3xl overflow-hidden text-white p-6 sm:p-10 mb-6 print:hidden"
          style={{
            backgroundColor: '#1F4A2F',
            backgroundImage:
              'radial-gradient(circle at 12% 15%, rgba(217,131,36,0.40), transparent 45%), radial-gradient(circle at 90% 80%, rgba(60,122,83,0.7), transparent 50%)',
          }}
        >
          <p className="text-sm text-white/75">{greeting()}</p>
          <h1 className="font-display text-3xl sm:text-5xl mt-1">
            {user}, here is your week.
          </h1>
          {hasPreferences && (
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {dietSummary() && (
                <span className="text-xs sm:text-sm bg-white/15 rounded-full px-3 py-1.5">{dietSummary()}</span>
              )}
              {cuisines.length > 0 && (
                <span className="text-xs sm:text-sm bg-white/15 rounded-full px-3 py-1.5">
                  {cuisines.map(prettyCuisine).join(', ')}
                </span>
              )}
              {TIME_LABELS[preferences?.cooking_time] && (
                <span className="text-xs sm:text-sm bg-white/15 rounded-full px-3 py-1.5">
                  {TIME_LABELS[preferences.cooking_time]}
                </span>
              )}
              <button
                onClick={() => onNavigate('preferences', { isUpdate: true })}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm underline underline-offset-4 text-white/90 hover:text-white ml-1"
              >
                <Settings className="h-3.5 w-3.5" />
                Edit preferences
              </button>
            </div>
          )}
        </section>

        {/* No preferences yet */}
        {!hasPreferences && (
          <section className="bg-[#FDFBF6] border border-line rounded-2xl p-8 text-center mb-6 print:hidden">
            <AlertCircle className="h-10 w-10 text-saffron mx-auto mb-3" />
            <h2 className="font-display text-2xl">Let's set up your kitchen first</h2>
            <p className="text-muted mt-2 mb-6">Tell us what your family eats and we will plan the week.</p>
            <button
              onClick={() => onNavigate('preferences')}
              className="px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold hover:bg-forest-800"
            >
              Set up preferences
            </button>
          </section>
        )}

        {hasPreferences && (
          <>
            {/* Today */}
            {todayMeals && (
              <section className="mb-6 print:hidden">
                <h2 className="font-display text-2xl mb-3">Today, {todayName}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {sortMeals(Object.keys(todayMeals)).map((meal) => {
                    const meta = MEAL_META[meal] || { label: meal, emoji: '🍽️', chip: 'bg-gray-50 text-gray-800 border-gray-200' };
                    return (
                      <button
                        key={meal}
                        onClick={() => setRecipeDish(todayMeals[meal])}
                        className="text-left bg-[#FDFBF6] border border-line rounded-2xl p-4 hover:border-forest-500 hover:shadow-sm"
                      >
                        <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-1 ${meta.chip}`}>
                          {meta.emoji} {meta.label}
                        </span>
                        <p className="font-display text-lg leading-snug mt-3">{todayMeals[meal]}</p>
                        <p className="text-xs text-forest-700 font-medium mt-2 inline-flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> View recipe
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Controls */}
            <section className="bg-[#FDFBF6] border border-line rounded-2xl p-5 sm:p-6 mb-6 print:hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-muted uppercase mb-1">Cooking for</p>
                    <div className="inline-flex items-center border border-line rounded-xl bg-white">
                      <button
                        onClick={() => changeServings(-1)}
                        className="p-2.5 hover:bg-cream-dark rounded-l-xl"
                        aria-label="Fewer people"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 font-semibold min-w-[5.5rem] text-center">
                        {servings} {servings === 1 ? 'person' : 'people'}
                      </span>
                      <button
                        onClick={() => changeServings(1)}
                        className="p-2.5 hover:bg-cream-dark rounded-r-xl"
                        aria-label="More people"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-forest-800 hover:text-forest-900 mt-5"
                  >
                    <ChevronDown className={`h-4 w-4 ${showNotes ? 'rotate-180' : ''}`} />
                    {notes.trim() ? 'Special instructions (added)' : 'Add special instructions'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {lockedCount > 0 && (
                    <span className="text-sm text-muted inline-flex items-center gap-1.5">
                      <Lock className="h-4 w-4" />
                      {lockedCount} dish{lockedCount === 1 ? '' : 'es'} locked and kept
                    </span>
                  )}
                  <button
                    onClick={handleGenerateMenu}
                    disabled={menuLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold hover:bg-forest-800 disabled:opacity-60"
                  >
                    {menuLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : currentMenu ? (
                      <RefreshCw className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    <span>{menuLoading ? 'Planning...' : currentMenu ? 'Plan a new week' : 'Plan my week'}</span>
                  </button>
                </div>
              </div>

              {showNotes && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2" htmlFor="notes">
                    Anything we should keep in mind?
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    maxLength={300}
                    value={notes}
                    onChange={(e) => changeNotes(e.target.value)}
                    placeholder="For example: no onion or garlic, peanut allergy, guests on Saturday, more protein"
                    className="w-full bg-white border border-line rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                  <p className="text-xs text-muted mt-1">Used the next time you plan a week.</p>
                </div>
              )}

              {menuLoading && (
                <div className="mt-4 rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 text-sm text-forest-900">
                  Planning your week. This usually takes under a minute, and a little longer if the server has been idle.
                </div>
              )}
            </section>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 print:hidden">
              {[
                ['menu', 'This week', Calendar],
                ['grocery', 'Grocery list', ShoppingCart],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm ${
                    tab === id
                      ? 'bg-forest-700 text-white'
                      : 'bg-white border border-line text-forest-800 hover:bg-cream-dark'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {!currentMenu && (
              <section className="bg-[#FDFBF6] border border-line rounded-2xl p-12 text-center print:hidden">
                <Calendar className="h-12 w-12 text-forest-200 mx-auto mb-3" />
                <h2 className="font-display text-2xl">No menu yet</h2>
                <p className="text-muted mt-2">Press "Plan my week" and we will build one in under a minute.</p>
              </section>
            )}

            {/* Menu tab */}
            {currentMenu && tab === 'menu' && (
              <>
                <section className="print:hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <p className="text-sm text-muted">
                      Planned {formatDate(currentMenu.generated_at)}. Tap a dish for its recipe, the arrows to swap it,
                      or the lock to keep it next time.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={shareMenu}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest-700 text-white text-sm font-medium hover:bg-forest-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </button>
                      <button
                        onClick={copyMenu}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-white text-sm font-medium hover:bg-cream-dark"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-white text-sm font-medium hover:bg-cream-dark"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Day pills */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border ${
                          selectedDay === day
                            ? 'bg-forest-700 text-white border-forest-700'
                            : 'bg-white text-forest-800 border-line hover:border-forest-500'
                        }`}
                      >
                        {day.slice(0, 3)}
                        {day === todayName && (
                          <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${selectedDay === day ? 'bg-white' : 'bg-saffron'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Selected day */}
                  <div className="bg-[#FDFBF6] border border-line rounded-2xl p-4 sm:p-6">
                    <h2 className="font-display text-2xl sm:text-3xl mb-4">
                      {selectedDay}
                      {selectedDay === todayName && (
                        <span className="ml-3 align-middle text-xs font-sans font-semibold bg-saffron/15 text-saffron rounded-full px-2.5 py-1">
                          Today
                        </span>
                      )}
                    </h2>
                    <div className="space-y-3">
                      {sortMeals(Object.keys(dayMeals)).map((meal) => {
                        const meta = MEAL_META[meal] || { label: meal, emoji: '🍽️', chip: 'bg-gray-50 text-gray-800 border-gray-200' };
                        const key = lockKey(selectedDay, meal);
                        const isLocked = !!locks[key];
                        const isSwapping = swapping === key;
                        return (
                          <div
                            key={meal}
                            className="bg-white border border-line rounded-2xl p-4 flex items-center justify-between gap-3"
                          >
                            <button
                              onClick={() => setRecipeDish(dayMeals[meal])}
                              className="text-left min-w-0 flex-1"
                            >
                              <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-1 ${meta.chip}`}>
                                {meta.emoji} {meta.label}
                              </span>
                              <p className="font-display text-xl leading-snug mt-2 break-words">{dayMeals[meal]}</p>
                              <p className="text-xs text-forest-700 font-medium mt-1 inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" /> Recipe
                              </p>
                            </button>
                            <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                              <button
                                onClick={() => toggleLock(selectedDay, meal)}
                                title={isLocked ? 'Locked: kept when you plan a new week' : 'Lock this dish'}
                                aria-label={isLocked ? 'Unlock dish' : 'Lock dish'}
                                aria-pressed={isLocked}
                                className={`p-2.5 rounded-xl border ${
                                  isLocked
                                    ? 'bg-forest-700 text-white border-forest-700'
                                    : 'bg-white text-gray-500 border-line hover:text-forest-700'
                                }`}
                              >
                                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleSwapDish(selectedDay, meal)}
                                disabled={swapping !== null || menuLoading || isLocked}
                                title={isLocked ? 'Unlock to swap' : 'Swap this dish'}
                                aria-label="Swap dish"
                                className="p-2.5 rounded-xl border border-line bg-white text-gray-500 hover:text-forest-700 disabled:opacity-40"
                              >
                                {isSwapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Print-only full week */}
                <section className="hidden print:block">
                  <h1 className="font-display text-3xl mb-4">My weekly menu</h1>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-400 p-2 text-left">Day</th>
                        {printMeals.map((meal) => (
                          <th key={meal} className="border border-gray-400 p-2 text-left">
                            {MEAL_META[meal]?.label || meal}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day) => (
                        <tr key={day}>
                          <td className="border border-gray-400 p-2 font-semibold">{day}</td>
                          {printMeals.map((meal) => (
                            <td key={meal} className="border border-gray-400 p-2">
                              {currentMenu.menu[day]?.[meal] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </>
            )}

            {/* Grocery tab */}
            {currentMenu && tab === 'grocery' && (
              <GroceryList menu={currentMenu} servings={servings} onToast={showToast} />
            )}
          </>
        )}
      </main>

      {recipeDish && (
        <RecipeModal dish={recipeDish} servings={servings} onClose={() => setRecipeDish(null)} />
      )}
    </div>
  );
}

export default DashboardPage;
