import { ChefHat, Calendar, ShoppingCart, BookOpen, Heart, Users, Lock, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'A full week, planned',
    text: 'Breakfast, lunch, snacks and dinner for all seven days, balanced and never repeating.',
  },
  {
    icon: Users,
    title: 'Veg, non-veg and vegan together',
    text: 'Choose every diet your family follows. We mix them sensibly across the week.',
  },
  {
    icon: BookOpen,
    title: 'Recipes on tap',
    text: 'Tap any dish for ingredients, steps, cooking time and calories, scaled to your household.',
  },
  {
    icon: ShoppingCart,
    title: 'One-tap grocery list',
    text: 'A combined shopping list sorted by aisle. Tick items off in the shop or send it on WhatsApp.',
  },
  {
    icon: Heart,
    title: 'Health aware',
    text: 'Diabetes, blood pressure and cholesterol guidance is built into every plan.',
  },
  {
    icon: Lock,
    title: 'Keep what you love',
    text: 'Lock favourite dishes, swap the rest, and add notes like "no onion or garlic".',
  },
];

const sample = [
  { label: 'Breakfast', emoji: '🌅', dish: 'Vegetable Upma' },
  { label: 'Lunch', emoji: '☀️', dish: 'Rajma + Jeera Rice' },
  { label: 'Snacks', emoji: '🍿', dish: 'Roasted Makhana' },
  { label: 'Dinner', emoji: '🌙', dish: 'Palak Paneer + Roti' },
];

function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-7 w-7 text-forest-700" />
          <span className="font-display text-2xl font-semibold text-forest-800">Rasoi Genie</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="text-forest-800 font-semibold px-3 py-2 hover:text-forest-900"
          >
            Sign in
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest text-forest-700 uppercase">
            Weekly meal planning for Indian homes
          </p>
          <h1 className="font-display text-5xl sm:text-6xl leading-tight mt-4">
            Never wonder what to cook <span className="text-forest-700">again.</span>
          </h1>
          <p className="text-lg text-muted mt-6 max-w-xl">
            Tell us what your family eats and how much time you have. Rasoi Genie plans the week,
            writes the recipes and builds the grocery list.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('signup')}
              className="bg-forest-700 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-forest-800 flex items-center gap-2"
            >
              <span>Plan my week</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-7 py-3.5 rounded-xl font-semibold border border-line bg-white hover:bg-cream-dark"
            >
              I already have an account
            </button>
          </div>
        </div>

        {/* Sample day card */}
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-3xl bg-forest-100"
            style={{ transform: 'rotate(-2deg)' }}
          />
          <div className="relative bg-[#FDFBF6] border border-line rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold tracking-widest text-forest-700 uppercase">Today</p>
                <h3 className="font-display text-2xl">Your menu</h3>
              </div>
              <span className="text-xs bg-forest-50 text-forest-800 border border-forest-200 rounded-full px-3 py-1">
                Veg + Non-veg
              </span>
            </div>
            <div className="space-y-3">
              {sample.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-4 bg-white border border-line rounded-2xl px-4 py-3"
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">{m.label}</p>
                    <p className="font-display text-lg">{m.dish}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-line">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-display text-4xl text-center">Everything your kitchen needs</h2>
          <p className="text-muted text-center mt-3 mb-12">
            From "what's for dinner?" to "what do I buy?", handled.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-cream border border-line rounded-2xl p-6">
                <div className="h-11 w-11 rounded-xl bg-forest-100 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-forest-700" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-4xl text-center mb-12">Three steps to a calmer week</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            ['1', 'Tell us your tastes', 'Diets, cuisines, meals and how long you want to spend cooking.'],
            ['2', 'Get your week', 'A balanced menu in under a minute. Swap or lock any dish.'],
            ['3', 'Cook and shop', 'Open a recipe, or send the grocery list to your phone.'],
          ].map(([n, title, text]) => (
            <div key={n} className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-forest-700 text-white font-display text-xl flex items-center justify-center">
                {n}
              </div>
              <h3 className="font-semibold text-lg mt-4">{title}</h3>
              <p className="text-muted mt-2 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-forest-800 rounded-3xl px-8 py-14 text-center">
          <h2 className="font-display text-4xl text-white">Ready for a week full of good things?</h2>
          <p className="text-white/80 mt-3">Free to use. Set up in a minute.</p>
          <button
            onClick={() => onNavigate('signup')}
            className="mt-8 bg-cream text-forest-800 px-8 py-3.5 rounded-xl font-semibold hover:bg-white"
          >
            Create my account
          </button>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        Rasoi Genie. Made for Indian kitchens.
      </footer>
    </div>
  );
}

export default LandingPage;
