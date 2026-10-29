import { render, screen, act } from '@testing-library/react';
import MainTable from './MainBody';
import store, { setCurrentName, next } from './store';
import { searchBtn } from './common';
jest.mock('./common', () => ({ searchBtn: jest.fn() }));
jest.mock('./LinearProgress', () => () => null);
jest.mock('./infoPopup', () => () => null);
test('returning to rent tab after payment popup reloads bills', async () => {
 store.dispatch(setCurrentName({value:'예향', title:'수납하기'}));
 searchBtn.mockResolvedValue([{name:'예향',finish:'N'}]);
 const first = render(<MainTable />);
 expect(await screen.findByText('예향')).toBeInTheDocument();
 first.unmount();
 render(<MainTable />);
 expect(await screen.findByText('예향')).toBeInTheDocument();
 expect(searchBtn).toHaveBeenCalledTimes(2);
});
test('late responses cannot replace the latest monthly list', async () => {
 let finishOld;
 searchBtn.mockImplementationOnce(() => new Promise(resolve => {finishOld=resolve;})).mockResolvedValueOnce([{name:'최신 목록',finish:'N'}]);
 render(<MainTable />);
 act(() => store.dispatch(next()));
 expect(await screen.findByText('최신 목록')).toBeInTheDocument();
 await act(async () => finishOld([{name:'이전 목록',finish:'N'}]));
 expect(screen.queryByText('이전 목록')).not.toBeInTheDocument();
 expect(screen.getByText('최신 목록')).toBeInTheDocument();
});
test('bills without delivery history have a visible indicator and retain renter click target', async () => {
 searchBtn.mockResolvedValue([{name:'미발송 거래처',finish:'N',has_delivery_history:0},{name:'발송 거래처',finish:'N',has_delivery_history:1}]);
 render(<MainTable />);
 expect(await screen.findByText('발송 내역 없음')).toBeInTheDocument();
 expect(screen.getAllByText('발송 내역 없음')).toHaveLength(1);
});
