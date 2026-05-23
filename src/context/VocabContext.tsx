import React, { createContext, useContext, useState, useEffect } from 'react';
import initialVocabData from '../data/vocab.json';

export interface Vocab {
  id: string;
  english: string;
  vietnamese: string;
  type: string;
  example: string;
  image?: string;
  topic?: string;
  createdAt?: string;
  lastSeen?: string;
  correctCount?: number;
  wrongCount?: number;
}

export const STANDARD_TOPICS = [
  'Education',
  'Technology',
  'Environment',
  'Health',
  'Government spending',
  'Work & Career',
  'Media & Advertising',
  'Urbanization',
  'General'
];

interface VocabContextType {
  vocabList: Vocab[];
  filteredVocabList: Vocab[];
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  addVocab: (vocab: Omit<Vocab, 'id' | 'createdAt'> & { imageFile?: File | null }) => Promise<boolean>;
  updateVocab: (vocab: Vocab & { imageFile?: File | null }) => Promise<boolean>;
  deleteVocab: (id: string) => Promise<void>;
  updateStats: (id: string, isCorrect: boolean) => void;
  resetToDefault: () => void;
  connectProjectFolder: () => Promise<void>;
  speak: (text: string) => void;
  exportVocab: () => void;
  importVocab: (file: File) => Promise<boolean>;
  isFolderConnected: boolean;
  projectFolder: string;
}

const VocabContext = createContext<VocabContextType | undefined>(undefined);

