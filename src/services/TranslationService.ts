export const translateToVietnamese = async (text: string): Promise<string> => {
  if (!text.trim()) return '';
  
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`
    );
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      // MyMemory sometimes returns matches that aren't perfect, 
      // but translatedText is usually the best bet.
      return data.responseData.translatedText;
    }
    
    return '';
  } catch (error) {
    console.error('Translation error:', error);
    return '';
  }
};
