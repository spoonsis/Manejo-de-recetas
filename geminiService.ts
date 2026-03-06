
import { GoogleGenAI, Type } from "@google/genai";
import { Receta, Insumo } from "./types";

export const getChefInsights = async (recipe: Receta, allIngredients: Insumo[]) => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key from the environment.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const recipeData = {
    name: recipe.nombre,
    ingredients: recipe.ingredientes.map(ri => {
      const ing = allIngredients.find(i => i.id === ri.idReferencia);
      return {
        name: ri.nombre,
        quantity: ri.cantidad,
        unit: ri.unidad,
        price: ing?.precioPorUnidad
      };
    }),
    portions: recipe.porcionesCantidad
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analiza esta receta profesional y proporciona sugerencias para optimizar costos, mejorar el sabor o sustituir ingredientes costosos. Responde en español.
    
    Receta: ${JSON.stringify(recipeData)}`,
    config: {
      temperature: 1,
    }
  });

  return response.text;
};

export const optimizarPasosReceta = async (nombre: string, ingredientes: string[]) => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Optimiza los pasos de preparación para la receta "${nombre}" usando estos ingredientes: ${ingredientes.join(', ')}. Devuelve solo una lista de pasos concisos en formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    // Check if text is available before parsing.
    return response.text ? JSON.parse(response.text) : [];
  } catch (e) {
    console.error("Error parsing AI response", e);
    return [];
  }
};

export const generateStandardRecipe = async (dishName: string) => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera una ficha técnica estándar para el plato: ${dishName}. Incluye ingredientes básicos con cantidades aproximadas y pasos de preparación. Devuelve en formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              }
            }
          },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return response.text ? JSON.parse(response.text) : null;
};