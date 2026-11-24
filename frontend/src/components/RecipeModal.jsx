import { useState, useEffect } from 'react';
import { X, Clock, Flame, Users, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';

const recipeCache = {};

function RecipeModal({ dish, servings, onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const key = `${dish}|${servings}`;
    if (recipeCache[key]) {
      setRecipe(recipeCache[key]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError('');
    apiService
      .getRecipe(authUtils.getToken(), dish, servings)
      .then((data) => {
        if (cancelled) return;
        recipeCache[key] = data;
        setRecipe(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load the recipe.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dish, servings, attempt]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-cream/95 backdrop-blur border-b border-line px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-forest-700 uppercase">Recipe</p>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">{recipe?.name || dish}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream-dark shrink-0"
            aria-label="Close recipe"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {loading && (
            <div className="py-16 text-center">
              <Loader2 className="h-10 w-10 text-forest-700 animate-spin mx-auto mb-4" />
              <p className="text-muted">Writing your recipe...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-ink mb-4">{error}</p>
              <button
                onClick={() => setAttempt(attempt + 1)}
                className="px-5 py-2.5 rounded-xl bg-forest-700 text-white font-semibold hover:bg-forest-800"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && recipe && (
            <>
              {recipe.description && <p className="text-muted mb-4">{recipe.description}</p>}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="inline-flex items-center gap-1.5 text-sm bg-white border border-line rounded-full px-3 py-1.5">
                  <Clock className="h-4 w-4 text-forest-700" />
                  {recipe.time_minutes} min
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm bg-white border border-line rounded-full px-3 py-1.5">
                  <Users className="h-4 w-4 text-forest-700" />
                  Serves {recipe.servings}
                </span>
                {recipe.calories_per_serving > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-white border border-line rounded-full px-3 py-1.5">
                    <Flame className="h-4 w-4 text-saffron" />
                    About {recipe.calories_per_serving} kcal per serving
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-2">
                  <h3 className="font-display text-xl mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="flex justify-between gap-3 text-sm border-b border-line pb-2"
                      >
                        <span>{ing.item}</span>
                        <span className="text-muted text-right">{ing.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-3">
                  <h3 className="font-display text-xl mb-3">Method</h3>
                  <ol className="space-y-4">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="h-7 w-7 shrink-0 rounded-full bg-forest-700 text-white text-sm font-semibold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                  {recipe.tip && (
                    <div className="mt-6 bg-forest-50 border border-forest-200 rounded-xl p-4 text-sm text-forest-900">
                      <span className="font-semibold">Tip: </span>
                      {recipe.tip}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeModal;
