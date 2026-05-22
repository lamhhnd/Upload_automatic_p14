import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AddIcon from '@mui/icons-material/Add';
import TranslateIcon from '@mui/icons-material/Translate';
import { fetchDictionaryEntry, DictionaryEntry, Meaning, Definition } from '../services/DictionaryService';
import { translateToVietnamese } from '../services/TranslationService';
import { useVocab } from '../context/VocabContext';

const DictionarySearch: React.FC = () => {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [autoTranslation, setAutoTranslation] = useState('');
  const { speak, addVocab } = useVocab();

  // State for Saving Dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveData, setSaveData] = useState({
    english: '',
    vietnamese: '',
    type: '',
    example: '',
    topic: 'General'
  });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    setEntries([]);
    setAutoTranslation('');
    
    try {
      // Run both in parallel
      const [dictData, translation] = await Promise.all([
        fetchDictionaryEntry(word.trim()),
        translateToVietnamese(word.trim())
      ]);
      
      setEntries(dictData);
      setAutoTranslation(translation);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const openSaveDialog = (entry: DictionaryEntry, meaning: Meaning, def: Definition) => {
    setSaveData({
      english: entry.word,
      vietnamese: autoTranslation,
      type: meaning.partOfSpeech,
      example: def.example || '',
      topic: 'General'
    });
    setSaveDialogOpen(true);
  };

  const handleSave = async () => {
    if (!saveData.vietnamese.trim()) {
      alert('Please enter Vietnamese meaning.');
      return;
    }

    const success = await addVocab({
      english: saveData.english,
      vietnamese: saveData.vietnamese,
      type: saveData.type,
      example: saveData.example,
      topic: saveData.topic,
    });

    if (success) {
      setSaveDialogOpen(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ textAlign: "center", mb: 4, fontWeight: 700 }}>
        Search Dictionary
      </Typography>

      <form onSubmit={handleSearch}>
        <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for a word (e.g., 'ephemeral', 'serendipity')..."
            value={word}
            onChange={(e) => setWord(e.target.value)}
            disabled={loading}
          />
          <Button
            variant="contained"
            size="large"
            type="submit"
            disabled={loading || !word.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          >
            Search
          </Button>
        </Stack>
      </form>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {entries.map((entry, entryIndex) => (
          <Card key={entryIndex} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700, textTransform: 'lowercase' }}>
                    {entry.word}
                  </Typography>
                  {entry.phonetic && (
                    <Typography variant="subtitle1" color="text.secondary">
                      {entry.phonetic}
                    </Typography>
                  )}
                </Box>
                <IconButton color="primary" onClick={() => speak(entry.word)} size="large" sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}>
                  <VolumeUpIcon fontSize="large" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                {entry.phonetics.filter(p => p.audio).map((p, i) => (
                  <Chip
                    key={i}
                    label={p.text || 'Audio'}
                    onClick={() => playAudio(p.audio!)}
                    icon={<VolumeUpIcon />}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>

              {entry.meanings.map((meaning, meaningIndex) => (
                <Box key={meaningIndex} sx={{ mb: 4 }}>
                  <Typography variant="h6" color="secondary" sx={{ textTransform: 'capitalize', fontWeight: 600, mb: 1 }}>
                    {meaning.partOfSpeech}
                  </Typography>
                  <List>
                    {meaning.definitions.map((def, defIndex) => (
                      <ListItem
                        key={defIndex}
                        alignItems="flex-start"
                        sx={{
                          flexDirection: 'column',
                          borderLeft: '4px solid',
                          borderColor: 'primary.light',
                          mb: 2,
                          bgcolor: 'action.hover',
                          borderRadius: '0 8px 8px 0'
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
                          <ListItemText
                            primary={<Typography variant="body1" sx={{ fontWeight: 500 }}>{def.definition}</Typography>}
                            secondary={
                              def.example && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
                                  "{def.example}"
                                </Typography>
                              )
                            }
                          />
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={() => openSaveDialog(entry, meaning, def)}
                            sx={{ height: 'fit-content', ml: 2 }}
                          >
                            Save
                          </Button>
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                  {meaning.synonyms.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Synonyms:</Typography>
                      {meaning.synonyms.slice(0, 5).map((s, i) => (
                        <Chip key={i} label={s} size="small" sx={{ mr: 0.5, mb: 0.5 }} onClick={() => { setWord(s); handleSearch(); }} />
                      ))}
                    </Box>
                  )}
                  {meaningIndex < entry.meanings.length - 1 && <Divider sx={{ mt: 3 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Save to Vocabulary Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add to Vocabulary</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="English"
              fullWidth
              value={saveData.english}
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="Vietnamese Meaning"
              fullWidth
              autoFocus
              value={saveData.vietnamese}
              onChange={(e) => setSaveData({ ...saveData, vietnamese: e.target.value })}
            />
            <TextField
              label="Type"
              fullWidth
              value={saveData.type}
              onChange={(e) => setSaveData({ ...saveData, type: e.target.value })}
            />
            <TextField
              label="Topic"
              fullWidth
              value={saveData.topic}
              onChange={(e) => setSaveData({ ...saveData, topic: e.target.value })}
            />
            <TextField
              label="Example Sentence"
              fullWidth
              multiline
              rows={3}
              value={saveData.example}
              onChange={(e) => setSaveData({ ...saveData, example: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save to List
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DictionarySearch;
