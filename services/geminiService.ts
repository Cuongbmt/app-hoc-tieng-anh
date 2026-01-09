export async function generateVocabularyByTopic(t: string, l: string, count: number = 15): Promise<VocabularyWord[]> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate exactly ${count} English vocabulary words for the topic "${t}" at level "${l}". 
      For each word, provide:
      1. The word itself.
      2. International Phonetic Alphabet (IPA).
      3. Vietnamese meaning.
      4. An English example sentence.
      5. A natural Vietnamese translation of that example sentence.
      Return the result strictly as a JSON array of objects.`,
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { 
              word: {type:Type.STRING}, 
              phonetic: {type:Type.STRING}, 
              meaning: {type:Type.STRING}, 
              example: {type:Type.STRING},
              exampleTranslation: {type:Type.STRING}
            },
            required: ["word", "phonetic", "meaning", "example", "exampleTranslation"]
          } 
        } 
      } // Dấu đóng ngoặc của config phải nằm ở đây
    }); // Dấu đóng ngoặc của callGemini nằm ở đây
    
    const words = JSON.parse(text || "[]");
    return words.map((w: any, i: number) => ({
      ...w,
      id: `${Date.now()}-${i}`,
      mastery: 0,
      nextReview: 0
    }));
  } catch (e) {
    console.error("Failed to generate vocab", e);
    return [];
  }
}
