import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
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
  const [amountUnit, setAmountUnit] = useState('천원');
  const displayMoney = (value) => (Number(value || 0) / (amountUnit === '천원' ? 1000 : 1)).toLocaleString('ko-KR', { maximumFractionDigits: 3 });
  const amountCell = (supply, vat) => (
    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
      <Typography component="div" fontWeight={600} title={`${money(supply)}원`}>{displayMoney(supply)}</Typography>
      <Typography component="div" variant="caption" color="text.secondary" title={`VAT ${money(vat)}원`}>VAT {displayMoney(vat)}</Typography>
    </TableCell>
  );
  const [basisSelection, setBasisSelection] = useState({ period: '', choices: {} });
  const period = selectedMonth.slice(0, 7);
  const amountBases = useMemo(() => basisSelection.period === period ? basisSelection.choices : {}, [basisSelection, period]);
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
    setSelected([]);
    setError('');
    apiRequest('/api/tax-invoices/preview', { method: 'POST', body: { year, month, amountBases } })
      .then((data) => {
        if (!active) return;
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setProvider(data.provider || { configured: false, provider: '' });
        setHistoryConnected(Boolean(data.historyConnected));
        setSelected([]);
      })
      .catch((requestError) => { if (active) { setInvoices([]); setError(requestError.message); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month, refreshKey, amountBases]);

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

  const changeBasis = (renterCode, basis) => {
    setLoading(true);
    setSelected([]);
    setBasisSelection({ period, choices: { ...amountBases, [renterCode]: basis } });
  };

  const issueSelected = async () => {
    if (!provider.configured) {
      setError('전자세금계산서 발행사업자 계정이 연결되지 않았습니다.');
      return;
    }
    const selectedInvoices = invoices.filter((invoice) => selected.includes(invoice.renter_code));
    const details = selectedInvoices.map((invoice) => `${invoice.renter_name}: ${invoice.amount_basis === 'paid' ? '입금 금액' : invoice.amount_basis === 'billed' ? '청구 금액' : '기존 항목 금액'} ${money(invoice.issue_amount)}원 (과세 ${money(invoice.total_amount)}원 + 면세 ${money(invoice.exempt_amount)}원)`).join('\n');
    const confirmed = window.confirm(
      `${year}년 ${month}월 ${selected.length}개 거래처, 전자(세금)계산서 ${selectedDocumentCount}건을 실제 발행하시겠습니까?\n수도료가 있는 거래처는 면세 전자계산서가 별도로 발행됩니다.\n\n${details}`,
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      const result = await apiRequest('/api/tax-invoices/issue-batch', {
        method: 'POST',
        body: { year, month, renterCodes: selected, confirmation: 'ISSUE', amountBases,
          amountRevisions: Object.fromEntries(selectedInvoices.map((invoice) => [invoice.renter_code, invoice.amount_revision])) },
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h6">{year}년 {month}월 세금계산서</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select size="small" value={amountUnit} onChange={(event) => setAmountUnit(event.target.value)} inputProps={{ 'aria-label': '금액 표시 단위' }}>
            <MenuItem value="천원">단위: 천원</MenuItem>
            <MenuItem value="원">단위: 원</MenuItem>
          </Select>
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
      <Alert severity="info" sx={{ mb: 2 }}>
        금액 불일치 시 청구 금액 또는 해당 청구월에 연결된 입금 금액을 선택하세요.
        선택한 총액에서 수도료(면세)를 유지하고, 나머지를 기존 공급가액 비율로 나누어 공급가액과 VAT를 다시 계산합니다.
        청구 원본과 입금 내역은 변경하지 않습니다.
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        금액 단위: {amountUnit} · 각 항목 아래에 VAT 표시 · 금액에 마우스를 올리면 원 단위 확인 · 발행 확인창은 원 단위
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: '65vh', border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table size="small" stickyHeader sx={{ minWidth: 1060,
          '& th': { bgcolor: '#f1f5f9', color: '#334155', fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 },
          '& td': { py: 1.5, borderColor: '#e2e8f0' },
          '& tbody tr:nth-of-type(even)': { bgcolor: '#f8fafc' },
          '& tbody tr:hover': { bgcolor: '#eff6ff' },
          '& th:nth-of-type(2), & td:nth-of-type(2)': { position: 'sticky', left: 0, zIndex: 1, bgcolor: '#f8fafc', minWidth: 120 },
          '& th:nth-of-type(2)': { zIndex: 3 },
        }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={validInvoices.length > 0 && selected.length === validInvoices.length}
                  indeterminate={selected.length > 0 && selected.length < validInvoices.length}
                  disabled={loading}
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell>공급받는자</TableCell>
              <TableCell align="right">임대료</TableCell>
              <TableCell align="right">관리비</TableCell>
              <TableCell align="right">기타요금</TableCell>
              <TableCell align="right">수도료(면세)</TableCell>
              <TableCell align="right">과세 합계</TableCell>
              <TableCell>발행 금액 기준</TableCell>
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
                      disabled={loading || !valid || invoice.issue_status !== '미발행'}
                      checked={selected.includes(invoice.renter_code)}
                      onChange={toggleInvoice(invoice.renter_code)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{invoice.renter_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{invoice.business_number}</Typography>
                  </TableCell>
                  {amountCell(invoice.rent_supply, invoice.rent_vat)}
                  {amountCell(invoice.management_supply, invoice.management_vat)}
                  {amountCell(invoice.other_supply, invoice.other_vat)}
                  <TableCell align="right" title={`${money(invoice.exempt_amount)}원`} sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{displayMoney(invoice.exempt_amount)}</TableCell>
                  <TableCell align="right" title={`${money(invoice.total_amount)}원`} sx={{ fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{displayMoney(invoice.total_amount)}</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Select
                      size="small" fullWidth displayEmpty
                      value={invoice.amount_basis || ''}
                      disabled={loading || invoice.issue_status !== '미발행'}
                      inputProps={{ 'aria-label': `${invoice.renter_name} 발행 금액 기준` }}
                      onChange={(event) => changeBasis(invoice.renter_code, event.target.value)}
                    >
                      <MenuItem value="">기존 항목 금액</MenuItem>
                      <MenuItem value="billed">청구 {displayMoney(invoice.billed_amount)}{amountUnit}</MenuItem>
                      <MenuItem value="paid" disabled={invoice.payment_available !== 'true' || Number(invoice.paid_amount) <= Number(invoice.exempt_amount)}>
                        입금 금액 {invoice.payment_available === 'true' ? `${displayMoney(invoice.paid_amount)}${amountUnit}` : '(연결된 입금 없음)'}
                      </MenuItem>
                    </Select>
                    <Typography variant="caption" display="block">발행 총액 {displayMoney(invoice.issue_amount)}{amountUnit}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>과세 1건{Number(invoice.exempt_amount) !== 0 ? ' · 면세 1건' : ''}</Typography>
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
              <TableRow><TableCell colSpan={10} align="center">해당 월 청구 데이터가 없습니다.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        {[
          ['과세 공급가액', totals.supply],
          ['부가세', totals.vat],
          ['전체 발행 합계 (면세 포함)', totals.total + totals.exempt],
        ].map(([label, value]) => (
          <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h6" title={`${money(value)}원`} sx={{ mt: 0.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {displayMoney(value)} <Typography component="span" variant="body2">{amountUnit}</Typography>
            </Typography>
          </Paper>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        수도료(면세) {displayMoney(totals.exempt)}{amountUnit} · 별도 전자계산서로 발행됩니다.
      </Typography>
    </Box>
  );
}
