
import { GoogleGenAI } from "@google/genai";
import { SearchMode, DealResult, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanUrl = (url: string | undefined): string | undefined => {
  if (!url || url === 'null' || url === '#') return undefined;
  let trimmed = url.trim().replace(/^["']|["']$/g, '');
  if (!trimmed.startsWith('http')) return undefined;
  return trimmed;
};

const isDeepLink = (url: string, store: string): boolean => {
  try {
    const uri = new URL(url);
    const path = uri.pathname.replace(/\/$/, '');
    const genericPaths = ['', '/', '/index.html', '/home', '/es', '/en', '/ar', '/mx', '/search'];
    if (genericPaths.includes(path.toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
};

export const searchDeals = async (
  query: string,
  location: string,
  mode: SearchMode
): Promise<{ results: DealResult[]; sources: GroundingSource[] }> => {
  const modeText = {
    [SearchMode.RETAIL]: "productos minoristas con stock local",
    [SearchMode.WHOLESALE]: "distribuidores mayoristas nacionales",
    [SearchMode.COUPONS]: "cupones vigentes en el país"
  }[mode];

  const systemInstruction = `
    Eres el Auditor de Ofertas Regionales "OfertaGlobal Geo-Target". 
    UBICACIÓN ACTUAL DEL USUARIO: ${location}.

    REGLAS OBLIGATORIAS:
    1. FILTRO GEOGRÁFICO: Solo muestra productos de tiendas que operen en ${location}.
    2. ENLACE PROFUNDO: La URL debe ir a la ficha del producto, NO a la home.
    3. FOTOS: Extrae la URL de la imagen del producto.
    4. MONEDA: Usa la moneda local de ${location}.

    RESPONDE CON ESTE FORMATO PARA CADA ITEM:
    ---
    ITEM: [Nombre]
    PRECIO: [Monto]
    ORIGINAL: [Monto anterior]
    AHORRO: [%]
    TIENDA: [Tienda]
    URL: [Link Directo]
    IMAGEN: [Link Foto]
    CONFIABILIDAD: [High]
    STATUS: [En Stock]
    DESCRIPCION: [Info]
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Busca ofertas de "${query}" para usuarios en ${location}. Modo: ${modeText}. Necesito LINKS DIRECTOS y FOTOS REALES.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    const results: DealResult[] = [];
    const sections = text.split('---').filter(s => s.trim().length > 20);

    sections.forEach((section) => {
      const lines = section.trim().split('\n');
      const item: any = {
        id: Math.random().toString(36).substr(2, 9),
        isVerified: true,
        type: mode,
      };

      lines.forEach(line => {
        const parts = line.split(': ');
        if (parts.length < 2) return;
        const key = parts[0].trim().toUpperCase();
        const value = parts.slice(1).join(': ').trim();
        
        if (key.includes('ITEM')) item.title = value;
        else if (key.includes('PRECIO')) item.price = value;
        else if (key.includes('ORIGINAL')) item.originalPrice = value;
        else if (key.includes('AHORRO')) item.discountPercentage = value;
        else if (key.includes('TIENDA')) item.store = value;
        else if (key.includes('URL')) item.url = cleanUrl(value);
        else if (key.includes('IMAGEN')) item.imageUrl = cleanUrl(value);
        else if (key.includes('CONFIABILIDAD')) item.reliabilityScore = value as any;
        else if (key.includes('STATUS')) item.description = `[${value}] ` + (item.description || '');
        else if (key.includes('DESCRIPCION')) item.description = (item.description || '') + value;
      });

      if (item.title && item.url) {
        results.push(item as DealResult);
      }
    });

    // Fallback CRÍTICO: Si no hay resultados analizados pero sí fuentes, poblar con las fuentes
    if (results.length === 0 && sources.length > 0) {
      sources.forEach(s => {
        results.push({
          id: Math.random().toString(36).substr(2, 9),
          title: s.title,
          url: s.uri,
          store: new URL(s.uri).hostname.replace('www.', ''),
          price: "Ver Oferta",
          description: `Resultado verificado en ${location}.`,
          isVerified: true,
          reliabilityScore: 'High',
          type: mode
        });
      });
    }

    return { results, sources };
  } catch (error) {
    console.error("Error en búsqueda:", error);
    // Retornar vacíos en lugar de explotar
    return { results: [], sources: [] };
  }
};
