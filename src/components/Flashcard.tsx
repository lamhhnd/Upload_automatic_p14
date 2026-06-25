import { useState, useMemo, useEffect, useRef } from "react";

import {
  Box,
  Button,
  Card,
  Typography,
  TextField,
  IconButton,
  Stack,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ReorderIcon from '@mui/icons-material/Reorder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ImageIcon from '@mui/icons-material/Image';

import { useVocab } from "../context/VocabContext";
import { getSmartRandomIndex } from "./random";
import DictionaryDialog from "./DictionaryDialog";
import { searchImages, UnsplashImage } from "../services/ImageService";

const Flashcard = () => {
  const { filteredVocabList, speak, updateStats, updateVocab } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<number>(0); // 0 (all), 1, 2, 7 days
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [mode, setMode] = useState<"random" | "sequential">("random");
  const [isAutoplay, setIsAutoplay] = useState(false);
  const autoplayRef = useRef(false);

  const [suggestedImages, setSuggestedImages] = useState<UnsplashImage[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);

  const uniqueTopics = useMemo(() => {
    const topics = filteredVocabList
      .map((v) => v.topic)
      .filter((t): t is string => !!t);
    return Array.from(new Set(topics)).sort();
  }, [filteredVocabList]);

  // Lọc danh sách từ vựng theo nội dung tìm kiếm, chủ đề và thời gian
  const filteredList = useMemo(() => {
    return filteredVocabList.filter((item) => {
      const matchesSearch =
        item.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vietnamese.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTopic = 
        selectedTopics.length === 0 || 
        (item.topic && selectedTopics.includes(item.topic));

      let matchesDate = true;
      if (dateFilter !== 0 && item.createdAt) {
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        // Tính toán khoảng cách ngày: Lấy ngày hiện tại trừ ngày tạo
        const diffTime = now.getTime() - itemDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        matchesDate = diffDays < dateFilter;
      }

      return matchesSearch && matchesTopic && matchesDate;
    });
  }, [filteredVocabList, searchTerm, selectedTopics, dateFilter]);

  const speakWithPromise = (text: string, lang: string = 'en-US'): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        // Find voice matching the language
        const preferredVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
                               voices.find(v => v.lang === lang);
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  useEffect(() => {
    if (!isAutoplay) return;
    
    let cancelled = false;
    const play = async () => {
      let currentIndex = index;
      while (!cancelled && autoplayRef.current) {
        const item = filteredList[currentIndex];
        if (!item) break;
        
        // Ensure card is not flipped during reading
        setFlipped(false);
        await new Promise(r => setTimeout(r, 500)); // Pause before starting word

        await speakWithPromise(item.english, 'en-US');
        await new Promise(r => setTimeout(r, 1000)); // Pause between word and meaning
        
        await speakWithPromise(item.vietnamese, 'vi-VN');
        await new Promise(r => setTimeout(r, 1000)); // Pause between meaning and example
        
        await speakWithPromise(item.example, 'en-US');
        await new Promise(r => setTimeout(r, 5000)); // 5s Pause between words
        
        if (cancelled || !autoplayRef.current) break;
        
        currentIndex = (currentIndex + 1) % filteredList.length;
        setIndex(currentIndex);
      }
      setIsAutoplay(false);
    };
    play();
    return () => { cancelled = true; };
  }, [isAutoplay, filteredList, index]);

  // Reset index khi bộ lọc thay đổi
  useEffect(() => {
    if (filteredList.length > 0) {
      setIndex(Math.floor(Math.random() * filteredList.length));
    } else {
      setIndex(0);
    }
    setFlipped(false);
  }, [searchTerm, selectedTopics, dateFilter, filteredList.length]);

  const current = filteredList[index] || filteredList[0];

  // Reset suggested images when card changes
  useEffect(() => {
    setSuggestedImages([]);
  }, [current]);

  const handleFlip = () => {
    if (current && !flipped) {
      updateStats(current.id, true);
    }
    setFlipped(!flipped);
  };

  const nextCard = () => {
    if (filteredList.length <= 1) return;
    if (current) {
      updateStats(current.id, true);
    }
    
    if (mode === "random") {
      setIndex(getSmartRandomIndex(filteredList, index));
    } else {
      setIndex((prev) => (prev + 1) % filteredList.length);
    }
    setFlipped(false);
  };

  const handleUpdateImage = async (img: UnsplashImage) => {
    if (!current) return;
    try {
      const response = await fetch(img.urls.regular);
      const blob = await response.blob();
      const file = new File([blob], `${current.english}.jpg`, { type: 'image/jpeg' });
      
      const success = await updateVocab({
        ...current,
        imageFile: file
      });
      
      if (success) {
        setSuggestedImages([]);
      }
    } catch (error) {
      console.error("Failed to update image:", error);
      alert("Không thể cập nhật ảnh.");
    }
  };

  return (
    <Box>
      {/* MODE SWITCH & FILTERS */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode) setMode(newMode);
          }}
          aria-label="learning mode"
          fullWidth
        >
          <ToggleButton value="random" aria-label="random">
            <ShuffleIcon sx={{ mr: 1 }} /> Random
          </ToggleButton>
          <ToggleButton value="sequential" aria-label="sequential">
            <ReorderIcon sx={{ mr: 1 }} /> Sequential
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          fullWidth
          variant="outlined"
          label="Search by English or Vietnamese..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <Autocomplete
          multiple
          options={uniqueTopics}
          value={selectedTopics}
          onChange={(_, newValue: string[]) => setSelectedTopics(newValue)}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Filter by Topics" placeholder="Select topics..." />
          )}
        />

        <ToggleButtonGroup
          value={dateFilter}
          exclusive
          onChange={(_, newDate) => {
            if (newDate !== null) setDateFilter(newDate);
          }}
          aria-label="date filter"
          fullWidth
        >
          <ToggleButton value={1}>1 Day</ToggleButton>
          <ToggleButton value={2}>2 Days</ToggleButton>
          <ToggleButton value={7}>7 Days</ToggleButton>
          <ToggleButton value={0}>All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {filteredList.length === 0 ? (
        <Typography sx={{ textAlign: "center", color: "#666", mt: 4 }}>
          No vocabulary found matching your filters.
        </Typography>
      ) : (
        <Box
          sx={{
            perspective: "1000px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            onClick={handleFlip}
            sx={{
              width: { xs: '100%', sm: 500 },
              height: { xs: 320, sm: 420 },
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s ease",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              cursor: "pointer",
            }}
          >
            {/* Front */}
            <Card
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backfaceVisibility: "hidden",
                borderRadius: 4,
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                p: 3,
              }}
            >
              {current.image && (
                <Box
                  component="img"
                  src={current.image}
                  alt={current.english}
                  sx={{
                    width: "100%",
                    maxHeight: { xs: 120, sm: 180 },
                    objectFit: "cover",
                    mb: 2,
                    borderRadius: 2,
                  }}
                />
              )}
              <Typography variant="h3" sx={{ fontWeight: 700, color: "#1976d2", fontSize: { xs: '2rem', sm: '3rem' } }}>
                {current.english}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: "#666", fontStyle: "italic", mb: 2 }}>
                ({current.type})
              </Typography>
              
              <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                <IconButton color="secondary" onClick={() => setDictionaryOpen(true)} title="Lookup Dictionary">
                  <MenuBookIcon />
                </IconButton>
                <IconButton color="primary" onClick={() => speak(current.english)} title="Speak">
                  <VolumeUpIcon />
                </IconButton>
                <IconButton 
                  color="warning" 
                  onClick={async () => {
                    setIsSearchingImages(true);
                    try {
                      const images = await searchImages(current.english);
                      setSuggestedImages(images);
                    } finally {
                      setIsSearchingImages(false);
                    }
                  }} 
                  title="Suggest Images"
                  disabled={isSearchingImages}
                >
                  <ImageIcon />
                </IconButton>
              </Stack>
            </Card>

            {/* Back */}
            <Card
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: 4,
                backgroundColor: "#1976d2",
                color: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                p: 3,
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', sm: '3rem' } }}>
                {current.vietnamese}
              </Typography>
              <Typography variant="h6" sx={{ textAlign: "center", opacity: 0.9, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {current.example}
              </Typography>
            </Card>
          </Box>

          {/* Gợi ý ảnh cho Flashcard */}
          {suggestedImages.length > 0 && (
            <Box sx={{ mt: 3, width: { xs: '100%', sm: 500 } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                Gợi ý hình ảnh (Click để cập nhật cho từ này):
              </Typography>
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                  overflowX: 'auto', 
                  pb: 1,
                  justifyContent: 'center',
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: 3 }
                }}
              >
                {suggestedImages.map((img) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={img.urls.thumb}
                    alt={img.alt_description}
                    onClick={() => handleUpdateImage(img)}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
          {isSearchingImages && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Đang tìm ảnh gợi ý...</Typography>
            </Box>
          )}
        </Box>
      )}

      {filteredList.length > 0 && (
        <>
          <Typography sx={{ textAlign: "center", mt: 3, mb: 3, color: "#666" }}>
            Click vào card để lật
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={nextCard}
              disabled={filteredList.length <= 1 || isAutoplay}
            >
              Next Card
            </Button>
            
            <Button
              fullWidth
              variant={isAutoplay ? "outlined" : "contained"}
              color={isAutoplay ? "error" : "primary"}
              size="large"
              startIcon={isAutoplay ? <StopIcon /> : <PlayArrowIcon />}
              onClick={() => {
                autoplayRef.current = !isAutoplay;
                setIsAutoplay(!isAutoplay);
                if (isAutoplay) {
                    window.speechSynthesis.cancel();
                }
              }}
            >
              {isAutoplay ? "Stop Autoplay" : "Start Autoplay"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: '#999' }}>
            Words found: {filteredList.length}
          </Typography>
        </>
      )}

      {current && (
        <DictionaryDialog 
          open={dictionaryOpen}
          onClose={() => setDictionaryOpen(false)}
          word={current.english}
        />
      )}
    </Box>
  );
};

export default Flashcard;
