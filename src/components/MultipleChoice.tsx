import React, { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
  TextField,
  Autocomplete,
} from "@mui/material";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

import { useVocab } from "../context/VocabContext";
import { randomIndex } from "./random";

type QuizMode =
  | "vn-to-en"
  | "en-to-vn";

const MultipleChoice = () => {
  const { vocabList, speak } = useVocab();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  const [index, setIndex] = useState(0);

  const uniqueTopics = useMemo(() => {
    const topics = vocabList
      .map((v) => v.topic)
      .filter((t): t is string => !!t);
    return Array.from(new Set(topics)).sort();
  }, [vocabList]);

  const [result, setResult] = useState<
    "" | "correct" | "wrong"
  >("");

  const [mode, setMode] =
    useState<QuizMode>("vn-to-en");

  // Lọc danh sách từ vựng theo nội dung tìm kiếm và thời gian
  const filteredList = useMemo(() => {
    return vocabList.filter((item) => {
      const matchesSearch =
        item.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vietnamese.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTopic = 
        selectedTopics.length === 0 || 
        (item.topic && selectedTopics.includes(item.topic));

      /*
      const itemDate = item.createdAt ? new Date(item.createdAt) : null;
      let matchesDate = true;

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

      return matchesSearch && matchesTopic;
    });
  }, [vocabList, searchTerm, selectedTopics]); // Removed startDate, endDate

  const current = filteredList.length > 0 ? filteredList[index] || filteredList[0] : null;

  const choices = useMemo(() => {
    if (!current || filteredList.length === 0) return [];
    
    // Lấy tối đa 3 đáp án sai từ danh sách đã lọc
    let wrongAnswers = filteredList
      .filter((item) => item.id !== current.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Nếu không đủ đáp án sai từ danh sách lọc, lấy thêm từ danh sách gốc
    if (wrongAnswers.length < 3) {
        const extraWrong = vocabList
            .filter((item) => item.id !== current.id && !wrongAnswers.find(wa => wa.id === item.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, 3 - wrongAnswers.length);
        wrongAnswers = [...wrongAnswers, ...extraWrong];
    }

    // Kết hợp đáp án đúng và các đáp án sai, sau đó trộn ngẫu nhiên
    return [...wrongAnswers, current].sort(() => Math.random() - 0.5);
  }, [current, filteredList, vocabList]);

  if (vocabList.length === 0) {
    return (
      <Typography sx={{ textAlign: "center" }}>
        No vocabulary found. Please add some words in the Management tab.
      </Typography>
    );
  }

  const nextQuestion = () => {
    setIndex(
      randomIndex(filteredList.length, index)
    );

    setResult("");
  };

  const chooseAnswer = (answer: string) => {
    if (!current) return;
    const correctAnswer =
      mode === "vn-to-en"
        ? current.english
        : current.vietnamese;

    if (answer === correctAnswer) {
      setResult("correct");
      // Phát âm khi trả lời đúng
      speak(current.english);
    } else {
      setResult("wrong");
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 3,
          fontWeight: 700,
          color: "#222",
        }}
      >
        Multiple Choice
      </Typography>

      {/* SEARCH & FILTERS - Optimized to not auto-trigger re-renders or layout jumps */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search by English or Vietnamese..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
              setIndex(0);
              setResult("");
          }}
        />
        <Autocomplete
          multiple
          options={uniqueTopics}
          value={selectedTopics}
          onChange={(_, newValue: string[]) => {
              setSelectedTopics(newValue);
              setIndex(0);
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
            {/* MODE SWITCH */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={(_, value) => {
                  if (value) {
                    setMode(value);
                    setResult("");
                  }
                }}
              >
                <ToggleButton value="vn-to-en">VN → EN</ToggleButton>
                <ToggleButton value="en-to-vn">EN → VN</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* QUESTION */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ textAlign: "center", color: "#333", fontWeight: 600 }}>
                {mode === "vn-to-en" ? current.vietnamese : current.english}
              </Typography>
              {mode === "en-to-vn" && (
                <IconButton color="primary" onClick={() => speak(current.english)}>
                  <VolumeUpIcon />
                </IconButton>
              )}
            </Box>

            {/* ANSWERS */}
            <Stack spacing={1.5}>
              {choices.map((choice) => {
                const answerText = mode === "vn-to-en" ? choice.english : choice.vietnamese;
                return (
                  <Button
                    key={choice.id}
                    variant="outlined"
                    size="large"
                    onClick={() => chooseAnswer(answerText)}
                    disabled={result !== ""}
                    sx={{ py: 1.5, textTransform: "none", fontSize: 16 }}
                  >
                    {answerText}
                  </Button>
                );
              })}
            </Stack>

            {/* RESULT & NEXT CONTAINER */}
            <Box sx={{ mt: 1, minHeight: 100 }}>
              {result === "correct" && <Alert severity="success" sx={{ mb: 1 }}>Correct!</Alert>}
              {result === "wrong" && <Alert severity="error" sx={{ mb: 1 }}>Wrong Answer!</Alert>}

              {result !== "" && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={nextQuestion}
                  disabled={filteredList.length <= 1}
                >
                  Next Question
                </Button>
              )}
            </Box>
          </Box>
      ) : null}
    </Box>
  );
};

export default MultipleChoice;
