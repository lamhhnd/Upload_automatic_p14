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
}

interface VocabContextType {
  vocabList: Vocab[];
  addVocab: (vocab: Omit<Vocab, 'id' | 'createdAt'> & { imageFile?: File | null }) => Promise<boolean>;
  updateVocab: (vocab: Vocab & { imageFile?: File | null }) => Promise<boolean>;
  deleteVocab: (id: string) => Promise<void>;
  resetToDefault: () => void;
  connectProjectFolder: () => Promise<void>;
  speak: (text: string) => void;
  isFolderConnected: boolean;
  projectFolder: string;
}

const VocabContext = createContext<VocabContextType | undefined>(undefined);

export const VocabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabList, setVocabList] = useState<Vocab[]>(() => {
    const saved = localStorage.getItem('vocab_data');
    return saved ? JSON.parse(saved) : (initialVocabData as Vocab[]);
  });

  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [projectFolder, setProjectFolder] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('vocab_data', JSON.stringify(vocabList));
    if (dirHandle) {
      saveToDisk(vocabList);
    }
  }, [vocabList, dirHandle]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Hủy mọi yêu cầu phát âm đang chờ
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Tốc độ nói hơi chậm một chút để dễ nghe
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Trình duyệt không hỗ trợ phát âm.');
    }
  };

  const saveToDisk = async (data: Vocab[]) => {
    if (!dirHandle) return;
    try {
      // Tự động tạo src và src/data nếu thiếu
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
  };

  const saveImageToDisk = async (file: File): Promise<string> => {
    if (!dirHandle) {
      // Fallback for mobile: Compress and convert to Base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize if too large (max 800px width/height)
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
            
            // Compress to JPEG with 0.7 quality
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
      // Tự động tạo public và public/images nếu thiếu
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
      throw new Error('Không thể tạo thư mục hoặc lưu ảnh. Vui lòng đảm bảo bạn đã chọn đúng thư mục gốc của dự án.');
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
        createdAt: updatedVocab.createdAt
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

  const resetToDefault = () => {
    if (window.confirm('Bạn có chắc muốn reset toàn bộ dữ liệu về mặc định?')) {
      setVocabList(initialVocabData as Vocab[]);
    }
  };

  return (
    <VocabContext.Provider value={{ 
        vocabList, 
        addVocab, 
        updateVocab, 
        deleteVocab, 
        resetToDefault, 
        connectProjectFolder, 
        speak,
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
