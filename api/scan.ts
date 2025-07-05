// Vercel expects this file in the /api directory to treat it as a Serverless Function.
// It uses Node.js, so you'll need to configure your Vercel project for it.
// The types `any` are used as we cannot add @vercel/node to the project dependencies.

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This code runs on the server, where process.env.API_KEY is securely available
// from your Vercel project's environment variables.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("API_KEY environment variable not set on the server.");
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  if (!ai) {
    const errorMessage = "La variable de entorno API_KEY no está configurada en el servidor. La aplicación no puede conectarse al servicio de IA. Agregue la API_KEY a las variables de entorno de su proyecto Vercel.";
    res.status(500).json({ error: errorMessage });
    return;
  }

  const { base64Image } = req.body;

  if (!base64Image) {
    res.status(400).json({ error: 'Falta base64Image en el cuerpo de la solicitud' });
    return;
  }
  
  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const match = base64Image.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        res.status(400).json({ error: 'Formato de imagen no válido. Se esperaba una cadena base64 con data-URL.' });
        return;
    }
    const mimeType = match[1];
    const data = match[2];

    const imagePart = fileToGenerativePart(data, mimeType);

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
    const fenceMatch = jsonStr.match(fenceRegex);
    if (fenceMatch && fenceMatch[2]) {
      jsonStr = fenceMatch[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    res.status(200).json(parsedData);

  } catch (error) {
    console.error("Error in /api/scan serverless function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'No se pudo procesar el recibo con el servicio de IA. Verifique que su API_KEY sea válida y que la imagen sea clara.', details: errorMessage });
  }
}
