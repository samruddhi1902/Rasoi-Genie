import { useState, useEffect } from 'react';
import { ChefHat, Loader2, CheckCircle, ArrowLeft, Check } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const categories = [
  {
    id: 'diet',
    title: 'What does your family eat?',
    hint: 'Pick one or more. We will mix them sensibly across your week.',
    multi: true,
    required: true,
    options: [
      { id: 'veg', label: 'Vegetarian', emoji: '🥬' },
      { id: 'non-veg', label: 'Non-vegetarian', emoji: '🍗' },
      { id: 'vegan', label: 'Vegan', emoji: '🌱' },
    ],
  },
  {
    id: 'cuisine',
    title: 'Which cuisines do you love?',
    hint: 'Choose as many as you like.',
    multi: true,
    required: true,
    options: [
      { id: 'north-indian', label: 'North Indian', emoji: '🫓' },
      { id: 'south-indian', label: 'South Indian', emoji: '🍛' },
      { id: 'marathi', label: 'Marathi', emoji: '🥘' },
      { id: 'bengali', label: 'Bengali', emoji: '🍚' },
      { id: 'gujarati', label: 'Gujarati', emoji: '🥞' },
      { id: 'punjabi', label: 'Punjabi', emoji: '🧈' },
      { id: 'rajasthani', label: 'Rajasthani', emoji: '🌶️' },
      { id: 'chinese', label: 'Indo-Chinese', emoji: '🥢' },
    ],
  },
  {
    id: 'meals',
    title: 'Which meals should we plan?',
    hint: 'Pick the meals you cook at home.',
    multi: true,
    required: true,
    options: [
      { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
      { id: 'lunch', label: 'Lunch', emoji: '☀️' },
      { id: 'snacks', label: 'Snacks', emoji: '🍿' },
      { id: 'dinner', label: 'Dinner', emoji: '🌙' },
    ],
  },
  {
    id: 'time',
    title: 'How long can a dish take?',
    hint: 'Choose your usual cooking time.',
    multi: false,
    required: true,
    options: [
      { id: 'quick', label: 'Under 15 minutes', emoji: '⚡', value: '<15min' },
      { id: 'medium', label: 'Under 30 minutes', emoji: '⏰', value: '<30min' },
      { id: 'slow', label: 'Under 45 minutes', emoji: '🕐', value: '<45min' },
    ],
  },
  {
    id: 'health',
    title: 'Any health considerations?',
    hint: 'Optional. We will shape the menu around them.',
    multi: true,
    required: false,
    options: [
      { id: 'diabetes', label: 'Diabetes friendly', emoji: '🩺' },
      { id: 'bp', label: 'Blood pressure', emoji: '❤️' },
      { id: 'cholesterol', label: 'Cholesterol', emoji: '💚' },
    ],
  },
];

const PreferencesPage = ({ onNavigate, user, isUpdate = false }) => {
  const [selected, setSelected] = useState({ diet: [], cuisine: [], meals: [], time: [], health: [] });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isUpdate);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!isUpdate) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const prefs = await response.json();
          const timeOpt = categories
            .find((c) => c.id === 'time')
            .options.find((o) => o.value === prefs.cooking_time);
          setSelected({
            diet: prefs.diet_type ? prefs.diet_type.split(',').map((d) => d.trim()).filter(Boolean) : [],
            cuisine: prefs.cuisine || [],
            meals: prefs.meals || [],
            time: timeOpt ? [timeOpt.id] : [],
            health: (prefs.health_conditions || []).filter(Boolean),
          });
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [isUpdate]);

  const current = categories[step];
  const isLast = step === categories.length - 1;
  const canContinue = !current.required || selected[current.id].length > 0;
  const allRequiredDone = categories
    .filter((c) => c.required)
    .every((c) => selected[c.id].length > 0);

  const toggle = (category, optionId) => {
    setSelected((prev) => {
      const list = prev[category.id];
      if (!category.multi) return { ...prev, [category.id]: [optionId] };
      return {
        ...prev,
        [category.id]: list.includes(optionId) ? list.filter((id) => id !== optionId) : [...list, optionId],
      };
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const timeCat = categories.find((c) => c.id === 'time');
      const preferences = {
        diet_type: selected.diet.join(','),
        cuisine: selected.cuisine,
        meals: selected.meals,
        cooking_time: timeCat.options.find((o) => o.id === selected.time[0])?.value || '',
        health_conditions: selected.health,
      };

      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) throw new Error('Failed to save preferences');

      onNavigate('dashboard');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-forest-700 animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="max-w-3xl mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isUpdate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-full border border-line bg-white hover:bg-cream-dark"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-forest-800" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-forest-700" />
            <span className="font-display text-xl font-semibold text-forest-800">Rasoi Genie</span>
          </div>
        </div>
        {user && <span className="text-sm text-muted hidden sm:inline">Hi, {user}</span>}
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted mb-2">
            <span>
              Step {step + 1} of {categories.length}
            </span>
            <span>{isUpdate ? 'Update preferences' : 'Set up your kitchen'}</span>
          </div>
          <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-forest-700 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / categories.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-[#FDFBF6] border border-line rounded-2xl shadow-sm p-6 sm:p-10">
          <h1 className="font-display text-3xl sm:text-4xl">{current.title}</h1>
          <p className="text-muted mt-2 mb-8">{current.hint}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {current.options.map((option) => {
              const isOn = selected[current.id].includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggle(current, option.id)}
                  aria-pressed={isOn}
                  className={`relative text-left rounded-2xl border-2 p-4 sm:p-5 ${
                    isOn
                      ? 'border-forest-700 bg-forest-50'
                      : 'border-line bg-white hover:border-forest-200'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="font-semibold">{option.label}</div>
                  {isOn && (
                    <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-forest-700 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between mt-10">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="px-6 py-3 rounded-xl font-semibold border border-line bg-white hover:bg-cream-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={saving || !allRequiredDone}
                className="px-8 py-3 rounded-xl font-semibold bg-forest-700 text-white hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>{isUpdate ? 'Save changes' : 'Save and continue'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canContinue}
                className="px-8 py-3 rounded-xl font-semibold bg-forest-700 text-white hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreferencesPage;
