
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
    let data = await getPromise('/jbd/confirmPay?renter=' + renter + "&title=" + title
        + "&values=" + values + "&keyName=" + keyName + "&dealYN=" + dealYN)
    if (Number(data) > 0) {
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
    // console.log({ renter: renter, title: title, values: values, textValueName: keyName });
    let data
    data = await getPromise('/jbd/updateData?renter=' + renter + "&title=" + title + "&values=" + values + "&keyName=" + keyName)
    if (Number(data) > 0) {
        alert('수정완료')
    } else {
        alert('수정실패')
    }
}
async function createData(renter, title, values, keyName) {
    let data
    const newValues = [...values];
    const newKeyname = [...keyName];
    // console.log('createData', { renter: renter, title: title, values: newValues, textValueName: newKeyname });
    data = await getPromise('/jbd/createData?renter=' + renter + "&title=" + title
        + "&values=" + newValues + "&keyName=" + newKeyname)
    if (Number(data) > 0) {
        alert('저장완료')
    } else {
        alert('저장실패')
    }
}
// console.log(apiUrl)
async function getPromise(param) {
    return await new Promise(async function (resolve, reject) {
        // console.log('getPromise',param)
        const Response = await fetch(apiUrl + param)
        const data = await Response.json();
        resolve(data)
    })
}

async function getSunabMoney(date) {
    return await new Promise(async function (resolve, reject) {
        console.log('getSunabMoney', date)
        const data = await getPromise('/jbd/getSunabMoney?date=' + date)
        resolve(data)
    })
}

async function getRenter(renter, title) {
    let field = "building_name,address,name, name2,"
        + "licensenum,name2,tel,email,etc,"
        + "start_date,end_date,"
        + "deposit,rent_bill,mng_bill,vat_bill,contract_date"
    const data = await getPromise('/jbd/GetrentEr?renter=' + renter + "&field=" + field)
    console.log('getRenter', data)
    return data
}





async function getRentbill(renter, title, limitdate) {
    const state = store.getState();
    const today = new Date();
    const date = dayjs(state.chgMonth.value).format('YYYY.MM.DD')
    let field
    // const date = dayjs(today).format('YYYY.MM.DD')
    if (title === '수납하기') {
         field = "b.rent_bill,b.mng_bill,b.vat_bill,b.etc_bill,b.etc,'" + date + "' as date,b.finish "

    } else if(title==='청구서생성') {
         field = "a.rent_bill,a.mng_bill,b.vat_bill,b.etc_bill,b.etc,'" + date + "' as date,b.finish "
    }
    console.log('field', field)

    const data = await getPromise('/jbd/GetrentBill?renter=' + renter + '&field=' + field + "&title=" + title + "&date=" + date)
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
    const data = await getPromise('/jbd/searchRenter?year=' + year + '&month=' + month + '&renter=' + Search)
    return data
}

export {
    searchBtn, createData,
    updateData, Numerictotal, NumericFormatCustom, getRentbill, GridCss,
    getRenter, getPromise, TextfileStyle, confirmPay,
    getSunabMoney
}