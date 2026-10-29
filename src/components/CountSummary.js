import React from 'react';
import { Box, Typography } from '@mui/material';
export default function CountSummary({ items, loading = false, label = '조회 결과 요약' }) {
 return <Box role="region" aria-label={label} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
  {items.map(({label: title, count, color}) => <Box key={title} sx={{ flex: '1 1 110px', minWidth: 0, px: 1.5, py: 1.25, bgcolor: '#fff', border: '1px solid #dce3eb', borderRadius: 1.5, textAlign: 'left' }}>
   <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{title}</Typography>
   <Typography sx={{ mt: 0.5, fontSize: 20, fontWeight: 700, color: color || '#24364b' }}>{loading ? '—' : Number(count || 0).toLocaleString('ko-KR')}<Typography component="span" sx={{ fontSize: 11, ml: 0.5 }}>건</Typography></Typography>
  </Box>)}
 </Box>;
}
