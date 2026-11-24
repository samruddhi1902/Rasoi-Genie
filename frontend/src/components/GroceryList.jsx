import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Copy, Printer, MessageCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';
import { store } from '../utils/menuMeta';

const groceryCache = {};

function GroceryList({ menu, servings, onToast }) {
  const menuId = menu.menu_id;
  const signature = JSON.stringify(menu.menu);
  const cacheKey = `${menuId}|${servings}|${signature}`;

  const [data, setData] = useState(groceryCache[cacheKey] || null);
  const [loading, setLoading] = useState(!groceryCache[cacheKey]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [checked, setChecked] = useState(() => store.get(`rg_grocery_${menuId}`, {}));

  useEffect(() => {
    let cancelled = false;
    if (groceryCache[cacheKey]) {
      setData(groceryCache[cacheKey]);
      setLoading(false);
      setError('');
      return undefined;
    }
    setLoading(true);
    setError('');
    apiService
      .getGroceryList(authUtils.getToken(), menuId, servings)
      .then((result) => {
        if (cancelled) return;
        groceryCache[cacheKey] = result;
        setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not build the grocery list.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, menuId, servings, attempt]);

  const toggleItem = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      store.set(`rg_grocery_${menuId}`, next);
      return next;
    });
  };

  const refresh = () => {
    delete groceryCache[cacheKey];
    setData(null);
    setAttempt(attempt + 1);
  };

  const toText = () => {
    if (!data) return '';
    const lines = [`Grocery list for ${servings} people (Rasoi Genie)`, ''];
    data.categories.forEach((cat) => {
      lines.push(cat.name);
      cat.items.forEach((it) => lines.push(`- ${it.item}${it.quantity ? ` (${it.quantity})` : ''}`));
      lines.push('');
    });
    return lines.join('\n').trim();
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(toText());
      onToast('success', 'Grocery list copied.');
    } catch (e) {
      onToast('error', 'Could not copy. Try the WhatsApp or Print buttons instead.');
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(toText())}`, '_blank', 'noopener');
  };

  const total = data ? data.categories.reduce((n, c) => n + c.items.length, 0) : 0;
  const done = data
    ? data.categories.reduce(
        (n, c) => n + c.items.filter((it) => checked[`${c.name}|${it.item}`]).length,
        0
      )
    : 0;

  if (loading) {
    return (
      <div className="bg-[#FDFBF6] border border-line rounded-2xl p-12 text-center">
        <Loader2 className="h-10 w-10 text-forest-700 animate-spin mx-auto mb-4" />
        <p className="text-muted">Building your grocery list for {servings} people...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#FDFBF6] border border-line rounded-2xl p-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="mb-4">{error || 'Something went wrong.'}</p>
        <button
          onClick={() => setAttempt(attempt + 1)}
          className="px-5 py-2.5 rounded-xl bg-forest-700 text-white font-semibold hover:bg-forest-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 print:hidden">
        <div>
          <h2 className="font-display text-2xl">Grocery list</h2>
          <p className="text-sm text-muted">
            For {servings} people. {done} of {total} items ticked off.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700 text-white font-medium hover:bg-forest-800"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={copyList}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-white font-medium hover:bg-cream-dark"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-white font-medium hover:bg-cream-dark"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-white font-medium hover:bg-cream-dark"
            title="Rebuild the list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h1 className="hidden print:block font-display text-2xl mb-4">
        Grocery list for {servings} people
      </h1>

      <div className="grid sm:grid-cols-2 gap-4">
        {data.categories.map((cat) => (
          <div key={cat.name} className="bg-[#FDFBF6] border border-line rounded-2xl p-5 break-inside-avoid">
            <h3 className="font-display text-lg text-forest-800 mb-3">{cat.name}</h3>
            <ul className="space-y-2">
              {cat.items.map((it) => {
                const id = `${cat.name}|${it.item}`;
                const isDone = !!checked[id];
                return (
                  <li key={id}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleItem(id)}
                        className="mt-1 h-4 w-4 accent-forest-700"
                      />
                      <span className={`flex-1 text-sm ${isDone ? 'line-through text-gray-400' : ''}`}>
                        {it.item}
                      </span>
                      <span className={`text-sm text-right ${isDone ? 'text-gray-300' : 'text-muted'}`}>
                        {it.quantity}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroceryList;
