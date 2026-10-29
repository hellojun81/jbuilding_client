import React from 'react';
import Table from '@mui/material/Table';

export default function ResponsiveTable({ children, sx, ...props }) {
  return <Table {...props} sx={[...(Array.isArray(sx) ? sx : [sx || {}]), {
    width: '100%', minWidth: '0 !important', tableLayout: 'fixed',
    '& th, & td': {
      minWidth: '0 !important', fontSize: { xs: 11, sm: 12 }, px: { xs: 0.5, sm: 1 }, py: 1,
      overflowWrap: 'anywhere', whiteSpace: 'normal !important', verticalAlign: 'top'
    },
    '& th.MuiTableCell-paddingCheckbox, & td.MuiTableCell-paddingCheckbox': { width: 32, px: 0 },
    '& .MuiChip-root': { maxWidth: '100%', height: 'auto', minHeight: 24, fontSize: 11 },
    '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', px: 0.5, py: 0.25 },
    '& .MuiButton-root': { minWidth: 0, maxWidth: '100%', whiteSpace: 'normal', fontSize: 11, px: 0.5 },
    '& .MuiFormControl-root': { minWidth: '0 !important', maxWidth: '100%', width: '100%' },
    '& .MuiInputBase-root': { fontSize: 12 },
    '& tbody td:nth-of-type(2)': { position: 'static', minWidth: 0 },
    ...(props.stickyHeader ? { '& thead th': { position: 'sticky', top: 0, zIndex: 3 } } : {})
  }]}>{children}</Table>;
}
