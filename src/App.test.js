import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: '로그인이 필요합니다.' }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('로그인 화면을 표시한다', () => {
  render(<App />);
  expect(screen.getByRole('textbox', { name: /ID/ })).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
});
