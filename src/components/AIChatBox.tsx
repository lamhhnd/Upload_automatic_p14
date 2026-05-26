import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  CircularProgress,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Autocomplete,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { aiService, ChatMessage } from '../services/AIService';
import { useVocab, STANDARD_TOPICS } from '../context/VocabContext';

const AIChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const initialMessage: ChatMessage = { role: 'assistant', content: "Hi! I'm your AI tutor. How can I help you with your IELTS preparation today?" };
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Add Vocab State
  const [addOpen, setAddOpen] = useState(false);
  const { addVocab, addReading } = useVocab();
  const [newVocab, setNewVocab] = useState({ english: '', vietnamese: '', type: '', example: '', topic: 'General' });

  // Save as Reading State
  const [readingOpen, setReadingOpen] = useState(false);
  const [newReading, setNewReading] = useState({ title: '', content: '' });

  const handleReset = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện này không?')) {
      setMessages([initialMessage]);
      setInput('');
    }
  };

  const handleAddVocab = async () => {
    if (!newVocab.english.trim()) return;
    await addVocab(newVocab);
    setAddOpen(false);
    setNewVocab({ english: '', vietnamese: '', type: '', example: '', topic: 'General' });
  };

  const handleSaveReading = async () => {
    if (!newReading.title.trim() || !newReading.content.trim()) return;
    await addReading(newReading);
    setReadingOpen(false);
    alert('Đã lưu vào danh sách bài đọc!');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.getResponse([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: { xs: 85, sm: 24 }, // Đẩy cao hơn trên mobile
        right: { xs: 16, sm: 24 }, 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        alignItems: 'flex-end'
      }}
    >
      {/* Chat Window */}
      <Zoom in={isOpen}>
        <Paper
          elevation={12}
          sx={{
            position: 'absolute',
            bottom: 60, // Đẩy lên trên các nút FAB
            right: 0,
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            height: { xs: '60vh', sm: 550 },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              cursor: 'default'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>AI Tutor</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={handleReset} sx={{ color: 'white' }} title="Làm mới cuộc hội thoại">
                <RestartAltIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Messages */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f8fafc' }}>
            <List disablePadding>
              {messages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                    px: 0,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      px: 2,
                      maxWidth: '85%',
                      borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                      color: msg.role === 'user' ? 'white' : 'text.primary',
                      boxShadow: msg.role === 'user' ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                      position: 'relative',
                      '&:hover .save-reading': { opacity: 1 }
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{msg.content}</Typography>
                    
                    {msg.role === 'assistant' && index > 0 && (
                      <IconButton 
                        className="save-reading"
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          right: -40, 
                          top: 0, 
                          opacity: 0, 
                          transition: 'opacity 0.2s',
                          color: 'primary.main'
                        }}
                        onClick={() => {
                          setNewReading({ 
                            title: `AI Reading - ${new Date().toLocaleDateString()}`, 
                            content: msg.content 
                          });
                          setReadingOpen(true);
                        }}
                        title="Save as Reading"
                      >
                        <BookmarkAddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Paper>
                </ListItem>
              ))}
              {isLoading && (
                <ListItem sx={{ px: 0 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: '20px 20px 20px 4px',
                      bgcolor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography variant="caption">AI is thinking...</Typography>
                  </Paper>
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton 
                      onClick={handleSend} 
                      disabled={!input.trim() || isLoading}
                      color="primary"
                      size="small"
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  ),
                  sx: { borderRadius: 4 }
                }
              }}
            />
          </Box>
        </Paper>
      </Zoom>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Quick Add Button */}
        {!isOpen && (
          <Fab color="secondary" aria-label="add" onClick={() => setAddOpen(true)}>
            <AddIcon />
          </Fab>
        )}

        {/* Toggle Button - Only show when closed */}
        {!isOpen && (
          <Fab
            color="primary"
            aria-label="chat"
            onClick={() => setIsOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)',
              }
            }}
          >
            <SmartToyIcon />
          </Fab>
        )}
      </Box>

      {/* Add Vocab Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Quick Add Word</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="English" fullWidth value={newVocab.english} onChange={(e) => setNewVocab({...newVocab, english: e.target.value})} />
            <TextField label="Vietnamese" fullWidth value={newVocab.vietnamese} onChange={(e) => setNewVocab({...newVocab, vietnamese: e.target.value})} />
            <TextField label="Type" fullWidth value={newVocab.type} onChange={(e) => setNewVocab({...newVocab, type: e.target.value})} />
            <Autocomplete
              freeSolo
              options={STANDARD_TOPICS}
              value={newVocab.topic}
              onInputChange={(event, newValue) => setNewVocab({...newVocab, topic: newValue})}
              renderInput={(params) => <TextField {...params} label="Topic" fullWidth />}
            />
            <TextField label="Example" fullWidth multiline rows={2} value={newVocab.example} onChange={(e) => setNewVocab({...newVocab, example: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddVocab} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Save Reading Dialog */}
      <Dialog open={readingOpen} onClose={() => setReadingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Save as Reading</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Title" 
              fullWidth 
              value={newReading.title} 
              onChange={(e) => setNewReading({...newReading, title: e.target.value})} 
            />
            <TextField 
              label="Content" 
              fullWidth 
              multiline 
              rows={10} 
              value={newReading.content} 
              onChange={(e) => setNewReading({...newReading, content: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadingOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveReading} variant="contained">Save to Readings</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIChatBox;
