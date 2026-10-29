import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { apiRequest } from './common';
export default function BillNoticeSettings() {
 const [details, setDetails] = useState({ bank: '', account: '', accountHolder: '', contact: '' });
 const [notice, setNotice] = useState('');
 const [ready, setReady] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [saved, setSaved] = useState(false);
 useEffect(() => {
  let active = true;
  apiRequest('/api/bills/settings').then(data => { if (active) { setNotice(data.notice); setDetails({ bank: data.bank || '', account: data.account || '', accountHolder: data.accountHolder || '', contact: data.contact || '' }); setReady(true); } }).catch(e => { if(active) setError(e.message); });
  return () => { active = false; };
 }, []);
 const save = async () => {
  setBusy(true); setError(''); setSaved(false);
  try { const data = await apiRequest('/api/bills/settings', { method: 'PUT', body: { notice, ...details } }); setNotice(data.notice); setSaved(true); }
  catch(e) { setError(e.message); } finally { setBusy(false); }
 };
 return <Box sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0, mb: 2, border: '1px solid #ddd', borderRadius: 1 }}>
  <Typography fontWeight={700} gutterBottom>청구서 공통 설정</Typography>
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: { xs: 1.5, sm: 2 }, minWidth: 0, mb: 2 }}>{Object.entries({ bank: '은행명', account: '입금계좌', accountHolder: '예금주', contact: '문의 연락처' }).map(([key, label]) => <TextField key={key} label={label} value={details[key]} disabled={!ready || busy} inputProps={{ maxLength: 150 }} onChange={e => { setDetails({ ...details, [key]: e.target.value }); setSaved(false); }} />)}</Box>
  <TextField fullWidth multiline minRows={2} label="공통 안내 문구" value={notice} disabled={!ready || busy} inputProps={{ maxLength: 1000 }} onChange={e => { setNotice(e.target.value); setSaved(false); }} helperText="저장 후 새로 미리보기·발송·다운로드하는 청구서에 적용됩니다. 연체료는 자동으로 청구 금액에 더하지 않습니다." />
  {error && <Alert severity="error">{error}</Alert>}{saved && <Alert severity="success">공통 안내 문구를 저장했습니다.</Alert>}
  <Button variant="outlined" sx={{ mt: 1 }} disabled={!ready || busy} onClick={save}>공통 설정 저장</Button>
 </Box>;
}
