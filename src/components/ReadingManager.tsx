import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  Pagination,
  InputAdornment,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import { useVocab, Reading } from "../context/VocabContext";

const ReadingManager = () => {
  const { readings, addReading, updateReading, deleteReading } = useVocab();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [viewingReading, setViewingReading] = useState<Reading | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // Tìm kiếm và Phân trang state
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Lọc theo từ khóa tìm kiếm
  const filteredReadings = useMemo(() => {
    return readings.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [readings, searchTerm]);

  // 2. Sắp xếp bài đọc sau khi lọc
  const sortedReadings = useMemo(() => {
    return [...filteredReadings].sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredReadings]);

  // 3. Phân trang
  const totalPages = Math.ceil(sortedReadings.length / itemsPerPage);
  const paginatedReadings = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedReadings.slice(start, start + itemsPerPage);
  }, [sortedReadings, page]);

  // Reset về trang 1 khi tìm kiếm thay đổi
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleOpen = (reading?: Reading) => {
    if (reading) {
      setEditingReading(reading);
      setFormData({
        title: reading.title,
        content: reading.content,
      });
    } else {
      setEditingReading(null);
      setFormData({ title: "", content: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingReading(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingReading) {
      await updateReading({
        ...editingReading,
        title: formData.title,
        content: formData.content,
      });
    } else {
      await addReading({
        title: formData.title,
        content: formData.content,
      });
    }
    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this reading?")) {
      await deleteReading(id);
    }
  };

  const handleView = (reading: Reading) => {
    setViewingReading(reading);
    setViewOpen(true);
  };

  return (
    <Box>
      <Stack 
        direction={isMobile ? "column" : "row"} 
        spacing={2}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center" }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Manage Readings</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          fullWidth={isMobile}
        >
          Add Reading
        </Button>
      </Stack>

      {/* Thanh tìm kiếm */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search readings by title or content..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }
        }}
      />

      {readings.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 5, bgcolor: 'transparent', border: '2px dashed #ccc' }}>
          <Typography color="text.secondary">No readings yet. Add your first article!</Typography>
        </Card>
      ) : paginatedReadings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography color="text.secondary">No readings found matching "{searchTerm}"</Typography>
        </Box>
      ) : (
        <>
          <List disablePadding>
            {paginatedReadings.map((reading) => (
              <Card key={reading.id} sx={{ mb: 1.5, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                <ListItem
                  sx={{ 
                    flexDirection: 'column', 
                    alignItems: 'stretch',
                    p: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <ListItemText
                      primary={reading.title}
                      secondary={new Date(reading.createdAt).toLocaleDateString()}
                      slotProps={{
                        primary: {
                          sx: { fontWeight: 'bold', fontSize: '1.1rem', mb: 0.5 }
                        }
                      }}
                    />
                  </Box>
                  <Divider sx={{ my: 1, opacity: 0.5 }} />
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />} 
                      onClick={() => handleView(reading)}
                      color="info"
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />} 
                      onClick={() => handleOpen(reading)}
                      color="primary"
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<DeleteIcon />} 
                      onClick={() => handleDelete(reading.id)}
                      color="error"
                    >
                      Delete
                    </Button>
                  </Stack>
                </ListItem>
              </Card>
            ))}
          </List>

          {/* Điều khiển phân trang */}
          {totalPages > 1 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={(_, v) => setPage(v)} 
                color="primary" 
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingReading ? "Edit Reading" : "Add New Reading"}
          {isMobile && (
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              variant="outlined"
            />
            <TextField
              label="Content"
              fullWidth
              multiline
              rows={isMobile ? 12 : 15}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              variant="outlined"
              placeholder="Paste your reading text here..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={viewOpen} 
        onClose={() => setViewOpen(false)} 
        fullWidth 
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pr: 6 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>{viewingReading?.title}</Typography>
          <IconButton
            aria-label="close"
            onClick={() => setViewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#fff' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.8,
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: 'text.primary',
              textAlign: 'justify'
            }}
          >
            {viewingReading?.content}
          </Typography>
        </DialogContent>
        {!isMobile && (
          <DialogActions>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default ReadingManager;
