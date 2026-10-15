import { render, screen, fireEvent } from '@testing-library/react';
import BillDelivery from './BillDelivery';
import { apiRequest } from './common';
jest.mock('./common',()=>({apiRequest:jest.fn()}));
const preview={label:'이메일',total:1000,revision:'revision',history:[],channels:[{channel:'email',recipient:'test@example.com',valid:true,enabled:false,missing:['SMTP_USER'],ready:false,content:'청구서'}]};
beforeEach(()=>jest.clearAllMocks());
test('preview displays missing settings and blocks sending',async()=>{
 apiRequest.mockResolvedValue(preview);render(<BillDelivery renter="테스트" period="2026-10"/>);
 fireEvent.click(screen.getByRole('button',{name:'저장된 청구서 미리보기 / 발송'}));
 await screen.findByText(/발송서비스 연결 설정이 필요합니다/);
 expect(screen.getByRole('button',{name:'확인 후 실제 발송'})).toBeDisabled();
 expect(apiRequest).toHaveBeenCalledTimes(1);
});
test('previously submitted channels cannot be resent',async()=>{
 apiRequest.mockResolvedValue({...preview,history:[{channel:'email',status:'submitted',receipt:'fake'}]});
 render(<BillDelivery renter="테스트" period="2026-10"/>);
 fireEvent.click(screen.getByRole('button',{name:'저장된 청구서 미리보기 / 발송'}));
 await screen.findByText(/발송 접수 완료/);
 expect(screen.getByRole('button',{name:'확인 후 실제 발송'})).toBeDisabled();
});
test('preview submits the unsaved note from the form', async () => {
 apiRequest.mockResolvedValue(preview);
 render(<BillDelivery renter="테스트" period="2026-10" note="청구서 테스트" />);
 fireEvent.click(screen.getByRole('button', { name: '저장된 청구서 미리보기 / 발송' }));
 await screen.findByText(/발송서비스 연결 설정이 필요합니다/);
 expect(apiRequest).toHaveBeenCalledWith('/api/bills/'+encodeURIComponent('테스트')+'/delivery-preview', { method: 'POST', body: { year: '2026', month: '10', note: '청구서 테스트', details: {} } });
});
