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
} from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { useVocab } from "../context/VocabContext";
import { randomIndex } from "./random";
import DictionaryDialog from "./DictionaryDialog";

const Flashcard = () => {
  const { vocabList, speak } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  const uniqueTopics = useMemo(() => {
    const topics = vocabList
      .map((v) => v.topic)
      .filter((t): t is string => !!t);
    return Array.from(new Set(topics)).sort();
  }, [vocabList]);

  // Lọc danh sách từ vựng theo nội dung tìm kiếm và thời gian
  const filteredList = useMemo(() => {
    return vocabList.filter((item) => {
      const matchesSearch =
        item.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vietnamese.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTopic = 
        selectedTopics.length === 0 || 
        (item.topic && selectedTopics.includes(item.topic));

      return matchesSearch && matchesTopic;
    });
  }, [vocabList, searchTerm, selectedTopics]);

  // Reset index về 0 khi tìm kiếm thay đổi
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [searchTerm, selectedTopics]);

  if (vocabList.length === 0) {
    return (
      <Typography sx={{ textAlign: "center" }}>
        No vocabulary found. Please add some words in the Management tab.
      </Typography>
    );
  }

  const current = filteredList[index] || filteredList[0];

  if (filteredList.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ textAlign: "center", mb: 4, fontWeight: 700 }}>
          Flashcard
        </Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
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
        </Stack>
        <Typography sx={{ textAlign: "center", color: "#666" }}>
          No words match your search.
        </Typography>
      </Box>
    );
  }

  const nextCard = () => {
    if (filteredList.length <= 1) return;
    setIndex(randomIndex(filteredList.length, index));
    setFlipped(false);
  };

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 4,
          fontWeight: 700,
          color: "#222",
        }}
      >
        Flashcard
      </Typography>

      {/* SEARCH & FILTERS */}
      <Stack spacing={2} sx={{ mb: 4 }}>
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
      </Stack>

      <Box
        sx={{
          perspective: "1000px",
          display: "flex",
          justifyContent: "center",
          height: { xs: 320, sm: 420 },
        }}
      >
        <Box
          onClick={() => setFlipped(!flipped)}
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

      <DictionaryDialog 
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        word={current.english}
      />
    </Box>
  );
};

export default Flashcard;
