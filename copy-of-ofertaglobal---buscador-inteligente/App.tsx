
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchMode, SearchState, SortOrder } from './types';
import { searchDeals } from './services/geminiService';
import DealCard from './components/DealCard';

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    location: 'Argentina', // Default inmediato para evitar estados de carga infinitos
    mode: SearchMode.RETAIL,
    sortOrder: SortOrder.RELEVANCE,
    loading: false,
    results: [],
    sources: [],
    error: null
  });

  const [showCountrySelector, setShowCountrySelector] = useState(false);

  const countries = ["Argentina", "México", "España", "Chile", "Colombia", "Perú", "Uruguay", "Estados Unidos"];
  
  const categories = [
    { label: 'iPhone 15', icon: 'fa-mobile-screen' },
    { label: 'Notebook Gamer', icon: 'fa-laptop-code' },
    { label: 'Zapatillas Nike', icon: 'fa-shoe-prints' },
    { label: 'Smart TV 50', icon: 'fa-tv' },
    { label: 'Freidora de Aire', icon: 'fa-kitchen-set' }
  ];

  useEffect(() => {
    // Intentar refinar ubicación por idioma si no hay geolocalización activa
    const lang = navigator.language.toLowerCase();
    let detected = state.location;
    if (lang.includes('mx')) detected = "México";
    else if (lang.includes('es')) detected = "España";
    else if (lang.includes('cl')) detected = "Chile";
    else if (lang.includes('co')) detected = "Colombia";
    else if (lang.includes('pe')) detected = "Perú";
    
    if (detected !== state.location) {
      setState(prev => ({ ...prev, location: detected }));
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // Ya tenemos un default y refinamiento por idioma
        () => {} // Ignorar errores silenciosamente para no interrumpir el flujo
      );
    }
  }, []);

  const handleSearch = useCallback(async (forcedQuery?: string, forcedMode?: SearchMode) => {
    const queryToUse = forcedQuery !== undefined ? forcedQuery : state.query;
    const modeToUse = forcedMode !== undefined ? forcedMode : state.mode;

    if (!queryToUse.trim()) return;
    
    setState(prev => ({ ...prev, loading: true, error: null, query: queryToUse, mode: modeToUse }));
    
    try {
      const { results, sources } = await searchDeals(queryToUse, state.location, modeToUse);
      if (results.length === 0) {
        setState(prev => ({ ...prev, loading: false, error: "No se encontraron ofertas. Intenta con otros términos." }));
      } else {
        setState(prev => ({ ...prev, results, sources, loading: false }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: "Hubo un error al buscar. Intenta nuevamente." }));
    }
  }, [state.query, state.location, state.mode]);

  const sortedResults = useMemo(() => {
    if (state.sortOrder === SortOrder.RELEVANCE) return state.results;
    
    return [...state.results].sort((a, b) => {
      // Helper para extraer números de strings complejos ($ 1.200,50 -> 1200.50)
      const getVal = (s: string) => {
        const cleaned = s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      };
      
      const pA = getVal(a.price);
      const pB = getVal(b.price);
      
      return state.sortOrder === SortOrder.PRICE_LOW ? pA - pB : pB - pA;
    });
  }, [state.results, state.sortOrder]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => window.location.reload()}>
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-bolt-lightning"></i>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter hidden sm:block">
              Oferta<span className="text-blue-600">Global</span>
            </h1>
          </div>

          <div className="flex-grow max-w-xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative group">
              <input 
                type="text" 
                value={state.query}
                onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                placeholder={`Busca productos en ${state.location}...`}
                className="w-full bg-slate-100 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-2.5 pl-11 pr-4 outline-none transition-all font-bold text-slate-800 shadow-sm"
              />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600"></i>
            </form>
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => setShowCountrySelector(!showCountrySelector)}
              className="flex items-center gap-2 text-slate-900 font-bold text-xs bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
            >
              <i className="fa-solid fa-earth-americas text-blue-600"></i>
              <span>{state.location}</span>
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
            {showCountrySelector && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[60]">
                {countries.map(c => (
                  <button 
                    key={c}
                    onClick={() => { setState(prev => ({ ...prev, location: c, results: [] })); setShowCountrySelector(false); }}
                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors ${state.location === c ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex border-t border-slate-100">
          {[
            { id: SearchMode.RETAIL, label: 'Minorista', icon: 'fa-shopping-bag' },
            { id: SearchMode.WHOLESALE, label: 'Por Mayor', icon: 'fa-boxes-stacked' },
            { id: SearchMode.COUPONS, label: 'Cupones', icon: 'fa-ticket-simple' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setState(prev => ({ ...prev, mode: tab.id })); if(state.query) handleSearch(state.query, tab.id); }}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all text-[10px] font-black uppercase tracking-widest ${
                state.mode === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-10 w-full">
        {state.error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl font-bold flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation"></i>
            {state.error}
          </div>
        )}

        {state.loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Buscando Ofertas...</h2>
            <p className="text-slate-400 text-xs font-bold mt-2">Analizando tiendas de {state.location}</p>
          </div>
        ) : state.results.length > 0 ? (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ofertas para <span className="text-blue-600">"{state.query}"</span></h2>
              <div className="flex gap-2">
                {[SortOrder.RELEVANCE, SortOrder.PRICE_LOW, SortOrder.PRICE_HIGH].map(order => (
                  <button 
                    key={order}
                    onClick={() => setState(prev => ({ ...prev, sortOrder: order }))}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      state.sortOrder === order ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {order === SortOrder.RELEVANCE ? 'Popular' : order === SortOrder.PRICE_LOW ? 'Barato' : 'Caro'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedResults.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic mb-4">Ahorra en {state.location}</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg font-medium mb-12">
              Ingresa lo que buscas o selecciona una tendencia para empezar.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => handleSearch(cat.label)}
                  className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <i className={`fa-solid ${cat.icon} text-blue-600`}></i>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">
            OfertaGlobal v2.7 - Rastreador Regional Inteligente
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
