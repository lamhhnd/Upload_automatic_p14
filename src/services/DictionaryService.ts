export interface Phonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface Definition {
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example?: string;
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  license: {
    name: string;
    url: string;
  };
  sourceUrls: string[];
}

export const fetchDictionaryEntry = async (word: string): Promise<DictionaryEntry[]> => {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Word not found in dictionary.');
    }
    throw new Error('Failed to fetch dictionary data.');
  }
  
  return await response.json();
};

export interface VietnameseMeaning {
  definition: string;
  examples: string[];
}

export const fetchVietnameseMeaning = async (word: string): Promise<VietnameseMeaning | null> => {
  try {
    // Sử dụng MyMemory API để lấy nghĩa chi tiết và các ví dụ
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      const examples: string[] = [];
      if (data.matches && Array.isArray(data.matches)) {
        data.matches.forEach((match: any) => {
          if (match.usage && !examples.includes(match.usage)) {
            examples.push(match.usage);
          }
        });
      }

      return {
        definition: data.responseData.translatedText,
        examples: examples.slice(0, 3) // Lấy tối đa 3 ví dụ
      };
    }
    
    return null;
  } catch (error) {
    console.error('Vietnamese dictionary fetch error:', error);
    return null;
  }
};
