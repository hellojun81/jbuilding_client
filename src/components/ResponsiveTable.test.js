import { render, screen } from '@testing-library/react';
import { TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import ResponsiveTable from './ResponsiveTable';
test('keeps table headers and rows intact', () => {
 render(<ResponsiveTable><TableHead><TableRow><TableCell>거래처</TableCell><TableCell>금액</TableCell></TableRow></TableHead><TableBody><TableRow><TableCell>예향</TableCell><TableCell>1,000원</TableCell></TableRow></TableBody></ResponsiveTable>);
 expect(screen.getByRole('table')).toBeInTheDocument();
 expect(screen.getByRole('columnheader', {name:'금액'})).toBeInTheDocument();
 expect(screen.getByRole('cell', {name:'예향'})).toBeInTheDocument();
});
