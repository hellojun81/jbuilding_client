import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { apiRequest } from './common';

const money = (value) => Number(value || 0).toLocaleString('ko-KR');
const popbillDateTime = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 8) return '';
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}${digits.length >= 14 ? ` ${digits.slice(8, 10)}:${digits.slice(10, 12)}` : ''}`;
};

export default function TaxInvoiceManagement() {
  const selectedMonth = useSelector((state) => state.chgMonth.value);
  const [invoices, setInvoices] = useState([]);
  const [provider, setProvider] = useState({ configured: false, provider: '' });
  const [historyConnected, setHistoryConnected] = useState(false);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [year, month] = selectedMonth.split('-');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/api/tax-invoices?year=${year}&month=${month}`)
      .then((data) => {
        if (!active) return;
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setProvider(data.provider || { configured: false, provider: '' });
        setHistoryConnected(Boolean(data.historyConnected));
        setSelected([]);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month, refreshKey]);

  const validInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.valid === 'true' && invoice.issue_status === '미발행'),
    [invoices],
  );
  const totals = useMemo(() => invoices.reduce((sum, invoice) => ({
    rentSupply: sum.rentSupply + Number(invoice.rent_supply || 0),
    rentVat: sum.rentVat + Number(invoice.rent_vat || 0),
    managementSupply: sum.managementSupply + Number(invoice.management_supply || 0),
    managementVat: sum.managementVat + Number(invoice.management_vat || 0),
    supply: sum.supply + Number(invoice.supply_amount || 0),
    vat: sum.vat + Number(invoice.vat_amount || 0),
    exempt: sum.exempt + Number(invoice.exempt_amount || 0),
    total: sum.total + Number(invoice.total_amount || 0),
  }), {
    rentSupply: 0, rentVat: 0, managementSupply: 0, managementVat: 0,
    supply: 0, vat: 0, exempt: 0, total: 0,
  }), [invoices]);
  const selectedDocumentCount = useMemo(() => invoices
    .filter((invoice) => selected.includes(invoice.renter_code))
    .reduce((sum, invoice) => sum + Number(invoice.document_count || 1), 0), [invoices, selected]);

  const toggleAll = (event) => {
    setSelected(event.target.checked ? validInvoices.map((invoice) => invoice.renter_code) : []);
  };

  const toggleInvoice = (renterCode) => (event) => {
    setSelected((current) => event.target.checked
      ? [...current, renterCode]
      : current.filter((value) => value !== renterCode));
  };

  const issueSelected = async () => {
    if (!provider.configured) {
      setError('전자세금계산서 발행사업자 계정이 연결되지 않았습니다.');
      return;
    }
    const confirmed = window.confirm(
      `${year}년 ${month}월 ${selected.length}개 거래처, 전자(세금)계산서 ${selectedDocumentCount}건을 실제 발행하시겠습니까?\n수도료가 있는 거래처는 면세 전자계산서가 별도로 발행됩니다.`,
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      const result = await apiRequest('/api/tax-invoices/issue-batch', {
        method: 'POST',
        body: { year, month, renterCodes: selected, confirmation: 'ISSUE' },
      });
      if (Number(result.failedCount || 0) > 0) {
        setError(result.message || '일부 문서 발행에 실패했습니다.');
      } else {
        alert(result.message || '일괄 발행이 완료되었습니다.');
      }
      setSelected([]);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{year}년 {month}월 세금계산서</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)}>
            국세청 전송상태 새로고침
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={loading || selected.length === 0 || !provider.configured}
            onClick={issueSelected}
          >
            선택 {selected.length}개 거래처 · {selectedDocumentCount}건 일괄 발행
          </Button>
        </Box>
      </Box>

      {!provider.configured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          발행사업자 API가 아직 연결되지 않았습니다. 과세 세금계산서와 수도료 면세 계산서 금액 확인만 가능하며 실제 발행은 비활성화됩니다.
        </Alert>
      )}
      {!historyConnected && (
        <Alert severity="info" sx={{ mb: 2 }}>
          기존 Excel 발행 이력이 DB에 없어 중복 발행 방지를 위해 선택이 잠겨 있습니다. 발행사업자 이력 동기화 후 미발행 건만 선택됩니다.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 1250 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={validInvoices.length > 0 && selected.length === validInvoices.length}
                  indeterminate={selected.length > 0 && selected.length < validInvoices.length}
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell>공급받는자</TableCell>
              <TableCell align="right">임대료</TableCell>
              <TableCell align="right">임대료 VAT</TableCell>
              <TableCell align="right">관리비</TableCell>
              <TableCell align="right">관리비 VAT</TableCell>
              <TableCell align="right">기타요금</TableCell>
              <TableCell align="right">기타 VAT</TableCell>
              <TableCell align="right">수도료(면세)</TableCell>
              <TableCell align="right">과세 합계</TableCell>
              <TableCell align="center">발행문서</TableCell>
              <TableCell>발행상태</TableCell>
              <TableCell>국세청 전송</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => {
              const valid = invoice.valid === 'true';
              return (
                <TableRow key={invoice.renter_code}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      disabled={!valid || invoice.issue_status !== '미발행'}
                      checked={selected.includes(invoice.renter_code)}
                      onChange={toggleInvoice(invoice.renter_code)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{invoice.renter_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{invoice.business_number}</Typography>
                  </TableCell>
                  <TableCell align="right">{money(invoice.rent_supply)}원</TableCell>
                  <TableCell align="right">{money(invoice.rent_vat)}원</TableCell>
                  <TableCell align="right">{money(invoice.management_supply)}원</TableCell>
                  <TableCell align="right">{money(invoice.management_vat)}원</TableCell>
                  <TableCell align="right">{money(invoice.other_supply)}원</TableCell>
                  <TableCell align="right">{money(invoice.other_vat)}원</TableCell>
                  <TableCell align="right">{money(invoice.exempt_amount)}원</TableCell>
                  <TableCell align="right">{money(invoice.total_amount)}원</TableCell>
                  <TableCell align="center">
                    세금계산서 1건{Number(invoice.exempt_amount) !== 0 ? ' + 면세 계산서 1건' : ''}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={valid ? 'success' : 'warning'} label={invoice.issue_status} />
                    {!valid && (
                      <Typography variant="caption" color="error" display="block">
                        {invoice.validation_message}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={invoice.nts_status === '국세청 전송완료'
                        ? 'success'
                        : (String(invoice.nts_status).includes('실패') ? 'error' : 'warning')}
                      label={invoice.nts_status || '확인필요'}
                    />
                    {Number(invoice.nts_expected_count || 0) > 0 && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        승인 {Number(invoice.nts_confirmed_count || 0)}/{Number(invoice.nts_expected_count)}건
                        {invoice.nts_result_at ? ` · 결과 ${popbillDateTime(invoice.nts_result_at)}` : ''}
                      </Typography>
                    )}
                    {invoice.nts_error_codes && (
                      <Typography variant="caption" display="block" color="error">
                        오류 {invoice.nts_error_codes}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && invoices.length === 0 && (
              <TableRow><TableCell colSpan={13} align="center">해당 월 청구 데이터가 없습니다.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ mt: 2, p: 2, textAlign: 'right' }}>
        임대료 {money(totals.rentSupply)}원 + VAT {money(totals.rentVat)}원 · 관리비 {money(totals.managementSupply)}원 + VAT {money(totals.managementVat)}원
        <Typography variant="body2" display="block">
          과세 공급가액 {money(totals.supply)}원 · VAT {money(totals.vat)}원 · 세금계산서 합계 {money(totals.total)}원
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          수도료(면세) {money(totals.exempt)}원은 별도의 전자계산서로 발행됩니다.
        </Typography>
      </Paper>
    </Box>
  );
}
