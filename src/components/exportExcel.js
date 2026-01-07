
import React, { useRef } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx-js-style";
import ExcelJS from 'exceljs';


const borderStyle = {
    style: "thin",
    color: "000000",
};

async function rentBillReport(result, fileName) {
    const imageUrl = 'http://jcooly.cafe24.com/stamp.jpg';
    const image = await fetch(imageUrl);
    const blob = await image.blob();
    const imageBuffer = await blob.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('청구서');

    result.forEach((data) => {
        const addrow = Object.values(data);
        worksheet.addRow(addrow);
        addrow.height = 33
      });
    

    let renter,address,year,month,rentbill,mngbill,vatbill,etcbill,etc
    for (let i = 0; i < result.length; i++) {
        const array = Object.entries(result[i]);  
        console.log(array) 
        renter=array[3][1]
        address=array[2][1];
        year=array[4][1];
        month=array[5][1];
        rentbill=array[6][1];
        mngbill=array[7][1];
        etcbill=array[9][1];

        console.log({renter:renter,add:address,year:year,month:month,rentbill:rentbill,mngbill:mngbill})
        const worksheet = workbook.addWorksheet(renter);
        addSheet(worksheet,renter,address,year,month,rentbill,mngbill,etcbill);
        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png',
        });
        // 이미지를 워크시트에 배치
        worksheet.addImage(imageId, {
            tl: { col: 3, row: 18 },
            ext: { width: 60, height: 60 },
        });
    }


    const buffer = await workbook.xlsx.writeBuffer();
    const exportBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(exportBlob,fileName+ '.xlsx');
}

function addSheet(worksheet,renter,address,year,month,rentbill,mngbill,etcbill) {
    // 워크시트 생성
    let tmoney=((Number(rentbill)+ Number(rentbill)*0.1)+(Number(mngbill)+ Number(mngbill)*0.1))+Number(etcbill)
    const data = [
        [year+"년"+month+"월 제이빌딩 임대료 및 관리비 청구서", '', '', ''],
        [' ', ' ', '', ' '],
        ['제이빌딩', address, '', renter],
        [' ', ' ', '', ' '],
        ['항목', '금액', '부가세액', '합계'],
        ['월임대료', Number(rentbill), Number(rentbill)*0.1, Number(rentbill)+ Number(rentbill)*0.1],
        ['일반관리비', Number(mngbill), Number(mngbill)*0.1, Number(mngbill)+ Number(mngbill)*0.1],
        ['수도요금', Number(etcbill), '', Number(etcbill)],
        ['기타', '', '', ''],
        [' ', ' ', '', ' '],
        ['납부기한2023년 '+month+'월말일까지', '', '납기내금액', Number(tmoney)],
        ['', '', '연체가산금', Number(tmoney)*0.015],
        ['', '', '납기후금액', Number(tmoney)+Number(tmoney)*0.015],
        [' ', ' ', '', ' '],
        [' ', ' ', '', ' '],
        ['입금계좌: 기업은행 019-096651-01-015(예금주:(주)제이쿨지점)', '', '', ''],
        ['납부기한은 매월 말일이며 납부기한이 경과되면 매월1.5%의 연체료가 가산됩니다', '', '', ''],
        ['', '제이빌딩 관리실', '02-2213-2893', ''],
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
        { header: '제이빌딩 '+month+'임대료 및 관리비 청구서', key: 'header1', width: 17.83 },
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
    worksheet.mergeCells('A11:B13');
    worksheet.mergeCells('A16:D16');
    worksheet.mergeCells('A17:D17');
    return worksheet
}




function exportExcel(data, fileName) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data,{ skipHeader: false, origin: 5 });
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName+".xlsx");
}

export { exportExcel, rentBillReport }