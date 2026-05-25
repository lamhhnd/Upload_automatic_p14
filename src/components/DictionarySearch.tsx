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
  Autocomplete,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AddIcon from '@mui/icons-material/Add';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import { fetchDictionaryEntry, DictionaryEntry, Meaning, Definition, fetchVietnameseMeaning, VietnameseMeaning } from '../services/DictionaryService';
import { translateToVietnamese } from '../services/TranslationService';
import { useVocab, STANDARD_TOPICS } from '../context/VocabContext';
import { searchImages, UnsplashImage } from '../services/ImageService';

const DictionarySearch: React.FC = () => {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [viMeaning, setViMeaning] = useState<VietnameseMeaning | null>(null);
  const [autoTranslation, setAutoTranslation] = useState('');
  const { speak, addVocab } = useVocab();

  // State for Saving Dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveData, setSaveData] = useState<{
    english: string;
    vietnamese: string;
    type: string;
    example: string;
    topic: string;
    imageFile?: File | null;
  }>({
    english: '',
    vietnamese: '',
    type: '',
    example: '',
    topic: 'General',
    imageFile: null
  });

  const [suggestedImages, setSuggestedImages] = useState<UnsplashImage[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Tự động tìm kiếm ảnh khi hộp thoại mở
  React.useEffect(() => {
    if (saveDialogOpen && saveData.english) {
      const fetchImages = async () => {
        setIsSearchingImages(true);
        try {
          const images = await searchImages(saveData.english);
          setSuggestedImages(images);
        } finally {
          setIsSearchingImages(false);
        }
      };
      fetchImages();
    } else {
      setSuggestedImages([]);
      setPreviewUrl('');
    }
  }, [saveDialogOpen, saveData.english]);

  const handleSelectSuggestedImage = async (img: UnsplashImage) => {
    try {
      const response = await fetch(img.urls.regular);
      const blob = await response.blob();
      const file = new File([blob], `${saveData.english}.jpg`, { type: 'image/jpeg' });
      setSaveData({ ...saveData, imageFile: file });
      setPreviewUrl(img.urls.thumb);
      setSuggestedImages([]);
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
      alert('Không thể chọn ảnh này.');
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    setEntries([]);
    setViMeaning(null);
    setAutoTranslation('');
    
    try {
      // Run both in parallel
      const [dictData, vietnameseData, translation] = await Promise.all([
        fetchDictionaryEntry(word.trim()).catch(() => []),
        fetchVietnameseMeaning(word.trim()),
        translateToVietnamese(word.trim())
      ]);
      
      setEntries(dictData);
      setViMeaning(vietnameseData);
      setAutoTranslation(translation);

      if (dictData.length === 0 && !vietnameseData) {
        setError('Không tìm thấy từ này trong từ điển.');
      }
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

  const openSaveDialog = (english: string, vietnamese: string, type: string, example: string) => {
    setSaveData({
      english,
      vietnamese,
      type,
      example,
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
      imageFile: saveData.imageFile,
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
        {/* Vietnamese Dictionary Card */}
        {viMeaning && (
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '6px solid', borderColor: 'secondary.main', bgcolor: '#fffaf0' }}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GTranslateIcon color="secondary" />
                  <Typography variant="h5" color="secondary" sx={{ fontWeight: 700 }}>
                    Nghĩa Tiếng Việt
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => openSaveDialog(word, viMeaning.definition, 'n', viMeaning.examples[0] || '')}
                >
                  Save This
                </Button>
              </Stack>
              
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                {viMeaning.definition}
              </Typography>

              {viMeaning.examples.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ví dụ:
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {viMeaning.examples.map((ex, i) => (
                      <ListItem key={i} sx={{ py: 0.5, px: 0 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" sx={{ fontStyle: 'italic' }}>• {ex}</Typography>} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* English Dictionary Entries */}
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
                            onClick={() => openSaveDialog(entry.word, autoTranslation, meaning.partOfSpeech, def.example || '')}
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
            <Autocomplete
              freeSolo
              options={STANDARD_TOPICS}
              value={saveData.topic}
              onInputChange={(event, newValue) => {
                setSaveData({ ...saveData, topic: newValue });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Topic" fullWidth />
              )}
            />
            <TextField
              label="Example Sentence"
              fullWidth
              multiline
              rows={3}
              value={saveData.example}
              onChange={(e) => setSaveData({ ...saveData, example: e.target.value })}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Image Suggestion {isSearchingImages && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                {previewUrl && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Preview"
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid #ddd"
                    }}
                  />
                )}
              </Stack>

              {suggestedImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack 
                    direction="row" 
                    spacing={1} 
                    sx={{ 
                      overflowX: 'auto', 
                      pb: 1,
                      '&::-webkit-scrollbar': { height: 6 },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: 3 }
                    }}
                  >
                    {suggestedImages.map((img) => (
                      <Box
                        key={img.id}
                        component="img"
                        src={img.urls.thumb}
                        alt={img.alt_description}
                        onClick={() => handleSelectSuggestedImage(img)}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: '2px solid transparent',
                          '&:hover': { borderColor: 'primary.main' }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
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
