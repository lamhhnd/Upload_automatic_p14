import React from 'react';
import { Box, TextField, Stack, Typography } from '@mui/material';
import { useVocab } from '../context/VocabContext';

const DateRangeSelector: React.FC = () => {
  const { startDate, endDate, setStartDate, setEndDate } = useVocab();

  return (
    <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 3, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'primary.main', fontWeight: 600 }}>
        Vocabulary Date Range
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="From Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
          fullWidth
        />
        <TextField
          label="To Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
          fullWidth
        />
      </Stack>
    </Box>
  );
};

export default DateRangeSelector;
