import React, { useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { apiRequest } from './common';
export default function DeleteBill({ renter, period, onDeleted, onBusy }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    setBusy(true); onBusy(true); setError('');
    try {
      const date = period.replaceAll('-', '.') + '.01';
      const path = '/api/bills/' + encodeURIComponent(renter);
      const preview = await apiRequest(`${path}/delete-preview?date=${date}`);
      if (!window.confirm(`${preview.renter}\n${preview.year}년 ${preview.month}월 청구서\n저장된 합계 ${Number(preview.total).toLocaleString('ko-KR')}원\n\n이 청구서를 삭제하시겠습니까? 삭제 전 내용은 서버에 보관됩니다.\n이미 보낸 메시지나 전자세금계산서를 취소하는 기능은 아닙니다.`)) return;
      const result = await apiRequest(path, { method: 'DELETE', body: { date, revision: preview.revision, confirmation: 'DELETE_BILL' } });
      if (Number(result.affectedRows) !== 1) throw new Error('청구서 삭제 결과를 확인해 주세요.');
      onDeleted();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); onBusy(false); }
  };
  return <Box sx={{ my: 2 }}>
    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
    <Button type="button" color="error" variant="outlined" disabled={busy || !renter || renter === '선택'} onClick={remove}>{busy ? '확인 중…' : '청구서 삭제'}</Button>
    <Typography variant="caption" display="block" color="text.secondary">수납 완료·입금 연결·발송 또는 세금계산서 이력이 있는 청구서는 삭제할 수 없습니다.</Typography>
  </Box>;
}
