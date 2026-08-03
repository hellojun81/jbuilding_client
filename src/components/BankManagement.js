import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { apiRequest } from './common';

const money = (value) => Number(value || 0).toLocaleString('ko-KR');

function monthRange(year, month) {
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const today = new Date();
  const todayKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const selectedKey = `${year}${month}`;
  if (selectedKey > todayKey) throw new Error('미래 월의 은행 거래내역은 조회할 수 없습니다.');
  const endDay = selectedKey === todayKey ? today.getDate() : lastDay;
  return { startDate: `${year}${month}01`, endDate: `${year}${month}${String(endDay).padStart(2, '0')}` };
}

function transactionText(transaction) {
  return [transaction.remark1, transaction.remark2, transaction.remark3, transaction.remark4, transaction.memo]
    .filter(Boolean).join(' · ') || '-';
}

export default function BankManagement() {
  const selectedMonth = useSelector((state) => state.chgMonth.value);
  const [year, month] = selectedMonth.split('-');
  const [accounts, setAccounts] = useState([]);
  const [accountKey, setAccountKey] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ depositCount: 0, depositTotal: 0, matchedCount: 0 });
  const [choices, setChoices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest('/api/bank/accounts')
      .then((data) => {
        if (!active) return;
        const nextAccounts = Array.isArray(data.accounts) ? data.accounts : [];
        setAccounts(nextAccounts);
        setAccountKey((current) => current || nextAccounts.find((account) => Number(account.state) === 1)?.accountKey || '');
      })
      .catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/api/bank/transactions?year=${year}&month=${month}`)
      .then((data) => {
        if (!active) return;
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setSummary(data.summary || {});
        setChoices({});
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month, refreshKey]);

  const unmatchedCount = useMemo(
    () => transactions.filter((transaction) => !transaction.match_id).length,
    [transactions],
  );

  const collect = async () => {
    if (!accountKey) return setError('조회할 계좌를 선택해 주세요.');
    if (!window.confirm(`${year}년 ${month}월 입금내역을 팝빌에서 가져오시겠습니까?`)) return;
    try {
      setLoading(true);
      setError('');
      setMessage('팝빌에 입금내역 수집을 요청하는 중입니다.');
      const range = monthRange(year, month);
      const request = await apiRequest('/api/bank/collections', {
        method: 'POST', body: { accountKey, ...range, confirmation: 'COLLECT' },
      });
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const result = await apiRequest(`/api/bank/collections/${request.jobId}`);
        if (result.status === 'completed') {
          setMessage(`입금내역 ${Number(result.importedCount || 0)}건을 확인했습니다.`);
          setRefreshKey((value) => value + 1);
          return;
        }
      }
      setMessage('수집 작업이 계속 진행 중입니다. 잠시 후 다시 수집 버튼을 눌러 확인해 주세요.');
    } catch (requestError) {
      setError(requestError.message);
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const confirmMatch = async (transaction) => {
    const renterCode = choices[transaction.id] || transaction.suggested?.renterCode || '';
    const candidate = (transaction.candidates || []).find((value) => value.renterCode === renterCode);
    if (!candidate) return setError('매칭할 청구서를 선택해 주세요.');
    const forced = Number(transaction.deposit_amount) !== Number(candidate.amount);
    const difference = Number(transaction.deposit_amount) - Number(candidate.amount);
    const prompt = forced
      ? `금액이 다른 청구서를 강제 매칭합니다.\n\n입금액: ${money(transaction.deposit_amount)}원\n청구금액: ${money(candidate.amount)}원\n차액: ${difference > 0 ? '+' : ''}${money(difference)}원\n거래처: ${candidate.renterName}\n\n계속하면 청구서가 수납 완료로 변경됩니다. 정말 강제 매칭하시겠습니까?`
      : `${money(transaction.deposit_amount)}원 입금을 ${candidate.renterName}의 ${year}년 ${month}월 청구서에 매칭하시겠습니까?\n확정하면 수납 완료로 변경됩니다.`;
    if (!window.confirm(prompt)) return;
    try {
      setLoading(true);
      await apiRequest('/api/bank/matches', {
        method: 'POST',
        body: { transactionId: transaction.id, renterCode, year, month, confirmation: forced ? 'FORCE_MATCH' : 'MATCH' },
      });
      setMessage(`${candidate.renterName} 청구서를 수납 완료로 변경했습니다.`);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelMatch = async (transaction) => {
    if (!window.confirm(`${transaction.matched_renter_name} 입금 매칭을 취소하고 청구서를 미수납으로 되돌리시겠습니까?`)) return;
    try {
      setLoading(true);
      await apiRequest(`/api/bank/matches/${transaction.match_id}/cancel`, {
        method: 'POST', body: { confirmation: 'CANCEL' },
      });
      setMessage('입금 매칭을 취소했습니다.');
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3, mb: 10 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{year}년 {month}월 은행 입금내역</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>팝빌 등록계좌</InputLabel>
            <Select value={accountKey} label="팝빌 등록계좌" onChange={(event) => setAccountKey(event.target.value)}>
              {accounts.map((account) => (
                <MenuItem key={account.accountKey} value={account.accountKey} disabled={Number(account.state) !== 1}>
                  은행코드 {account.bankCode} · {account.accountNumberMasked} · {account.accountType}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={collect} disabled={loading || !accountKey}>입금내역 수집</Button>
          <Typography variant="body2">
            입금 {Number(summary.depositCount || 0)}건 · {money(summary.depositTotal)}원 · 매칭 {Number(summary.matchedCount || 0)}건 · 미매칭 {unmatchedCount}건
          </Typography>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      <Alert severity="warning" sx={{ mb: 2 }}>
        입금자명과 거래처명이 달라도 처음 수동 매칭한 관계를 기억합니다. 금액이 다른 거래처도 강제 매칭할 수 있지만, 확정하면 청구서 전체가 수납 완료로 변경되므로 차액을 반드시 확인하세요.
      </Alert>

      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 950 }}>
          <TableHead><TableRow>
            <TableCell>입금일시</TableCell><TableCell align="right">입금액</TableCell>
            <TableCell>입금자/적요</TableCell><TableCell>청구서 후보</TableCell><TableCell align="center">상태/작업</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {transactions.map((transaction) => {
              const defaultChoice = choices[transaction.id] || transaction.suggested?.renterCode || '';
              const selectedCandidate = (transaction.candidates || [])
                .find((candidate) => candidate.renterCode === defaultChoice);
              const forcedSelection = selectedCandidate && !selectedCandidate.exactAmount;
              return <TableRow key={transaction.id}>
                <TableCell>{String(transaction.trade_datetime || transaction.trade_date || '').replace('T', ' ').slice(0, 19)}</TableCell>
                <TableCell align="right"><strong>{money(transaction.deposit_amount)}원</strong></TableCell>
                <TableCell>{transactionText(transaction)}</TableCell>
                <TableCell>
                  {transaction.match_id ? transaction.matched_renter_name : (
                    <FormControl size="small" fullWidth disabled={(transaction.candidates || []).length === 0}>
                      <Select displayEmpty value={defaultChoice} onChange={(event) => setChoices((current) => ({ ...current, [transaction.id]: event.target.value }))}>
                        <MenuItem value="">거래처 직접 선택</MenuItem>
                        {(transaction.candidates || []).map((candidate) => (
                          <MenuItem key={candidate.renterCode} value={candidate.renterCode}>
                            {candidate.renterName} · {money(candidate.amount)}원
                            {candidate.exactAmount
                              ? (candidate.learnedMatch ? ' · 이전 매칭 기억' : (candidate.nameMatched ? ' · 이름 일치' : ' · 금액 일치'))
                              : ` · 차액 ${Number(candidate.difference) > 0 ? '+' : ''}${money(candidate.difference)}원`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </TableCell>
                <TableCell align="center">
                  {transaction.match_id ? <>
                    <Chip size="small" color="success" label="매칭 완료" sx={{ mr: 1 }} />
                    <Button size="small" color="error" onClick={() => cancelMatch(transaction)} disabled={loading}>취소</Button>
                  </> : <Button
                    size="small"
                    variant={forcedSelection ? 'contained' : 'outlined'}
                    color={forcedSelection ? 'warning' : 'primary'}
                    onClick={() => confirmMatch(transaction)}
                    disabled={loading || !defaultChoice}
                  >{forcedSelection ? '강제 수동 매칭' : '매칭 확정'}</Button>}
                </TableCell>
              </TableRow>;
            })}
            {!loading && transactions.length === 0 && <TableRow><TableCell colSpan={5} align="center">해당 월에 수집된 입금내역이 없습니다.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
