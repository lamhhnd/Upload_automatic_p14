import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { fetchDictionaryEntry, DictionaryEntry, Meaning, Definition } from '../services/DictionaryService';
import { useVocab } from '../context/VocabContext';

interface DictionaryDialogProps {
  open: boolean;
  onClose: () => void;
  word: string;
  onSelectData?: (data: { type: string; example: string }) => void;
}

const DictionaryDialog: React.FC<DictionaryDialogProps> = ({ open, onClose, word, onSelectData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const { speak } = useVocab();

  React.useEffect(() => {
    if (open && word) {
      handleLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, word]);

  const handleLookup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDictionaryEntry(word);
      setEntries(data);
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

  const handleSelect = (meaning: Meaning, definition: Definition) => {
    if (onSelectData) {
      onSelectData({
        type: meaning.partOfSpeech,
        example: definition.example || ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Dictionary: {word}
        <IconButton onClick={() => speak(word)} color="primary">
          <VolumeUpIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && entries.length === 0 && (
          <Typography color="text.secondary">No data available.</Typography>
        )}

        {!loading && entries.map((entry, entryIndex) => (
          <Box key={entryIndex} sx={{ mb: 4 }}>
            {entry.phonetic && (
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {entry.phonetic}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {entry.phonetics.filter(p => p.audio).map((p, i) => (
                <Chip
                  key={i}
                  label={`Audio ${p.text || ''}`}
                  onClick={() => playAudio(p.audio!)}
                  icon={<VolumeUpIcon />}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>

            {entry.meanings.map((meaning, meaningIndex) => (
              <Box key={meaningIndex} sx={{ mt: 2 }}>
                <Typography variant="h6" color="secondary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                  {meaning.partOfSpeech}
                </Typography>
                <List dense>
                  {meaning.definitions.map((def, defIndex) => (
                    <ListItem 
                      key={defIndex} 
                      alignItems="flex-start"
                      sx={{ 
                        flexDirection: 'column', 
                        borderLeft: '3px solid', 
                        borderColor: 'divider',
                        mb: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        cursor: onSelectData ? 'pointer' : 'default'
                      }}
                      onClick={() => onSelectData && handleSelect(meaning, def)}
                    >
                      <ListItemText
                        primary={def.definition}
                        secondary={
                          def.example ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                              " {def.example} "
                            </Typography>
                          ) : null
                        }
                      />
                      {onSelectData && (
                        <Button size="small" variant="text" sx={{ alignSelf: 'flex-end', mt: -1 }}>
                          Select this
                        </Button>
                      )}
                    </ListItem>
                  ))}
                </List>
                {meaning.synonyms.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Synonyms: </Typography>
                    {meaning.synonyms.slice(0, 5).map((s, i) => (
                      <Chip key={i} label={s} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                )}
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DictionaryDialog;
