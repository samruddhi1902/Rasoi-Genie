import { ChefHat } from 'lucide-react';

// Shared layout for the sign in / sign up screens: photo-style hero on top, card below.
// To use your own photo, add a file named hero.jpg to the frontend/public folder.
function AuthShell({ headline, tagline, eyebrow, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-cream">
      <div
        className="relative overflow-hidden bg-forest-800"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(217,131,36,0.40), transparent 45%), radial-gradient(circle at 85% 75%, rgba(60,122,83,0.65), transparent 50%), linear-gradient(rgba(22,53,31,0.45), rgba(22,53,31,0.80)), url('/hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-16 sm:pt-12 sm:pb-24">
          <div className="inline-flex items-center gap-2 bg-cream/90 text-forest-800 rounded-xl px-4 py-2 font-semibold shadow-sm">
            <ChefHat className="h-5 w-5" />
            <span>Rasoi Genie</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white mt-10 sm:mt-16 leading-tight">
            {headline}
          </h1>
          <p className="text-white/85 text-lg mt-3">{tagline}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 pb-16 relative">
        <div className="bg-[#FDFBF6] border border-line rounded-2xl shadow-sm p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-widest text-forest-700 uppercase">{eyebrow}</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink mt-2">{title}</h2>
          <p className="text-muted mt-2 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
