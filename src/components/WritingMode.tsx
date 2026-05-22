import React, { useState, useMemo } from "react";

import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
} from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { useVocab } from "../context/VocabContext";
import { randomIndex } from "./random";
import DictionaryDialog from "./DictionaryDialog";

const WritingMode = () => {
  const { vocabList, speak } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<
    "" | "correct" | "wrong"
  >("");
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

  if (vocabList.length === 0) {
    return (
      <Typography sx={{ textAlign: "center" }}>
        No vocabulary found. Please add some words in the Management tab.
      </Typography>
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
      // Phát âm khi trả lời đúng
      speak(current.english);
    } else {
      setResult("wrong");
    }
  };

  const nextQuestion = () => {
    if (filteredList.length <= 1) return;
    setIndex(
      randomIndex(filteredList.length, index)
    );
    setAnswer("");
    setResult("");
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" sx={{ textAlign: "center", mb: 3, fontWeight: 700 }}>
        Writing Mode
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search by English or Vietnamese..."
          value={searchTerm}
          onChange={(e) => {
              setSearchTerm(e.target.value);
              setIndex(0);
              setAnswer("");
              setResult("");
          }}
        />
        <Autocomplete
          multiple
          options={uniqueTopics}
          value={selectedTopics}
          onChange={(_, newValue) => {
            setSelectedTopics(newValue);
            setIndex(0);
            setAnswer("");
            setResult("");
          }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Filter by Topics" placeholder="Select topics..." />
          )}
        />
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
