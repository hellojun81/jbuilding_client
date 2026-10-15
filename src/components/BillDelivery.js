import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField } from '@mui/material';
import { apiRequest } from './common';
const names = { email: '이메일', sms: '문자(LMS)', kakao: '카카오 알림톡' };
const statuses = { submitted: '발송 접수 완료', queued: '처리 중 또는 결과 확인 필요', unknown: '결과 확인 필요 · 자동 재발송 차단' };
export default function BillDelivery({ renter, period, note }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [details, setDetails] = useState({});
  const [previewDetails, setPreviewDetails] = useState(undefined);
  const [previewNote, setPreviewNote] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [year, month] = period.split('-');
  const path = '/api/bills/' + encodeURIComponent(renter);
  const load = async () => {
    setBusy(true); setError(''); setMessage(''); setPreview(null); setOpen(true);
    try { const result = await apiRequest(`${path}/delivery-preview`, { method: 'POST', body: { year, month, note, details } }); setPreview(result); setDetails(result.details || {}); setPreviewDetails(result.details); setPreviewNote(note); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const pending = preview?.channels.filter((channel) => !preview.history.some((row) => row.channel === channel.channel)) || [];
  const send = async () => {
    if (!window.confirm(`${renter}의 ${year}년 ${month}월 청구서를 실제 발송하시겠습니까?\n${pending.map((c) => `${names[c.channel]}: ${c.recipient}`).join('\n')}\n문자·카카오는 발송 요금이 발생할 수 있습니다.`)) return;
    setBusy(true); setError('');
    try {
      const result = await apiRequest(`${path}/deliver`, { method: 'POST', body: { year, month, revision: preview.revision, confirmation: 'SEND_BILL', note: previewNote, details: previewDetails } });
      setMessage(result.message);
      setPreview(await apiRequest(`${path}/delivery-preview`, { method: 'POST', body: { year, month, note: previewNote, details: previewDetails } }));
    } catch (err) {
      setError(err.message);
      // A timed-out request may already have sent a message: refresh history before another action.
      setPreview(null);
    } finally { setBusy(false); }
  };
  return <Box sx={{ my: 2 }}>
    <Button type="button" variant="outlined" disabled={busy || !renter || renter === '선택'} onClick={load}>저장된 청구서 미리보기 / 발송</Button>
    <Typography variant="caption" display="block" color="text.secondary">비고는 현재 입력한 내용으로 발송합니다. 금액 변경은 먼저 저장하세요. 수신방법은 계약정보에서 설정합니다.</Typography>
    <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>청구서 발송 · {renter}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="info">{message}</Alert>}
        {busy && <Typography>처리 중…</Typography>}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, my: 2 }}>
          {Object.entries({dueDate:'납부기한',periodStart:'청구 시작일',periodEnd:'청구 종료일',room:'호실',arrears:'이전 미납금(원)'}).map(([key,label]) => <TextField key={key} label={label} type={key.includes('Date') || key.startsWith('period') ? 'date' : key === 'arrears' ? 'number' : 'text'} InputLabelProps={{shrink:true}} value={details[key] ?? ''} disabled={busy} onChange={e => { setDetails({...details,[key]:e.target.value}); setPreview(null); }} />)}
        </Box>
        <Typography variant="caption">미납금은 확인한 금액을 직접 입력합니다. 당월 청구액과 별도 표시되며 수납 기록은 변경하지 않습니다. 날짜·호실 수정 후 미리보기 갱신을 눌러 주세요. 계좌·문의 연락처는 청구서 발송 내역의 공통 설정에서 관리합니다.</Typography>
        {!preview && !busy && <Button onClick={load}>미리보기 갱신</Button>}
        {preview && <>
          <Typography sx={{ my: 1 }}>수신방법: {preview.label} · 합계 {Number(preview.total).toLocaleString('ko-KR')}원</Typography>
          {!preview.channels.length && <Alert severity="warning">계약정보에서 청구서 수신방법을 선택하고 저장해 주세요.</Alert>}
          {preview.channels.map((channel) => {
            const history = preview.history.find((item) => item.channel === channel.channel);
            return <Box key={channel.channel} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, my: 1 }}>
              <Typography fontWeight={700}>{names[channel.channel]} · {channel.recipient || '연락처 없음'}</Typography>
              {history ? <Alert severity={history.status === 'submitted' ? 'success' : 'warning'}>{statuses[history.status] || history.status}{history.receipt ? ` · 접수번호 ${history.receipt}` : ''}</Alert> : <>
                {!channel.valid && <Alert severity="warning">계약정보의 연락처를 확인해 주세요.</Alert>}
                {!channel.enabled && <Alert severity="warning">실제 발송 활성화 설정이 필요합니다.</Alert>}
                {channel.missing.length > 0 && <Alert severity="warning">발송서비스 연결 설정이 필요합니다: {channel.missing.join(', ')}</Alert>}
                {channel.templateError && <Alert severity="warning">{channel.templateError}</Alert>}
              </>}
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.9, p: 2, bgcolor: 'grey.50', borderRadius: 1, overflowWrap: 'anywhere' }}>{channel.content}</Typography>
            </Box>;
          })}
          <Typography variant="caption">이메일에는 청구서 본문과 인쇄 가능한 HTML 청구서가 첨부됩니다. 발송 접수는 최종 수신 완료와 다릅니다. 이미 접수되었거나 결과가 불확실한 채널은 중복 발송하지 않습니다.</Typography>
        </>}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={load}>새로고침</Button>
        <Button disabled={busy} onClick={() => setOpen(false)}>닫기</Button>
        <Button variant="contained" disabled={busy || !pending.length || pending.some((c) => !c.ready)} onClick={send}>확인 후 실제 발송</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
