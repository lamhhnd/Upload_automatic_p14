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

import { useVocab } from "../context/VocabContext";
import { randomIndex } from "./random";

const WritingMode = () => {
  const { vocabList, speak } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<
    "" | "correct" | "wrong"
  >("");

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

      const itemDate = item.createdAt ? new Date(item.createdAt) : null;
      let matchesDate = true;

      /*
      if (itemDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) matchesDate = false;
        }
      } else if (startDate || endDate) {
        matchesDate = false;
      }
      */

      return matchesSearch && matchesTopic && matchesDate;
    });
  }, [vocabList, searchTerm, selectedTopics]); // Removed startDate, endDate

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
    <Box>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 3,
          fontWeight: 600,
        }}
      >
        Writing Mode
      </Typography>

      {/* SEARCH & FILTERS */}
      <Stack spacing={2} sx={{ mb: 4 }}>
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
    <TextField
      {...params}
      variant="outlined"
      label="Filter by Topics"
      placeholder="Select topics..."
    />
  )}
/>

        {/* <Stack direction="row" spacing={2}>
          <TextField
            label="From Date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => {
                setStartDate(e.target.value);
                setIndex(0);
                setAnswer("");
                setResult("");
            }}
            fullWidth
          />
          <TextField
            label="To Date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => {
                setEndDate(e.target.value);
                setIndex(0);
                setAnswer("");
                setResult("");
            }}
            fullWidth
          />
        </Stack> */}
      </Stack>

      {filteredList.length === 0 ? (
          <Alert severity="info">No words found with current filters.</Alert>
      ) : current ? (
          <>
            {/* VOCAB IMAGE */}
            {current.image && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Box
                  component="img"
                  src={current.image}
                  alt="Vocabulary hint"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 250,
                    objectFit: "contain",
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "1px solid #eee"
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                }}
              >
                {current.vietnamese}
              </Typography>
              <IconButton color="primary" onClick={() => speak(current.english)} size="small">
                <VolumeUpIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                mb: 3,
                color: "#666",
                fontStyle: "italic",
              }}
            >
              Type: {current.type}
            </Typography>

            <TextField
              fullWidth
              label="English word"
              value={answer}
              onChange={(e) =>
                setAnswer(e.target.value)
              }
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  checkAnswer();
                }
              }}
              autoFocus
            />

            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                variant="contained"
                onClick={checkAnswer}
              >
                Check
              </Button>

              <Button
                variant="outlined"
                onClick={nextQuestion}
                disabled={filteredList.length <= 1}
              >
                Next
              </Button>
            </Stack>

            {result === "correct" && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="success">
                  Correct!
                </Alert>
                <Typography variant="body1" sx={{ mt: 2, fontStyle: "italic" }}>
                  Example: {current.example}
                </Typography>
              </Box>
            )}

            {result === "wrong" && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Wrong! Correct answer:{" "}
                {current.english}
              </Alert>
            )}
          </>
      ) : null}
    </Box>
  );
};

export default WritingMode;
