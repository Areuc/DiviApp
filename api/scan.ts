// Vercel expects this file in the /api directory to treat it as a Serverless Function.
// It uses Node.js, so you'll need to configure your Vercel project for it.
// The types `any` are used as we cannot add @vercel/node to the project dependencies.

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This code runs on the server, where process.env.API_KEY is securely available
// from your Vercel project's environment variables.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI;

if (!API_KEY) {
  console.error("API_KEY environment variable not set on the server.");
} else {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

// Vercel Serverless function handler
export default async function handler(req: any, res: any) {
  if (!ai) {
    res.status(500).json({ error: 'AI client not initialized. Check server logs for API_KEY issues.' });
    return;
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const { base64Image } = req.body;

  if (!base64Image) {
    res.status(400).json({ error: 'Missing base64Image in request body' });
    return;
  }
  
  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    const imagePart = fileToGenerativePart(base64Image.split(',')[1], base64Image.split(';')[0].split(':')[1]);

    const prompt = `
      Analiza la imagen del recibo. Extrae cada artículo, su cantidad y su precio total.
      - Ignora impuestos, cargos por servicio, propinas y las líneas de suma total.
      - Si no se especifica la cantidad, asume que es 1.
      - El precio debe ser un número.
      - Devuelve los datos como un array JSON de objetos. Cada objeto debe tener las claves: "name" (string), "quantity" (number), y "price" (number).
      - Si la imagen no es un recibo o no se puede leer, devuelve un array vacío.
      - Tu respuesta completa debe ser únicamente el array JSON, sin ningún otro texto o delimitadores de markdown.
      Ejemplo: [{"name": "Hamburguesa", "quantity": 1, "price": 12.50}, {"name": "Patatas Fritas", "quantity": 2, "price": 4.00}]
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    res.status(200).json(parsedData);

  } catch (error) {
    console.error("Error in /api/scan serverless function:", error);
    res.status(500).json({ error: 'Failed to process receipt with AI service.' });
  }
}
