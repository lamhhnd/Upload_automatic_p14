import { useState, useMemo, useEffect } from "react";

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
} from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ReorderIcon from '@mui/icons-material/Reorder';

import { useVocab } from "../context/VocabContext";
import { getSmartRandomIndex } from "./random";
import DictionaryDialog from "./DictionaryDialog";

const Flashcard = () => {
  const { filteredVocabList, speak, updateStats } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<number>(0); // 0 (all), 1, 2, 7 days
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [mode, setMode] = useState<"random" | "sequential">("random");

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
            justifyContent: "center",
            height: { xs: 320, sm: 420 },
          }}
        >
          <Box
            onClick={handleFlip}
            sx={{
              width: { xs: '100%', sm: 500 },
              height: '100%',
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
        </Box>
      )}

      {filteredList.length > 0 && (
        <>
          <Typography sx={{ textAlign: "center", mt: 3, mb: 3, color: "#666" }}>
            Click vào card để lật
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={nextCard}
              disabled={filteredList.length <= 1}
            >
              Next Card
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
