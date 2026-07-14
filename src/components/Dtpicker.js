import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useDispatch, useSelector } from 'react-redux';
import { next, prev, reset } from './store';

export default function MonthSelector() {
  const dispatch = useDispatch();
  const selectedMonth = useSelector((state) => state.chgMonth.value);

  return (
    <Paper elevation={1} sx={{ mt: 1.5, mb: 1.5, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
        공통 조회 월
      </Typography>
      <ButtonGroup fullWidth variant="contained" aria-label="조회 월 이동">
        <Button aria-label="이전 달" onClick={() => dispatch(prev())} sx={{ maxWidth: 72 }}>
          <ArrowBackIosIcon fontSize="small" />
        </Button>
        <Box sx={{ flex: 1, bgcolor: 'background.paper' }}>
          <TextField
            type="month"
            value={selectedMonth}
            onChange={(event) => dispatch(reset(event.target.value))}
            inputProps={{ 'aria-label': '공통 조회 월' }}
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
        </Box>
        <Button aria-label="다음 달" onClick={() => dispatch(next())} sx={{ maxWidth: 72 }}>
          <ArrowForwardIosIcon fontSize="small" />
        </Button>
      </ButtonGroup>
    </Paper>
  );
}
