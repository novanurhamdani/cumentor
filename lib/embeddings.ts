import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function getEmbeddings(text: string) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text.replace(/\n/g, " "));
    const embedding = await result.embedding;

    if (!embedding || !embedding.values) {
      throw new Error("Received empty embedding from Google AI API");
    }

    // Convert Float32Array to regular array
    const embedArray = Array.from(embedding.values);

    if (embedArray.length === 0) {
      throw new Error("Failed to get valid embedding array");
    }

    return embedArray;
  } catch (error) {
    console.error("Error in getEmbeddings:", error);
    throw error;
  }
}