export const VocabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabList, setVocabList] = useState<Vocab[]>(() => {
    const saved = localStorage.getItem('vocab_data');
    return saved ? JSON.parse(saved) : (initialVocabData as Vocab[]);
  });

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filteredVocabList = React.useMemo(() => {
    return vocabList.filter((v) => {
      if (!v.createdAt) return true;
      const createdDate = v.createdAt.split('T')[0];
      return createdDate >= startDate && createdDate <= endDate;
    });
  }, [vocabList, startDate, endDate]);

  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [projectFolder, setProjectFolder] = useState<string>('');

  const saveToDisk = React.useCallback(async (data: Vocab[]) => {
    if (!dirHandle) return;
    try {
      const srcDir = await dirHandle.getDirectoryHandle('src', { create: true });
      const dataDir = await srcDir.getDirectoryHandle('data', { create: true });
      const fileHandle = await dataDir.getFileHandle('vocab.json', { create: true });
      
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      console.log('Successfully saved vocab.json to disk');
    } catch (err) {
      console.error('Failed to save to disk:', err);
    }
  }, [dirHandle]);

  useEffect(() => {
    localStorage.setItem('vocab_data', JSON.stringify(vocabList));
    if (dirHandle) {
      saveToDisk(vocabList);
    }
  }, [vocabList, dirHandle, saveToDisk]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                             voices.find(v => v.name.includes('Samantha')) ||
                             voices.find(v => v.lang === 'en-US' && v.localService === false) ||
                             voices.find(v => v.lang.startsWith('en-'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Trình duyệt không hỗ trợ phát âm.');
    }
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const saveImageToDisk = async (file: File): Promise<string> => {
    if (!dirHandle) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 800;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedBase64);
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    try {
      const publicDir = await dirHandle.getDirectoryHandle('public', { create: true });
      const imagesDir = await publicDir.getDirectoryHandle('images', { create: true });
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const fileHandle = await imagesDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
      return `/images/${fileName}`;
    } catch (err) {
      console.error('Failed to save image:', err);
      throw new Error('Không thể tạo thư mục hoặc lưu ảnh.');
    }
  };

  const connectProjectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      setProjectFolder(handle.name);
      try {
        const srcDir = await handle.getDirectoryHandle('src', { create: true });
        const dataDir = await srcDir.getDirectoryHandle('data', { create: true });
        const fileHandle = await dataDir.getFileHandle('vocab.json');
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        setVocabList(data);
      } catch (e) {
        console.log('No existing vocab.json found on disk, using current data');
      }
    } catch (err) {
      console.error('Directory picker cancelled or failed', err);
    }
  };

  const addVocab = async (newVocab: Omit<Vocab, 'id' | 'createdAt'> & { imageFile?: File | null }) => {
    try {
      let finalImage = newVocab.image;
      if (newVocab.imageFile) {
          finalImage = await saveImageToDisk(newVocab.imageFile);
      }
      const vocabWithId: Vocab = { 
        id: Date.now().toString(),
        english: newVocab.english,
        vietnamese: newVocab.vietnamese,
        type: newVocab.type,
        example: newVocab.example,
        image: finalImage,
        topic: newVocab.topic,
        createdAt: new Date().toISOString()
      };
      setVocabList((prev) => [...prev, vocabWithId]);
      return true;
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
      return false;
    }
  };

  const updateVocab = async (updatedVocab: Vocab & { imageFile?: File | null }) => {
    try {
      let finalImage = updatedVocab.image;
      if (updatedVocab.imageFile) {
          finalImage = await saveImageToDisk(updatedVocab.imageFile);
      }
      const cleanVocab: Vocab = {
        id: updatedVocab.id,
        english: updatedVocab.english,
        vietnamese: updatedVocab.vietnamese,
        type: updatedVocab.type,
        example: updatedVocab.example,
        image: finalImage,
        topic: updatedVocab.topic,
        createdAt: updatedVocab.createdAt,
        lastSeen: updatedVocab.lastSeen,
        correctCount: updatedVocab.correctCount,
        wrongCount: updatedVocab.wrongCount
      };
      setVocabList((prev) =>
        prev.map((v) => (v.id === cleanVocab.id ? cleanVocab : v))
      );
      return true;
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
      return false;
    }
  };

  const deleteVocab = async (id: string) => {
    setVocabList((prev) => prev.filter((v) => v.id !== id));
  };

  const updateStats = (id: string, isCorrect: boolean) => {
    setVocabList((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            lastSeen: new Date().toISOString(),
            correctCount: (v.correctCount || 0) + (isCorrect ? 1 : 0),
            wrongCount: (v.wrongCount || 0) + (isCorrect ? 0 : 1),
          };
        }
        return v;
      })
    );
  };

  const exportVocab = () => {
    const dataStr = JSON.stringify(vocabList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `vocab_export_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importVocab = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const existingWords = new Set(vocabList.map(v => v.english.toLowerCase().trim()));
        const newItems: Vocab[] = [];
        let skipCount = 0;

        data.forEach((item, index) => {
          if (item.english && item.vietnamese) {
            const normalizedEnglish = item.english.toLowerCase().trim();
            if (existingWords.has(normalizedEnglish)) {
              skipCount++;
            } else {
              newItems.push({
                ...item,
                id: item.id || (Date.now() + index).toString(),
                createdAt: item.createdAt || new Date().toISOString(),
              });
              existingWords.add(normalizedEnglish);
            }
          }
        });

        if (newItems.length > 0) {
          setVocabList((prev) => [...prev, ...newItems]);
          alert(`Nhập thành công ${newItems.length} từ mới. Bỏ qua ${skipCount} từ đã tồn tại.`);
          return true;
        } else {
          alert(`Tất cả từ trong file (${skipCount} từ) đều đã tồn tại trong danh sách.`);
          return true;
        }
      }
      alert('File JSON không đúng cấu trúc từ vựng.');
      return false;
    } catch (err) {
      console.error('Import failed:', err);
      alert('Lỗi khi đọc file JSON.');
      return false;
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Bạn có chắc muốn reset toàn bộ dữ liệu về mặc định?')) {
      setVocabList(initialVocabData as Vocab[]);
    }
  };

  return (
    <VocabContext.Provider value={{ 
        vocabList, 
        filteredVocabList,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        addVocab, 
        updateVocab, 
        deleteVocab, 
        updateStats,
        resetToDefault, 
        connectProjectFolder, 
        speak,
        exportVocab,
        importVocab,
        isFolderConnected: !!dirHandle,
        projectFolder
    }}>
      {children}
    </VocabContext.Provider>
  );
};

export const useVocab = () => {
  const context = useContext(VocabContext);
  if (!context) {
    throw new Error('useVocab must be used within a VocabProvider');
  }
  return context;
};
