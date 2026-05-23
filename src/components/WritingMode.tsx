import React, { useState, useMemo, useEffect } from "react";

import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { useVocab } from "../context/VocabContext";
import { getSmartRandomIndex } from "./random";
import DictionaryDialog from "./DictionaryDialog";

const WritingMode = () => {
  const { filteredVocabList, speak, updateStats } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<number>(0);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<
    "" | "correct" | "wrong"
  >("");
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

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
    setAnswer("");
    setResult("");
  }, [searchTerm, selectedTopics, dateFilter, filteredList.length]);

  if (filteredVocabList.length === 0) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto' }}>
        <Typography sx={{ textAlign: "center", color: "#666" }}>
          No vocabulary found. Please add some words in the Management tab.
        </Typography>
      </Box>
    );
  }

  const current = filteredList.length > 0 ? filteredList[index] || filteredList[0] : null;

  const checkAnswer = () => {
    if (!current) return;
    if (
      answer.trim().toLowerCase() ===
      current.english.toLowerCase()
    ) {
      setResult("correct");
      updateStats(current.id, true);
      // Phát âm khi trả lời đúng
      speak(current.english);
    } else {
      setResult("wrong");
      updateStats(current.id, false);
    }
  };

  const nextQuestion = () => {
    if (filteredList.length <= 1) return;
    setIndex(getSmartRandomIndex(filteredList, index));
    setAnswer("");
    setResult("");
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>

      <Stack spacing={2} sx={{ mb: 3 }}>
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
          onChange={(_, newValue) => setSelectedTopics(newValue)}
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
          <Alert severity="info">No words found with current filters.</Alert>
      ) : current ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {current.image && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  component="img"
                  src={current.image}
                  alt="Vocabulary hint"
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>{current.vietnamese}</Typography>
              <IconButton color="primary" onClick={() => speak(current.english)} size="small">
                <VolumeUpIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>
              Type: {current.type}
            </Typography>
<TextField
  fullWidth
  label="English word"
  value={answer}
  onChange={(e) => setAnswer(e.target.value)}
  onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
  disabled={result !== ""}
/>

            {/* Fixed height container for status feedback */}
            <Box sx={{ minHeight: 120 }}>
              {result === "" && (
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Button fullWidth variant="contained" onClick={checkAnswer}>Check</Button>
                  <Button fullWidth variant="outlined" onClick={nextQuestion} disabled={filteredList.length <= 1}>Next</Button>
                </Stack>
              )}

              {result === "correct" && (
                <Box sx={{ mt: 1 }}>
                  <Alert 
                    severity="success"
                    action={<Button color="inherit" size="small" startIcon={<MenuBookIcon />} onClick={() => setDictionaryOpen(true)}>Explore</Button>}
                  >
                    Correct!
                  </Alert>
                  <Typography variant="body1" sx={{ mt: 1, fontStyle: "italic" }}>Example: {current.example}</Typography>
                  <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={nextQuestion}>Continue</Button>
                </Box>
              )}

              {result === "wrong" && (
                <Box sx={{ mt: 1 }}>
                  <Alert severity="error">Wrong! Answer: <strong>{current.english}</strong></Alert>
                  <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={nextQuestion}>Try Next</Button>
                </Box>
              )}
            </Box>

            <DictionaryDialog 
              open={dictionaryOpen}
              onClose={() => setDictionaryOpen(false)}
              word={current.english}
            />
          </Box>
      ) : null}
    </Box>

  );
};

export default WritingMode;
