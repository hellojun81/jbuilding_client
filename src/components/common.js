
import TextField from '@mui/material/TextField';
import React, { useEffect, useState, useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import PropTypes from 'prop-types';
import Divider from '@mui/material/Divider';
import dayjs from 'dayjs';
import store from './store'
const apiUrl = process.env.REACT_APP_API_URL;
const TextfileStyle = {
    width: '100%',

    borderWidth: '1px!important',
    "& label.Mui-focused": {
        color: "#333"
    },
    "& .MuiInput-underline:after": {
        borderBottomColor: "#333"
    },
    "& .MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: "#333"
        },
        "&:hover fieldset": {
            borderColor: "#333"
        },
        "&.Mui-focused fieldset": {
            borderColor: "#333"
        }
    },
};
const GridCss = {
    width: '100%',
    "& label.Mui-focused": {
        color: "black"
    },
};

const Numerictotal = React.forwardRef(function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                const newValue = Math.floor(Number(values.value)); // 소수점 이하를 버림
                onChange({
                    target: {
                        name: props.name,
                        value: newValue.toString() // 다시 문자열로 변환
                    }
                });
            }}
            thousandSeparator
            valueIsNumericString
            prefix="합계 : "
        />
    );
});

const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: props.name,
                        value: values.value
                    }
                });
            }}
            thousandSeparator
            valueIsNumericString
        />
    );
});

NumericFormatCustom.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};
// async function getExcelData(){
//     const state = store.getState();
//     const date = dayjs(state.chgMonth.value).format('YYYY.MM.DD')
//     let data = await getPromise('/jbd/getExcelData?date=' + date)
//     return data
// }



async function confirmPay(renter, title, values, keyName, dealYN) {
    const payload = valuesToObject(values, keyName);
    const data = await apiRequest('/api/bills/' + encodeURIComponent(renter) + '/payment', {
        method: 'PATCH',
        body: { date: payload.date, finish: dealYN },
    });
    if (Number(data.affectedRows) > 0) {
        if (dealYN === 'Y') {
            alert('수납완료')
        } else {
            alert('수납취소')
        }
    } else {
        alert('수납실패')
    }
}

async function updateData(renter, title, values, keyName) {
    const path = title === '계약정보'
        ? '/api/renters/' + encodeURIComponent(renter)
        : '/api/bills/' + encodeURIComponent(renter);
    const data = await apiRequest(path, {
        method: 'PATCH',
        body: valuesToObject(values, keyName),
    });
    if (Number(data.affectedRows) > 0) {
        alert('수정완료')
    } else {
        alert('수정실패')
    }
}
async function createData(renter, title, values, keyName) {
    const isRenter = title === '임차인추가';
    const path = isRenter ? '/api/renters' : '/api/bills/' + encodeURIComponent(renter);
    const data = await apiRequest(path, {
        method: 'POST',
        body: valuesToObject(values, keyName),
    });
    if (Number(data.affectedRows) > 0) {
        alert('저장완료')
    } else {
        alert('저장실패')
    }
}
// console.log(apiUrl)
function valuesToObject(values, keyName) {
    return Object.fromEntries(
        keyName.map((key, index) => [key, values[index]])
            .filter(([key]) => key),
    );
}

async function apiRequest(param, options = {}) {
    const response = await fetch(apiUrl + param, {
        method: options.method || 'GET',
        credentials: 'include',
        headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || '서버 요청에 실패했습니다.');
    return data;
}

async function getPromise(param) {
    return apiRequest(param);
}

async function getSunabMoney(date) {
    return await new Promise(async function (resolve, reject) {
        console.log('getSunabMoney', date)
        const data = await getPromise('/api/summary?date=' + encodeURIComponent(date))
        resolve(data)
    })
}

async function getRenter(renter, title) {
    if (renter === '선택') {
        const fields = [
            'building_name', 'address', 'name', 'name2', 'licensenum', 'tel', 'email', 'etc',
            'start_date', 'end_date', 'deposit', 'rent_bill', 'mng_bill', 'vat_bill',
            'water_bill', 'other_bill', 'other_vat_bill', 'contract_date',
        ];
        return [Object.fromEntries(fields.map((field) => [field, '']))];
    }
    const data = await getPromise('/api/renters/' + encodeURIComponent(renter))
    console.log('getRenter', data)
    return data
}





async function getRentbill(renter, title, limitdate) {
    const state = store.getState();
    const today = new Date();
    const date = dayjs(state.chgMonth.value).format('YYYY.MM.DD')
    const mode = title === '수납하기' ? 'payment' : 'create';
    const data = await getPromise('/api/bills/' + encodeURIComponent(renter)
        + '?date=' + encodeURIComponent(date) + '&mode=' + mode)
    // if (Object.keys(data).length > 0) {
    return data
    // console.log('Common getRentbill : ',data)
    //  }
}
async function searchBtn(Search) {
    const state = store.getState();
    let date = state.chgMonth.value
    let month = date.slice(5, 7)
    let year = date.slice(0, 4)
    console.log('searchRenter', month)
    const data = await getPromise('/api/bills?year=' + year + '&month=' + month
        + '&search=' + encodeURIComponent(Search || ''))
    return data
}

export {
    searchBtn, createData,
    updateData, Numerictotal, NumericFormatCustom, getRentbill, GridCss,
    getRenter, getPromise, TextfileStyle, confirmPay,
    getSunabMoney, apiRequest
}
