import { GoogleGenAI } from "@google/genai";
import { WikiPageData, GroundingSource } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamWikiPage = async function* (topic: string) {
  try {
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `
      You are the engine for "Infinite Wiki", a dynamic encyclopedia. 
      Your goal is to generate a comprehensive, factual, and well-structured wiki page for the requested topic.
      
      Formatting Rules:
      1. Use standard Markdown.
      2. The first line should be the Title of the article as a Level 1 Header (# Title).
      3. Provide a brief summary paragraph immediately after the title.
      4. Use Level 2 Headers (##) for main sections (e.g., History, Significance, details appropriate to the topic).
      5. CRITICAL: Identify key terms, concepts, or related topics within the text that would make good wiki pages themselves. Wrap these terms in double brackets like [[This]]. For example: "The [[Eiffel Tower]] is a wrought-iron lattice tower on the [[Champ de Mars]]."
      6. Do not add a "References" section manually; we will handle citations using the grounding metadata.
      7. Maintain a neutral, encyclopedic tone.
      8. If the topic is ambiguous, choose the most common interpretation or briefly mention alternatives.
    `;

    const responseStream = await ai.models.generateContentStream({
      model,
      contents: `Write a wiki page for: ${topic}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }], // Enable Google Search for grounding
        temperature: 0.3, // Low temperature for factual accuracy
      },
    });

    let fullText = '';
    let groundingChunks: any[] = [];

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        yield { content: fullText };
      }
      
      // Collect grounding chunks if present in this chunk
      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        groundingChunks = [...groundingChunks, ...metadata.groundingChunks];
      }
    }

    // Process sources at the end of the stream
    const sources: GroundingSource[] = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({
        title: web.title,
        uri: web.uri
      }));

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    // Yield the final state with sources
    yield { 
      content: fullText, 
      sources: uniqueSources 
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateRandomTopic = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Give me the name of one random, interesting, specific encyclopedia topic. Just the name, nothing else.",
      config: {
        temperature: 1.0,
      }
    });
    return response.text?.trim() || "Science";
  } catch (e) {
    return "Technology";
  }
};