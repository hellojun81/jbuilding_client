import { render, screen, fireEvent } from '@testing-library/react';
import BillDeliveryHistory from './BillDeliveryHistory';
import { apiRequest } from './common';
jest.mock('./BillNoticeSettings', () => () => null);
jest.mock('./common', () => ({ apiRequest: jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: (select) => select({ chgMonth: { value: '2026-10' } }) }));
beforeEach(() => jest.clearAllMocks());
test('empty monthly history is explicit', async () => {
 apiRequest.mockResolvedValue({ rows: [], total: 0 });
 render(<BillDeliveryHistory />);
 expect(await screen.findByText('조회 조건에 맞는 발송 내역이 없습니다.')).toBeInTheDocument();
 expect(apiRequest.mock.calls[0][0]).toContain('year=2026&month=10');
});
test('opens stored content and receipt without sending', async () => {
 const row = { id: 1, renter_name: '테스트', channel: 'email', recipient: 'test@example.com', status: 'submitted', bill_year: '2026', bill_month: '10' };
 apiRequest.mockResolvedValueOnce({ rows: [row], total: 1 }).mockResolvedValueOnce({ ...row, receipt: 'receipt-test', content_text: '발송 당시 청구 내용' });
 render(<BillDeliveryHistory />);
 fireEvent.click(await screen.findByRole('button', { name: '상세 보기' }));
 expect(await screen.findByText('발송 당시 청구 내용')).toBeInTheDocument();
 expect(screen.getByText('접수번호: receipt-test')).toBeInTheDocument();
 expect(apiRequest).toHaveBeenLastCalledWith('/api/bills/delivery-history/1');
});
