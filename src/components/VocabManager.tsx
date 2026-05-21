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
import { useVocab, Vocab } from '../context/VocabContext';

const VocabManager: React.FC = () => {
  const { 
    vocabList, 
    addVocab, 
    updateVocab, 
    deleteVocab, 
    resetToDefault, 
    connectProjectFolder, 
    speak,
    isFolderConnected,
    projectFolder 
  } = useVocab();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);
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

  const columns: GridColDef[] = [
    { field: 'english', headerName: 'English', width: 150 },
    { field: 'vietnamese', headerName: 'Vietnamese', width: 200 },
    { field: 'type', headerName: 'Type', width: 80 },
    { field: 'topic', headerName: 'Topic', width: 120 },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 180,
      valueFormatter: (value) => {
        if (!value) return '';
        return new Date(value as string).toLocaleString();
      }
    },
    { field: 'example', headerName: 'Example', width: 250 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
          <IconButton size="small" color="primary" onClick={() => speak(params.row.english)}>
            <VolumeUpIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleOpen(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
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

    return matchesSearch && matchesTopic && matchesDate;
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
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" color="error" onClick={resetToDefault}>
            Reset to Default
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleOpen()}>
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
        {/* <Stack direction="row" spacing={2}>
          <TextField
            label="From Date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
          />
          <TextField
            label="To Date"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
          />
          <Button 
            variant="outlined" 
            onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); setSelectedTopics([]); }}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </Button>
        </Stack> */}
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
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="English"
                fullWidth
                value={formData.english}
                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
              />
              <IconButton 
                color="primary" 
                onClick={() => speak(formData.english)}
                disabled={!formData.english.trim()}
              >
                <VolumeUpIcon />
              </IconButton>
            </Box>
            <TextField
              label="Vietnamese"
              fullWidth
              value={formData.vietnamese}
              onChange={(e) => setFormData({ ...formData, vietnamese: e.target.value })}
            />
            <TextField
              label="Type (e.g. n, v, adj, adv)"
              fullWidth
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
            <TextField
              label="Topic"
              fullWidth
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
            <TextField
              label="Example Sentence"
              fullWidth
              multiline
              rows={2}
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
            />
            
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
                  {previewUrl && (
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => setFormData({ ...formData, image: '', imageFile: null })}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Stack>
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
    </Box>
  );
};

export default VocabManager;
