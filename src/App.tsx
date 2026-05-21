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
        py: { xs: 2, sm: 5 },
        pb: { xs: 10, sm: 5 }, // Extra padding for mobile nav
      }}
    >
      <Container maxWidth={mode === "manage" ? "lg" : "md"} sx={{ px: { xs: 1, sm: 2 } }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: { xs: 2, sm: 4 },
            backgroundColor: "#ffffff",
            color: "#222",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 800,
              textAlign: "center",
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
              color: '#1976d2'
            }}
          >
            EnglishLearn
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "center",
              mb: 4,
              flexWrap: "wrap",
              gap: 1,
              // On mobile, show as a grid or scrollable if many
              display: { xs: 'grid', sm: 'flex' },
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'none' }
            }}
          >
            <Button
              fullWidth
              variant={mode === "flashcard" ? "contained" : "outlined"}
              onClick={() => setMode("flashcard")}
              sx={{ borderRadius: 2 }}
            >
              Flashcard
            </Button>
            <Button
              fullWidth
              variant={mode === "writing" ? "contained" : "outlined"}
              onClick={() => setMode("writing")}
              sx={{ borderRadius: 2 }}
            >
              Writing
            </Button>
            <Button
              fullWidth
              variant={mode === "multiple" ? "contained" : "outlined"}
              onClick={() => setMode("multiple")}
              sx={{ borderRadius: 2 }}
            >
              Quiz
            </Button>
            <Button
              fullWidth
              variant={mode === "manage" ? "contained" : "outlined"}
              color="secondary"
              onClick={() => setMode("manage")}
              sx={{ borderRadius: 2 }}
            >
              Manage
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            {mode === "flashcard" && <Flashcard />}
            {mode === "writing" && <WritingMode />}
            {mode === "multiple" && <MultipleChoice />}
            {mode === "manage" && <VocabManager />}
          </Box>
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