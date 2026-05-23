import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import TranslateIcon from '@mui/icons-material/Translate';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ImageIcon from '@mui/icons-material/Image';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CircularProgress from '@mui/material/CircularProgress';
import { useVocab, Vocab, STANDARD_TOPICS } from '../context/VocabContext';
import DictionaryDialog from './DictionaryDialog';
import { translateToVietnamese } from '../services/TranslationService';
import { searchImages, UnsplashImage } from '../services/ImageService';
import { getExampleSentences } from '../services/ExampleService';

const VocabManager: React.FC = () => {
  const { 
    vocabList, 
    addVocab, 
    updateVocab, 
    deleteVocab, 
    connectProjectFolder, 
    speak,
    exportVocab,
    importVocab,
    isFolderConnected,
    projectFolder 
  } = useVocab();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  // const [startDate, setStartDate] = useState('');
  // const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [editingVocab, setEditingVocab] = useState<Vocab | null>(null);
  const [formData, setFormData] = useState<Omit<Vocab, 'id' | 'createdAt'> & { imageFile?: File | null }>({
    english: '',
    vietnamese: '',
    type: '',
    example: '',
    image: '',
    topic: '',
    imageFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<UnsplashImage[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [suggestedExamples, setSuggestedExamples] = useState<string[]>([]);
  const [isFetchingExamples, setIsFetchingExamples] = useState(false);

  const handleSuggestExample = async () => {
    if (!formData.english.trim()) return;
    setIsFetchingExamples(true);
    try {
      const examples = await getExampleSentences(formData.english);
      setSuggestedExamples(examples);
    } finally {
      setIsFetchingExamples(false);
    }
  };

  // Tự động tìm kiếm ảnh khi từ tiếng Anh thay đổi (có debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.english.trim().length >= 2 && open) {
        setIsSearchingImages(true);
        try {
          const images = await searchImages(formData.english);
          setSuggestedImages(images);
        } finally {
          setIsSearchingImages(false);
        }
      } else {
        setSuggestedImages([]);
        setSuggestedExamples([]); // Clear examples too
      }
    }, 800); // Đợi 800ms sau khi ngừng gõ

    return () => clearTimeout(timer);
  }, [formData.english, open]);

  const handleSelectSuggestedImage = async (img: UnsplashImage) => {
    try {
      const response = await fetch(img.urls.regular);
      const blob = await response.blob();
      const file = new File([blob], `${formData.english}.jpg`, { type: 'image/jpeg' });
      setFormData({ ...formData, imageFile: file });
      setSuggestedImages([]);
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
      alert('Không thể chọn ảnh này.');
    }
  };

  const handleTranslate = async () => {
    if (!formData.english.trim()) return;
    setIsTranslating(true);
    try {
      const translation = await translateToVietnamese(formData.english);
      if (translation) {
        setFormData(prev => ({ ...prev, vietnamese: translation }));
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const uniqueTopics = useMemo(() => {
    const topics = vocabList
      .map((v) => v.topic)
      .filter((t): t is string => !!t);
    return Array.from(new Set(topics)).sort();
  }, [vocabList]);

  useEffect(() => {
    if (formData.imageFile) {
      const url = URL.createObjectURL(formData.imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(formData.image || '');
    }
  }, [formData.imageFile, formData.image]);

  const handleOpen = (vocab?: Vocab) => {
    if (vocab) {
      setEditingVocab(vocab);
      setFormData({
        english: vocab.english,
        vietnamese: vocab.vietnamese,
        type: vocab.type,
        example: vocab.example,
        image: vocab.image || '',
        topic: vocab.topic || '',
        imageFile: null,
      });
    } else {
      setEditingVocab(null);
      setFormData({
        english: '',
        vietnamese: '',
        type: '',
        example: '',
        image: '',
        topic: '',
        imageFile: null,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVocab(null);
  };

  const handleOpenDictionary = (word: string) => {
    setDictionaryWord(word);
    setDictionaryOpen(true);
  };

  const handleDictionarySelect = (data: { type: string; example: string }) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type || data.type,
      example: prev.example || data.example
    }));
  };

  const handleSubmit = async () => {
    if (!formData.english.trim() || !formData.vietnamese.trim()) {
      alert('Vui lòng nhập cả từ tiếng Anh và tiếng Việt.');
      return;
    }

    let success = false;
    if (editingVocab) {
      success = await updateVocab({ ...formData, id: editingVocab.id, createdAt: editingVocab.createdAt });
    } else {
      success = await addVocab(formData);
    }

    if (success) {
      handleClose();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa từ này?')) {
      deleteVocab(id);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importVocab(file);
      e.target.value = '';
    }
  };

  const columns: GridColDef[] = [
    { field: 'english', headerName: 'English', width: 150 },
    { field: 'vietnamese', headerName: 'Vietnamese', width: 200 },
    { field: 'type', headerName: 'Type', width: 80 },
    { field: 'topic', headerName: 'Topic', width: 120 },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 150,
      valueFormatter: (value) => {
        if (!value) return '';
        return new Date(value as string).toLocaleDateString();
      }
    },
    { 
      field: 'lastSeen', 
      headerName: 'Last Seen', 
      width: 150,
      valueFormatter: (value) => {
        if (!value) return 'Never';
        return new Date(value as string).toLocaleDateString();
      }
    },
    { 
      field: 'stats', 
      headerName: 'Progress (C/W)', 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.correctCount || 0} / {params.row.wrongCount || 0}
        </Typography>
      )
    },
    { field: 'example', headerName: 'Example', width: 250 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <IconButton size="small" color="primary" onClick={() => speak(params.row.english)} title="Speak">
            <VolumeUpIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => handleOpenDictionary(params.row.english)} title="Dictionary">
            <MenuBookIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleOpen(params.row)} title="Edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)} title="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const filteredRows = vocabList.filter((item) => {
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

  return (
    <Box>
      {!isFolderConnected && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" startIcon={<FolderIcon />} onClick={connectProjectFolder}>
            Connect Project Folder
          </Button>
        }>
          Chưa kết nối thư mục dự án. Bạn cần kết nối để có thể lưu ảnh và dữ liệu vào ổ cứng!
        </Alert>
      )}

      <Stack 
        direction="row" 
        sx={{ 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 3 
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Vocabulary Management {isFolderConnected && <Typography component="span" color="success.main" variant="caption"> (Connected: {projectFolder})</Typography>}
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1} 
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button 
            variant="outlined" 
            color="info" 
            startIcon={<FileDownloadIcon />}
            onClick={exportVocab}
            size="small"
            fullWidth
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            color="info" 
            component="label"
            startIcon={<FileUploadIcon />}
            size="small"
            fullWidth
          >
            Import
            <input type="file" hidden accept=".json" onChange={handleImport} />
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleOpen()} 
            size="small"
            fullWidth
          >
            Add New Word
          </Button>
        </Stack>
      </Stack>

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
          onChange={(_, newValue: string[]) => setSelectedTopics(newValue)}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Filter by Topics" placeholder="Select topics..." />
          )}
        />
      </Stack>

      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingVocab ? 'Edit Word' : 'Add New Word'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="English"
                fullWidth
                value={formData.english}
                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
              />
              <IconButton 
                color="secondary" 
                onClick={() => handleOpenDictionary(formData.english)}
                disabled={!formData.english.trim()}
                title="Lookup Dictionary"
              >
                <SearchIcon />
              </IconButton>
              <IconButton 
                color="primary" 
                onClick={() => speak(formData.english)}
                disabled={!formData.english.trim()}
                title="Speak"
              >
                <VolumeUpIcon />
              </IconButton>
              <IconButton 
                color="warning" 
                onClick={() => {
                  if (formData.english.trim()) {
                    searchImages(formData.english).then(setSuggestedImages);
                  }
                }}
                disabled={!formData.english.trim() || isSearchingImages}
                title="Suggest Images"
              >
                <ImageIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Vietnamese"
                fullWidth
                value={formData.vietnamese}
                onChange={(e) => setFormData({ ...formData, vietnamese: e.target.value })}
              />
              <IconButton 
                color="info" 
                onClick={handleTranslate}
                disabled={!formData.english.trim() || isTranslating}
                title="Auto Translate"
              >
                {isTranslating ? <CircularProgress size={24} /> : <TranslateIcon />}
              </IconButton>
            </Box>
            <TextField
              label="Type (e.g. n, v, adj, adv)"
              fullWidth
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
            <Autocomplete
              freeSolo
              options={STANDARD_TOPICS}
              value={formData.topic}
              onInputChange={(event, newValue) => {
                setFormData({ ...formData, topic: newValue });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Topic" fullWidth />
              )}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Example Sentence"
                fullWidth
                multiline
                rows={2}
                value={formData.example}
                onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              />
              <IconButton 
                color="info" 
                onClick={handleSuggestExample}
                disabled={!formData.english.trim() || isFetchingExamples}
                title="Auto Suggest Example"
              >
                {isFetchingExamples ? <CircularProgress size={24} /> : <AutoFixHighIcon />}
              </IconButton>
            </Box>

            {suggestedExamples.length > 0 && (
              <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                  Click an example to use:
                </Typography>
                <Stack spacing={1}>
                  {suggestedExamples.map((ex, i) => (
                    <Typography 
                      key={i} 
                      variant="body2" 
                      sx={{ 
                        cursor: 'pointer', 
                        p: 0.5, 
                        '&:hover': { bgcolor: 'action.selected', borderRadius: 0.5 } 
                      }}
                      onClick={() => {
                        setFormData({ ...formData, example: ex });
                        setSuggestedExamples([]);
                      }}
                    >
                      • {ex}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Vocabulary Image
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                {previewUrl && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Preview"
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid #ddd"
                    }}
                  />
                )}
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                    >
                      {previewUrl ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({ ...formData, imageFile: file });
                          }
                        }}
                      />
                    </Button>
                  </Stack>
                  {previewUrl && (
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => setFormData({ ...formData, image: '', imageFile: null })}
                      sx={{ width: 'fit-content' }}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Stack>

              {suggestedImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                    Click an image to select:
                  </Typography>
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
                          width: 80,
                          height: 80,
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

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {isFolderConnected 
                  ? "Ảnh sẽ được lưu tự động vào thư mục public/images/ của bạn." 
                  : "Cần kết nối thư mục dự án để lưu ảnh."}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <DictionaryDialog 
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        word={dictionaryWord}
        onSelectData={open ? handleDictionarySelect : undefined}
      />
    </Box>
  );
};

export default VocabManager;
