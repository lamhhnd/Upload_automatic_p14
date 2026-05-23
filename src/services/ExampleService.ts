import { fetchDictionaryEntry } from './DictionaryService';

export const getExampleSentences = async (word: string): Promise<string[]> => {
  try {
    const entries = await fetchDictionaryEntry(word);
    const examples: string[] = [];

    entries.forEach(entry => {
      entry.meanings.forEach(meaning => {
        meaning.definitions.forEach(def => {
          if (def.example) {
            examples.push(def.example);
          }
        });
      });
    });

    // Trả về danh sách các ví dụ duy nhất
    return Array.from(new Set(examples));
  } catch (error) {
    console.error('Lỗi khi lấy ví dụ:', error);
    return [];
  }
};
