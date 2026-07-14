import { saveAs } from 'file-saver';
import { decodeExcelValue, normalizeExcelRows, rentBillReport } from './exportExcel';
import { Buffer } from 'buffer';
import { TextDecoder } from 'util';

global.TextDecoder = TextDecoder;

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

test('MySQL Buffer JSON을 한글 문자열로 복구한다', () => {
  const encoded = Array.from(Buffer.from('예향', 'utf8'));
  expect(decodeExcelValue({ type: 'Buffer', data: encoded })).toBe('예향');
});

test('엑셀 행의 숫자는 유지하고 문자열만 복구한다', () => {
  expect(normalizeExcelRows([{
    이름: { type: 'Buffer', data: Array.from(Buffer.from('제이쿨', 'utf8')) },
    임대료: 100000,
  }])).toEqual([{ 이름: '제이쿨', 임대료: 100000 }]);
});

test('청구서 워크북을 생성해 xlsx 파일 저장을 요청한다', async () => {
  const onePixelPng = Uint8Array.from(Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
    'base64',
  ));
  global.fetch = jest.fn().mockResolvedValue({
    blob: async () => ({
      type: 'image/png',
      arrayBuffer: async () => onePixelPng.buffer,
    }),
  });

  await rentBillReport([{
    날짜: '2026.06.01', 빌딩명: '제이빌딩', 주소: '101호', 이름: '예향',
    년: '2026', 월: '06', 임대료: 1000000, 관리비: 100000, 부가세: 110000,
    수도료: 20000, 기타요금: 0, '기타 부가세': 0, 합계: 1230000, 비고: '', 메모: '',
  }], '2026.06.01청구서엑셀다운로드');

  expect(saveAs).toHaveBeenCalledWith(
    expect.any(Blob),
    '2026.06.01청구서엑셀다운로드.xlsx',
  );
});
