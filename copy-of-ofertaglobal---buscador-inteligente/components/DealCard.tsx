
import React from 'react';
import { DealResult, SearchMode } from '../types';

interface Props { deal: DealResult; }

const DealCard: React.FC<Props> = ({ deal }) => {
  const isCoupon = deal.type === SearchMode.COUPONS;
  const isWholesale = deal.type === SearchMode.WHOLESALE;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const text = `¡Mira lo que encontré! ${deal.title} en ${deal.store}. Precio: ${deal.price}. Link directo: ${deal.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden relative">
      {/* Badges Flotantes */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
        {deal.discountPercentage && deal.discountPercentage !== '0%' && (
          <div className="bg-red-600 text-white px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-xl flex items-center gap-2">
            <i className="fa-solid fa-fire-flame-curved"></i>
            -{deal.discountPercentage}
          </div>
        )}
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-green-400"></i>
          Stock Verificado
        </div>
      </div>

      <div className="absolute top-5 right-5 z-10">
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-2 rounded-2xl shadow-xl">
           <i className={`fa-solid fa-shield-check text-blue-600`}></i>
        </div>
      </div>

      {/* Imagen del Producto (La que está en la página) */}
      <div className="h-64 bg-white p-8 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-50 transition-colors">
        {deal.imageUrl ? (
          <img 
            src={deal.imageUrl} 
            alt={deal.title}
            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/600x600/f8fafc/cbd5e1?text=${encodeURIComponent(deal.store)}\nFoto+en+Tienda`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-3xl flex flex-col items-center justify-center text-slate-200 gap-4">
            <i className={`fa-solid ${isCoupon ? 'fa-ticket' : 'fa-box-open'} text-7xl`}></i>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando Foto Real...</span>
          </div>
        )}
        {/* Overlay de Brillo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>

      {/* Info Detallada */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.25em]">{deal.store}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
              <i className="fa-solid fa-link"></i> Link Directo
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
            {deal.title}
          </h3>
        </div>

        {/* Bloque de Precio Premium */}
        <div className="mt-auto bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100 relative group-hover:border-blue-100 transition-colors">
          <div className="flex justify-between items-end">
            <div>
              {deal.originalPrice && (
                <p className="text-xs text-slate-400 line-through font-bold mb-1">{deal.originalPrice}</p>
              )}
              <p className="text-3xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">
                {deal.price}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex gap-1 items-end h-8 mb-2">
                {[3, 6, 4, 9, 7, 5, 2].map((h, i) => (
                  <div key={i} className={`w-1.5 rounded-full ${i === 6 ? 'bg-blue-600' : 'bg-slate-200'} animate-bounce`} style={{ height: `${h * 3}px`, animationDelay: `${i * 100}ms` }}></div>
                ))}
              </div>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Oportunidad</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <a 
            href={deal.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex-grow py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${
              isCoupon ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100' :
              isWholesale ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100' :
              'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            {isCoupon ? 'Ver Cupón' : 'Comprar Ahora'}
            <i className="fa-solid fa-circle-arrow-right text-[14px]"></i>
          </a>
          <button 
            onClick={handleShare}
            className="w-14 h-14 rounded-[1.5rem] bg-white border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all flex items-center justify-center shadow-lg group/share"
            title="Enviar a WhatsApp"
          >
            <i className="fa-brands fa-whatsapp text-2xl group-hover/share:scale-110 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealCard;
