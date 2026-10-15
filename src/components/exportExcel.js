
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx-js-style";
import ExcelJS from 'exceljs';
import { apiRequest } from './common';


const borderStyle = {
    style: "thin",
    color: "000000",
};

function decodeExcelValue(value) {
    if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
        return new TextDecoder().decode(Uint8Array.from(value.data));
    }
    return value;
}

function normalizeExcelRows(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, decodeExcelValue(value)]),
    ));
}

async function rentBillReport(result, fileName) {
    const settings = await apiRequest('/api/bills/settings');
    const { notice } = settings;
    const imageUrl = 'http://jcooly.cafe24.com/stamp.jpg';
    const image = await fetch(imageUrl);
    const blob = await image.blob();
    const imageBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('청구서');
    const imageId = workbook.addImage({
        buffer: imageBuffer,
        extension: blob.type.includes('png') ? 'png' : 'jpeg',
    });

    result.forEach((data) => {
        const addrow = Object.values(data);
        worksheet.addRow(addrow);
        addrow.height = 33
      });
    

    for (let i = 0; i < result.length; i++) {
        const row = result[i];
        const renter = row['이름'];
        const address = row['주소'];
        const year = row['년'];
        const month = Number(row['월']);
        const rentbill = row['임대료'];
        const mngbill = row['관리비'];
        const waterbill = row['수도료'];
        const otherbill = row['기타요금'];
        const otherVatBill = row['기타 부가세'];

        const worksheet = workbook.addWorksheet(renter);
        addSheet(worksheet, renter, address, year, month, rentbill, mngbill, waterbill, otherbill, otherVatBill, [row['비고'], row['메모']].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join('\n'), notice, settings);
        // 이미지를 워크시트에 배치
        worksheet.addImage(imageId, {
            tl: { col: 3, row: 19 },
            ext: { width: 60, height: 60 },
        });
    }


    const buffer = await workbook.xlsx.writeBuffer();
    const exportBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(exportBlob,fileName+ '.xlsx');
}

function addSheet(worksheet, renter, address, year, month, rentbill, mngbill, waterbill, otherbill, otherVatBill, memo, notice, settings = {}) {
    const monthText = String(month).padStart(2, '0');
    const dueDate = `${year}-${monthText}-${new Date(Number(year), Number(month), 0).getDate()}`;
    // 워크시트 생성
    let tmoney = ((Number(rentbill) + Math.round(Number(rentbill) * 0.1))
        + (Number(mngbill) + Math.round(Number(mngbill) * 0.1)))
        + Number(waterbill) + Number(otherbill) + Number(otherVatBill)
    const data = [
        [year+"년"+month+"월 제이빌딩 임대료 및 관리비 청구서", '', '', ''],
        [' ', ' ', '', ' '],
        ['제이빌딩', '', '', renter + (address ? ` (${address})` : '')],
        [`청구 대상 기간: ${year}-${monthText}-01 ~ ${dueDate}`, '', '', ''],
        ['항목', '금액', '부가세액', '합계'],
        ['월임대료', Number(rentbill), Math.round(Number(rentbill)*0.1), Number(rentbill)+ Math.round(Number(rentbill)*0.1)],
        ['일반관리비', Number(mngbill), Math.round(Number(mngbill)*0.1), Number(mngbill)+ Math.round(Number(mngbill)*0.1)],
        ['수도료', Number(waterbill), '', Number(waterbill)],
        ['기타요금', Number(otherbill), Number(otherVatBill), Number(otherbill) + Number(otherVatBill)],
        [' ', ' ', '', ' '],
        ['납부기한 '+dueDate, '', '납기내금액', Number(tmoney)],
        ['', '', '이전 미납금', '별도 확인'],
        ['', '', '당월 청구액', Number(tmoney)],
        [' ', ' ', '', ' '],
        [' ', ' ', '', ' '],
        ['비고: ' + (String(memo || '').trim() || '-'), '', '', ''],
        [`입금계좌: ${settings.bank || ''} ${settings.account || '미설정'} / 예금주: ${settings.accountHolder || '미설정'}`, '', '', ''],
        [notice, '', '', ''],
        ['', '문의 연락처', settings.contact || '미설정', ''],
        ['', '(주)제이쿨', '대표 김완준', ''],
    ];
    data.forEach((row, index) => {
        let addrow = worksheet.addRow(row);
        addrow.height = 26.5;
        addrow.eachCell((cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (index === 0) {
                cell.font = { size: 20, bold: true };
            }
            cell.numFmt = '###,###'
        });
    });

    worksheet.columns = [
        { header: '제이빌딩 '+month+'월 임대료 및 관리비 청구서', key: 'header1', width: 17.83 },
        { header: 'Header2', key: 'header2', width: 19 },
        { header: 'Header3', key: 'header3', width: 19 },
        { header: 'Header3', key: 'header3', width: 19 },
    ];
    for (let row = 5; row <= 13; row++) {
        for (let col = 1; col <= 4; col++) {
            const cell = worksheet.getCell(row, col);
            cell.border = {
                top: borderStyle,
                left: borderStyle,
                bottom: borderStyle,
                right: borderStyle,
            };
        }
    }
    worksheet.mergeCells('A1:D1');
    worksheet.mergeCells('A4:D4');
    worksheet.mergeCells('A11:B13');
    worksheet.mergeCells('A16:D16');
    worksheet.mergeCells('A17:D17');
    worksheet.mergeCells('A18:D18');
    [16, 18].forEach((number) => { const row = worksheet.getRow(number); row.height = Math.max(40, Math.ceil(String(row.getCell(1).value || '').length / 45) * 20); row.getCell(1).alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' }; });
    return worksheet
}




function exportExcel(data, fileName) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data,{ skipHeader: false, origin: 5 });
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName+".xlsx");
}

export { decodeExcelValue, exportExcel, normalizeExcelRows, rentBillReport }
