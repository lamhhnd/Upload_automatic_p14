import { useState } from "react";

import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import Flashcard from "./components/Flashcard";
import WritingMode from "./components/WritingMode";
import MultipleChoice from "./components/MultipleChoice";
import VocabManager from "./components/VocabManager";
import { VocabProvider } from "./context/VocabContext";

function AppContent() {
  const [mode, setMode] = useState<
    "flashcard" | "writing" | "multiple" | "manage"
  >("flashcard");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        py: 5,
      }}
    >
      <Container maxWidth={mode === "manage" ? "lg" : "md"}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: "#ffffff",
            color: "#222",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Vocabulary App
          </Typography>

          <Typography
            sx={{
              textAlign: "center",
              color: "#666",
              mb: 4,
            }}
          >
            Learn vocabulary with flashcards and quizzes
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "center",
              mb: 4,
              flexWrap: "wrap",
              gap: 1
            }}
          >
            <Button
              variant={
                mode === "flashcard"
                  ? "contained"
                  : "outlined"
              }
              onClick={() => setMode("flashcard")}
            >
              Flashcard
            </Button>

            <Button
              variant={
                mode === "writing"
                  ? "contained"
                  : "outlined"
              }
              onClick={() => setMode("writing")}
            >
              Writing
            </Button>

            <Button
              variant={
                mode === "multiple"
                  ? "contained"
                  : "outlined"
              }
              onClick={() => setMode("multiple")}
            >
              Multiple Choice
            </Button>

            <Button
              variant={
                mode === "manage"
                  ? "contained"
                  : "outlined"
              }
              color="secondary"
              onClick={() => setMode("manage")}
            >
              Manage Vocab
            </Button>
          </Stack>

          {mode === "flashcard" && <Flashcard />}
          {mode === "writing" && <WritingMode />}
          {mode === "multiple" && <MultipleChoice />}
          {mode === "manage" && <VocabManager />}
        </Paper>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <VocabProvider>
      <AppContent />
    </VocabProvider>
  );
}

export default App;