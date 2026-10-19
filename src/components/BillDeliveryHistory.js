import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import { apiRequest } from './common';
import BillNoticeSettings from './BillNoticeSettings';
const channels = { email: '이메일', sms: '문자(LMS)', kakao: '카카오 알림톡' };
const statuses = { submitted: '발송 접수', queued: '처리 중·확인 필요', unknown: '결과 확인 필요' };
const time = (value) => value ? new Date(value).toLocaleString('ko-KR') : '-';
export default function BillDeliveryHistory() {
  const period = useSelector((state) => state.chgMonth.value);
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const remove = async (row) => {
    if (!window.confirm(`${row.renter_name}의 발송 내역을 목록에서 삭제하시겠습니까? 삭제 후 다시 발송할 수 있습니다. 이미 보낸 메시지는 취소되지 않아 재발송하면 상대방이 중복 수신할 수 있습니다.`)) return;
    setDeleting(true); setError('');
    try { await apiRequest(`/api/bills/delivery-history/${row.id}`, { method: 'DELETE', body: { confirmation: 'DELETE_DELIVERY_HISTORY' } }); setDetailId(null); setPage(0); setRefresh(v => v + 1); }
    catch (err) { setError(err.message); } finally { setDeleting(false); }
  };
  const [detailError, setDetailError] = useState('');
  useEffect(() => { setPage(0); }, [period, channel, status]);
  useEffect(() => {
    let active = true;
    const [year, month] = period.split('-');
    setBusy(true); setError(''); setData({ rows: [], total: 0 });
    const query = new URLSearchParams({ year, month, channel, status, page });
    apiRequest(`/api/bills/delivery-history?${query}`).then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [period, channel, status, page, refresh]);
  useEffect(() => {
    let active = true;
    setDetail(null); setDetailError('');
    if (detailId !== null) apiRequest(`/api/bills/delivery-history/${detailId}`)
      .then((result) => { if (active) setDetail(result); }).catch((err) => { if (active) setDetailError(err.message); });
    return () => { active = false; };
  }, [detailId]);
  return <Box sx={{ p: 2 }}>
    <BillNoticeSettings />
    <Typography variant="h6" gutterBottom>{period} 청구서 발송 내역</Typography>
    <Alert severity="info" sx={{ mb: 2 }}>발송 접수는 Gmail·팝빌의 요청 접수 결과이며 수신 완료를 뜻하지 않습니다. 결과 확인이 필요한 건은 발송사업자 내역을 확인해 주세요.</Alert>
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <TextField select size="small" label="수신방법" value={channel} onChange={(e) => setChannel(e.target.value)} sx={{ minWidth: 150 }}>
        <MenuItem value="">전체</MenuItem>{Object.entries(channels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="접수 결과" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
        <MenuItem value="">전체</MenuItem>{Object.entries(statuses).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
      </TextField>
      <Button disabled={busy} onClick={() => setRefresh((v) => v + 1)}>새로고침</Button>
    </Stack>
    {error && <Alert severity="error">{error}</Alert>}
    {busy ? <Typography>발송 내역 조회 중…</Typography> : <>
      <TableContainer><Table size="small" sx={{ minWidth: 800 }}>
        <TableHead><TableRow>{['거래처', '수신방법', '수신처', '발송 요청 시각', '접수 결과', '수신 여부', '관리'].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
        <TableBody>{data.rows.map((row) => <TableRow key={row.id} hover>
          <TableCell>{row.renter_name}</TableCell><TableCell>{channels[row.channel] || row.channel}</TableCell>
          <TableCell sx={{ overflowWrap: 'anywhere' }}>{row.recipient}</TableCell><TableCell>{time(row.created_at)}</TableCell>
          <TableCell><Chip size="small" label={statuses[row.status] || row.status} color={row.status === 'submitted' ? 'success' : 'warning'} variant="outlined" /></TableCell>
          <TableCell>{row.channel === 'email' ? '확인 불가 (Gmail SMTP)' : '발송사업자 확인 필요'}</TableCell><TableCell><Button onClick={() => setDetailId(row.id)}>상세 보기</Button><Button color="error" disabled={deleting || row.status === 'queued'} onClick={() => remove(row)}>삭제</Button></TableCell>
        </TableRow>)}{!data.rows.length && !error && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>조회 조건에 맞는 발송 내역이 없습니다.</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>
      <TablePagination component="div" count={data.total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_, value) => setPage(value)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}건`} />
    </>}
    <Dialog open={detailId !== null} onClose={() => setDetailId(null)} fullWidth maxWidth="sm">
      <DialogTitle>청구서 발송 상세</DialogTitle><DialogContent>
        {detailError && <Alert severity="error">{detailError}</Alert>}
        {!detail && !detailError && <Typography>조회 중…</Typography>}
        {detail && <>
          <Typography fontWeight={700}>{detail.renter_name} · {detail.bill_year}년 {detail.bill_month}월</Typography>
          <Typography>{channels[detail.channel]} · {detail.recipient}</Typography>
          <Typography>발송 요청: {time(detail.created_at)}</Typography>
          <Alert severity="info" sx={{ my: 1 }}>{detail.channel === 'email' ? 'Gmail 발송 접수 결과만 저장되어 있습니다. 수신함 도착·열람 완료는 확인할 수 없습니다. 발송 계정에서 반송 메일을 확인할 수 있지만, 반송 메일이 없다고 수신 완료를 보장하지는 않습니다.' : '최종 수신 결과는 발송사업자 내역에서 확인해 주세요.'}</Alert>
          <Typography>접수 결과: {statuses[detail.status] || detail.status}</Typography>
          <Typography sx={{ overflowWrap: 'anywhere' }}>접수번호: {detail.receipt || '-'}</Typography>
          {detail.error_message && <Alert severity="warning" sx={{ my: 1 }}>{detail.error_message}</Alert>}
          <Typography sx={{ mt: 2 }} fontWeight={700}>발송 요청 당시 본문</Typography>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>{detail.content_text}</Typography>
        </>}
      </DialogContent><DialogActions><Button onClick={() => setDetailId(null)}>닫기</Button></DialogActions>
    </Dialog>
  </Box>;
}
