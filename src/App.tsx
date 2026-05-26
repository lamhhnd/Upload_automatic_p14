import { useState } from "react";

import {
  Box,
  Container,
  Paper,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

import StyleIcon from '@mui/icons-material/Style';
import EditNoteIcon from '@mui/icons-material/EditNote';
import QuizIcon from '@mui/icons-material/Quiz';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import Flashcard from "./components/Flashcard";
import WritingMode from "./components/WritingMode";
import MultipleChoice from "./components/MultipleChoice";
import VocabManager from "./components/VocabManager";
import ReadingManager from "./components/ReadingManager";
import DictionarySearch from "./components/DictionarySearch";
import DateRangeSelector from "./components/DateRangeSelector";
import { VocabProvider } from "./context/VocabContext";
import AIChatBox from "./components/AIChatBox";

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Modern Indigo
    },
    secondary: {
      main: '#ec4899', // Pink
    },
    background: {
      default: '#f8fafc',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
    },
  },
});

function AppContent() {
  const [mode, setMode] = useState<
    "flashcard" | "writing" | "multiple" | "search" | "manage" | "reading"
  >("flashcard");

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        pt: { xs: 2, sm: 4 },
        pb: { xs: 12, sm: 4 },
      }}
    >
      <Container maxWidth={mode === "manage" || mode === "search" || mode === "reading" ? "lg" : "sm"}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              mb: 1
            }}
          >
            Learn Ielts Vocab
          </Typography>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary">
              Master your vocabulary with ease
            </Typography>
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Top Navigation for Desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 4 }}>
              <BottomNavigation
                showLabels
                value={mode}
                onChange={(_, newValue) => {
                  setMode(newValue);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                sx={{ 
                  borderRadius: 3, 
                  backgroundColor: '#f1f5f9',
                  width: '100%',
                  height: 64
                }}
              >
                <BottomNavigationAction label="Cards" value="flashcard" icon={<StyleIcon />} />
                <BottomNavigationAction label="Write" value="writing" icon={<EditNoteIcon />} />
                <BottomNavigationAction label="Quiz" value="multiple" icon={<QuizIcon />} />
                <BottomNavigationAction label="Reading" value="reading" icon={<MenuBookIcon />} />
                <BottomNavigationAction label="Search" value="search" icon={<SearchIcon />} />
                <BottomNavigationAction label="Manage" value="manage" icon={<SettingsIcon />} />
              </BottomNavigation>
            </Box>
          )}

          <Box>
            {(mode === "flashcard" || mode === "writing" || mode === "multiple") && (
              <DateRangeSelector />
            )}
            {mode === "flashcard" && <Flashcard />}
            {mode === "writing" && <WritingMode />}
            {mode === "multiple" && <MultipleChoice />}
            {mode === "reading" && <ReadingManager />}
            {mode === "search" && <DictionarySearch />}
            {mode === "manage" && <VocabManager />}
          </Box>
        </Paper>
      </Container>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            left: 16, 
            right: 16, 
            borderRadius: 4, 
            overflow: 'hidden', 
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 1000
          }} 
          elevation={3}
        >
          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <BottomNavigation
              showLabels
              value={mode}
              onChange={(_, newValue) => {
                setMode(newValue);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              sx={{ 
                height: 72,
                width: 'max-content',
                minWidth: '100%',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 80,
                  px: 1
                }
              }}
            >
              <BottomNavigationAction label="Cards" value="flashcard" icon={<StyleIcon />} />
              <BottomNavigationAction label="Write" value="writing" icon={<EditNoteIcon />} />
              <BottomNavigationAction label="Quiz" value="multiple" icon={<QuizIcon />} />
              <BottomNavigationAction label="Reading" value="reading" icon={<MenuBookIcon />} />
              <BottomNavigationAction label="Search" value="search" icon={<SearchIcon />} />
              <BottomNavigationAction label="Manage" value="manage" icon={<SettingsIcon />} />
            </BottomNavigation>
          </Box>
        </Paper>
      )}

      <AIChatBox />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VocabProvider>
        <AppContent />
      </VocabProvider>
    </ThemeProvider>
  );
}

export default App;