import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { apiRequest } from './common';

const money = (value) => Number(value || 0).toLocaleString('ko-KR');

function quarterDates(year, quarter) {
  const startMonth = (Number(quarter) - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const endDay = new Date(Number(year), endMonth, 0).getDate();
  return {
    start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
    end: `${year}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
  };
}

function displayDate(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 8) return value || '-';
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function sourceSummary(records, source) {
  const filtered = records.filter((record) => record.source === source);
  return {
    count: filtered.length,
    amount: filtered.reduce((sum, record) => sum + Number(record.totalAmount || 0), 0),
  };
}

export default function VatManagement() {
  const selectedMonth = useSelector((state) => state.chgMonth.value);
  const [periodMode, setPeriodMode] = useState('quarter');
  const [year, setYear] = useState(selectedMonth.slice(0, 4));
  const [quarter, setQuarter] = useState(String(Math.ceil(Number(selectedMonth.slice(5, 7)) / 3)));
  const initialDates = useMemo(() => quarterDates(year, quarter), [year, quarter]);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [readiness, setReadiness] = useState(null);
  const [checking, setChecking] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [jobs, setJobs] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const nextYear = selectedMonth.slice(0, 4);
    const nextQuarter = String(Math.ceil(Number(selectedMonth.slice(5, 7)) / 3));
    const dates = quarterDates(nextYear, nextQuarter);
    setYear(nextYear);
    setQuarter(nextQuarter);
    setStartDate(dates.start);
    setEndDate(dates.end);
  }, [selectedMonth]);

  useEffect(() => {
    if (periodMode !== 'quarter') return;
    const dates = quarterDates(year, quarter);
    setStartDate(dates.start);
    setEndDate(dates.end);
  }, [periodMode, year, quarter]);

  useEffect(() => {
    let active = true;
    setChecking(true);
    apiRequest('/api/vat/provider-check')
      .then((data) => active && setReadiness(data))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setChecking(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!jobs) return undefined;
    let active = true;
    let timer;
    const check = async () => {
      try {
        const result = await apiRequest('/api/vat/collections/status', {
          method: 'POST',
          body: { jobs },
        });
        if (!active) return;
        if (result.status === 'complete') {
          setRecords(Array.isArray(result.records) ? result.records : []);
          setCollecting(false);
          setJobs(null);
          setMessage('선택 기간의 국세청 자료 수집이 완료되었습니다.');
        } else if (result.status === 'failed') {
          setCollecting(false);
          setJobs(null);
          setError(result.message || '국세청 자료 수집에 실패했습니다.');
        } else {
          timer = window.setTimeout(check, 3000);
        }
      } catch (requestError) {
        if (!active) return;
        setCollecting(false);
        setJobs(null);
        setError(requestError.message);
      }
    };
    check();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [jobs]);

  const taxSummary = useMemo(() => sourceSummary(records, 'tax_invoice'), [records]);
  const cashSummary = useMemo(() => sourceSummary(records, 'cash_receipt'), [records]);
  const ready = Boolean(readiness?.ready);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const collectionEndDate = endDate > today ? today : endDate;

  const collect = async () => {
    setError('');
    setMessage('');
    if (!ready) {
      setError('팝빌 홈택스수집 정액제와 공동인증서 상태를 먼저 확인해 주세요.');
      return;
    }
    if (startDate > today) {
      setError('미래 기간의 국세청 자료는 수집할 수 없습니다.');
      return;
    }
    if (!window.confirm(`${startDate} ~ ${collectionEndDate} 국세청 자료를 팝빌에서 수집하시겠습니까?`)) return;
    try {
      setCollecting(true);
      setRecords([]);
      const result = await apiRequest('/api/vat/collections', {
        method: 'POST',
        body: { startDate, endDate: collectionEndDate, confirmation: 'COLLECT' },
      });
      setJobs(result.jobs);
      setMessage(result.message || '국세청 자료 수집을 요청했습니다.');
    } catch (requestError) {
      setCollecting(false);
      setError(requestError.message);
    }
  };

  const sourceCards = [
    {
      key: 'tax-invoice', title: '매출 세금계산서', description: '국세청에 신고된 매출 전자세금계산서',
      summary: taxSummary, ready: readiness?.taxInvoice?.ready, label: readiness?.taxInvoice?.ready ? '연동 완료' : '연동 확인 필요',
    },
    {
      key: 'cash-receipt', title: '현금영수증', description: '매입·매출 현금영수증',
      summary: cashSummary, ready: readiness?.cashReceipt?.ready, label: readiness?.cashReceipt?.ready ? '연동 완료' : '연동 확인 필요',
    },
    {
      key: 'business-card', title: '사업자카드', description: '팝빌 미지원 · 별도 카드사 또는 홈택스 연동 필요',
      summary: { count: 0, amount: 0 }, ready: false, label: '별도 연동 필요',
    },
  ];

  return (
    <Box sx={{ mt: 2, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="h6">부가세 자료 관리</Typography>
          <Typography variant="body2" color="text.secondary">{startDate} ~ {endDate}</Typography>
          {collectionEndDate !== endDate && (
            <Typography variant="caption" color="text.secondary">진행 중인 분기는 오늘({collectionEndDate})까지 수집</Typography>
          )}
        </Box>
        <Button variant="contained" disabled={checking || collecting || !ready} onClick={collect}>
          {collecting ? <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />수집 중</> : '국세청 자료 가져오기'}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size="small" label="조회 방식" value={periodMode} onChange={(event) => setPeriodMode(event.target.value)}>
              <MenuItem value="quarter">분기별</MenuItem>
              <MenuItem value="custom">직접 기간 (최대 3개월)</MenuItem>
            </TextField>
          </Grid>
          {periodMode === 'quarter' ? (
            <>
              <Grid item xs={6} sm={4}>
                <TextField type="number" fullWidth size="small" label="연도" value={year} onChange={(event) => setYear(event.target.value)} inputProps={{ min: 2000, max: 2100 }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField select fullWidth size="small" label="분기" value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                  {[1, 2, 3, 4].map((value) => <MenuItem key={value} value={String(value)}>{value}분기</MenuItem>)}
                </TextField>
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={6} sm={4}>
                <TextField type="date" fullWidth size="small" label="시작일" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField type="date" fullWidth size="small" label="종료일" value={endDate} onChange={(event) => setEndDate(event.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {!checking && !ready && (
        <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
          팝빌 홈택스수집 서비스 준비가 필요합니다. 세금계산서: {readiness?.taxInvoice?.message || (readiness?.taxInvoice?.subscriptionActive ? '인증서 확인 필요' : '정액제 확인 필요')} / 현금영수증: {readiness?.cashReceipt?.message || (readiness?.cashReceipt?.subscriptionActive ? '인증서 확인 필요' : '정액제 확인 필요')}
        </Alert>
      )}
      {message && <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {sourceCards.map((source) => (
          <Grid item xs={12} md={4} key={source.key}>
            <Card variant="outlined" sx={{ height: '100%', textAlign: 'left' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2">{source.title}</Typography>
                  <Chip size="small" color={source.ready ? 'success' : 'default'} label={checking ? '확인 중' : source.label} />
                </Box>
                <Typography variant="h6">{money(source.summary.count)}건 · {money(source.summary.amount)}원</Typography>
                <Typography variant="caption" color="text.secondary">{source.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>자료 구분</TableCell>
              <TableCell>거래일</TableCell>
              <TableCell>거래처</TableCell>
              <TableCell align="right">공급가액</TableCell>
              <TableCell align="right">부가세</TableCell>
              <TableCell align="right">합계</TableCell>
              <TableCell>자료 상태</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={`${record.source}-${record.id || index}`}>
                <TableCell>{record.sourceLabel}</TableCell>
                <TableCell>{displayDate(record.date)}</TableCell>
                <TableCell>
                  <Typography variant="body2">{record.partyName || '-'}</Typography>
                  {record.partyNumber && <Typography variant="caption" color="text.secondary">{record.partyNumber}</Typography>}
                </TableCell>
                <TableCell align="right">{money(record.supplyAmount)}원</TableCell>
                <TableCell align="right">{money(record.vatAmount)}원</TableCell>
                <TableCell align="right">{money(record.totalAmount)}원</TableCell>
                <TableCell><Chip size="small" label={record.status || '수집완료'} /></TableCell>
              </TableRow>
            ))}
            {!collecting && records.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>아직 수집된 부가세 자료가 없습니다.</TableCell>
              </TableRow>
            )}
            {collecting && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>국세청 자료를 수집하고 있습니다.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
