import React, { useEffect, useState, useRef } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';
import SelProvider from './Provider.js'
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import store from './store';
import { confirmPay, createData, updateData, GridCss, Numerictotal, NumericFormatCustom, getRenter, getRentbill, TextfileStyle } from './common.js'
import { TextField } from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


function InfoPopup(props) {
    const today = new Date();
    const [getbill, setGetbill] = useState([]);
    const [total, setTotal] = useState('0');
    const [vat, setVat] = useState('0');
    const [Contdate, setContdate] = useState(dayjs(today));
    const [startdate, setStartdate] = useState(dayjs(today));
    const [enddate, setEnddate] = useState(dayjs(today));
    const [limitdate, setLimitdate] = useState(dayjs(today));
    const [selprovider, setselprovider] = useState('선택');
    const [savebtn, setSavebtn] = useState('저장');
    const state = store.getState();
    const renter = state.contentPop.value
    const title = state.contentPop.title
    const [textValue, setTextValue] = useState([['건물명', '동호수', '입주자[상호]', '사업자번호', '담당자', '연락처', '이메일', '메모'], ['계약시작일', '계약종료일', '보증금', '임대료', '관리비', '기타']]);
    const [textValueName, setTextValueName] = useState([]);

  

    const texthandleChange = (index) => (event) => {
        const newValues = [...getbill];
        newValues[index] = event.target.value;
        if (title === '임차인추가') {
            newValues[8] = startdate.format('YYYY.MM.DD')
            newValues[9] = enddate.format('YYYY.MM.DD')
            newValues[14] = Contdate.format('YYYY.MM.DD')
        }
        setGetbill(newValues);
        vatUpdate(newValues, title);
        totalBillUpdate(newValues, title);
        //부가세 합계금 구하기
        if (title === '계약정보' || title === '임차인추가') {
            if (event.target.name === 'rent_bill' || event.target.name === 'mng_bill') {
                let vat = (Number(newValues[11]) + Number(newValues[12])) * 0.1
                setVat(vat);
                let tMoney = (Number(newValues[11]) + Number(newValues[12])) + Number(vat)
                setTotal(tMoney)
            }
        }

    };
    const dtpickerChange = (label) => (event) => {
        const newValues = [...getbill];
        // console.log('dtpickerChange', { label: label, event: dayjs(event).format('YYYY.MM.DD') })
        if (title === '계약정보' || title === '임차인추가') {
            if (label === '계약시작일') {
                newValues[8] = dayjs(event).format('YYYY.MM.DD')
                setStartdate(dayjs(event))
            } else if (label === '계약종료일') {
                newValues[9] = dayjs(event).format('YYYY.MM.DD')
                setEnddate(dayjs(event))
            } else if (label === '계약일') {
                newValues[14] = dayjs(event).format('YYYY.MM.DD')
                setContdate(dayjs(event))
            }
        } else if (title === '청구서생성') {
            if (label === '수납일') {
                newValues[5] = dayjs(event).format('YYYY.MM.DD')
                setLimitdate(dayjs(event))
            }
        }
        console.log('dtpickerChange2 : ', { newValues: newValues })
        setGetbill(newValues);
    };

    const vatUpdate = (values, title) => {
        let newarrValue = [...values]
        let vatMoney = 0;
        for (let i = 0; i < 2; i++) {
            vatMoney = vatMoney + Number(values[i]);
        }
        vatMoney = vatMoney * 0.1
        if (title === '청구서생성') {
            newarrValue[2] = vatMoney
            // console.log('vatUpdate', { newarrValue: newarrValue, value: values, title: title })
            setGetbill(newarrValue)
        }
        setVat(vatMoney)
        return newarrValue
    };

    const totalBillUpdate = (values, title) => {
        let tMoney = 0;
        for (let i = 0; i < 4; i++) {
            if (values[i] === undefined) {
                values[i] = 0
            }
            tMoney = tMoney + Number(values[i]);
        }
        setTotal(tMoney)
       
    };


    
    async function getdata(renter, title) {
        let apidata = {}
        if (title === '계약정보' || title === '임차인추가') {
            apidata = await getRenter(renter, title)
        } else if (title === '수납하기' || title === '청구서생성') {
            if (renter !== '선택') {
                apidata = await getRentbill(renter, title)
            }
        }
     

        if (renter === '선택') {
            setSavebtn('저장')
            if (apidata.length > 0) {
                settingData(apidata[0], renter)
            }
        } else {
            if (title === '계약정보') {
                setSavebtn('수정')
                settingData(apidata[0], renter)
            } else if (title === '임차인추가') {
                setSavebtn('저장')
                settingData(apidata[0], renter)
            } else if (title === '청구서생성') {
                setSavebtn('저장')
                if (apidata && apidata.hasOwnProperty('result')) {
                    alert(apidata.result)
                    settingData(apidata.value[0], renter)
                    setSavebtn('수정')
                } else {
                    settingData(apidata[0], renter)
                }
            } else if (title === '수납하기') {
                if (apidata[0].finish === 'Y') {
                    setSavebtn('수납취소')
                } else {
                    setSavebtn('수납하기')
                }
                settingData(apidata[0], renter)
            }
        }
    }
    function settingData(apidata, renter) {
        let arrValue = []
        let arrKey = []
        if (apidata !== undefined) {
            if (apidata && apidata.hasOwnProperty('start_date')) {
                setStartdate(dayjs(apidata.start_date))
                setEnddate(dayjs(apidata.end_date))
                setContdate(dayjs(apidata.contract_date))
            }
            for (let i = 0; i < Object.values(apidata).length; i++) {
                if (renter === '선택') {
                    arrValue.push('')
                    setStartdate(dayjs(today))
                    setEnddate(dayjs(today))
                    setContdate(dayjs(today))
                } else {
                    arrValue.push(Object.values(apidata)[i])
                }

                arrKey.push(Object.keys(apidata)[i])
            }

            setGetbill(arrValue)
            setTextValueName(arrKey)
            if (title === '계약정보' || title === '임차인추가') {
                let newarrValue = []
                let vat = (Number(arrValue[11]) + Number(arrValue[12])) * 0.1
                newarrValue.push(arrValue[11])
                newarrValue.push(arrValue[12])
                newarrValue.push(vat)
                newarrValue.push(0)
                // console.log('newarrValue', { value: newarrValue, vat: vat })
                arrValue = newarrValue;
            }
            let a=vatUpdate(arrValue, title);
            // console.log('settingData apidata', a)
            totalBillUpdate(a, title);
        }
    }

    useEffect(() => {
        const state = store.getState();
        const renter = state.contentPop.value
        const title = state.contentPop.title
        if (title === '계약정보' || title === '임차인추가') {
            setTextValue([['건물명', '동호수', '입주자[상호]', '담당자', '사업자번호', '연락처', '이메일', '메모'], ['계약시작일', '계약종료일', '보증금', '임대료', '관리비', '부가세']]);
            getdata(renter, title)

        } else if (title === '수납하기' || title === '청구서생성') {
            setTextValue([['임대료', '관리비', '부가세', '기타', '메모']])
            getdata(renter, title)
        }
        if (renter === '선택') {
            const newValues = [...getbill];
            let arr = []
            for (let i = 0; i < newValues.length; i++) {
                arr.push('')
            }
            setGetbill(arr);
            setTotal(0)
        }

    }, []);

    let cnt = 0;
    function createGridWithDtpicker(label, startdate, enddate, value) {
        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker
                    label={label}
                    inputFormat="YYYY/MM/DD"
                    views={['year', 'month', 'day']}
                    value={
                        label === '계약시작일' ? startdate :
                            label === '계약종료일' ? enddate :
                                label === '계약일' ? Contdate :
                                    label === '수납일' ? limitdate : null
                    }
                    onChange={dtpickerChange(label)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            name="paydate"
                            className="datePickerTextField"
                            sx={TextfileStyle}
                        />
                    )}
                    className="datePickerClass"
                    sx={{ height: '30px', width: '100%', opacity: 1 }}
                />
            </LocalizationProvider>
        );
    }



    const extractedValues = textValue.map((arr) =>
        arr.map((value, index) => {
            cnt++
            let key_index = cnt - 1
            return (
                <Grid item xs={6} sx={GridCss} key={`${value}_${index}`}>
                    {value === '계약시작일' || value === '계약종료일' ?
                        createGridWithDtpicker(value, startdate, enddate, value) :
                        <TextField
                            name={textValueName[key_index] || ''}
                            label={`${value}`}
                            sx={TextfileStyle}
                            size="small"
                            value={value === '부가세' ? vat : getbill[key_index] || ''
                            }
                            onChange={texthandleChange(key_index)}
                            InputProps={
                                value === '보증금'
                                    ? { inputComponent: NumericFormatCustom }
                                    : value === '임대료'
                                        ? { inputComponent: NumericFormatCustom }
                                        : value === '관리비'
                                            ? { inputComponent: NumericFormatCustom }
                                            : value === '부가세'
                                                ? { inputComponent: NumericFormatCustom }
                                                : value === '기타'
                                                    ? { inputComponent: NumericFormatCustom }
                                                    : null
                            }
                            key={`${value}_${index}_${key_index}`}
                            focused
                        />}
                </Grid>
            );
        })
    );
    function TotalComponents() {
        let content = null
        content = <>
            <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <TextField
                    name='total'
                    value={total}
                    InputProps={{
                        inputComponent: Numerictotal
                    }}
                    variant="standard"
                />
            </Grid>
        </>
        // }
        return content
    }


    function SaveBtn() {
        let content =
            <Button variant="contained"
                sx={{
                    width: '100%',
                    height: '50px',
                    marginTop: '30px', marginBottom: '90px'
                }}
                type="submit"
                name='save'
            > {savebtn} </Button>

        if (title === '수납하기') {
            content = <>
                <Grid item xs={6} >
                    <Button variant="contained"
                        sx={{
                            width: '100%',
                            height: '50px',
                            marginTop: '30px', marginBottom: '90px'
                        }}
                        type="submit"
                        name='edit'
                        value='edit'
                    >수정하기 </Button>
                </Grid>
                <Grid item xs={6} >
                    {content}
                </Grid>
            </>
        } else {
            content = <Grid item xs={12} > {content} </Grid>
        }
        return content
    }

    return (
        <>
            <form onSubmit={event => {
                // console.log('onSubmit', { event: event.nativeEvent.submitter.name });
                const name = event.nativeEvent.submitter.name
                event.preventDefault();
                if (title === '계약정보') {
                    // console.log('form Submit 계약정보+수정 ', { renter: renter, title: title, value: getbill, key: textValueName })
                    updateData(renter, title, getbill, textValueName);
                } else if (title === '임차인추가') {
                    // console.log('form Submit 임차인추가+저장 ', { renter: renter, title: title, value: getbill, key: textValueName })
                    createData(renter, title, getbill, textValueName);
                } else if (title === '청구서생성') {
                    if (savebtn === '저장') {
                        // console.log('form Submit 청구서생성+저장', { renter: renter, title: title, value: getbill, key: textValueName })
                        createData(renter, title, getbill, textValueName);
                    } else if (savebtn === '수정') {
                        // console.log('form Submit 청구서생성+수정', { renter: renter, title: title, value: getbill, key: textValueName })
                        updateData(renter, title, getbill, textValueName);
                    }
                } else if (title === '수납하기') {
                    if (name === 'save') {
                        console.log('form Submit 수납하기+수납하기', { savebtn: savebtn, renter: renter, title: title, value: getbill, key: textValueName })
                        if (savebtn === '수납하기') {
                            setSavebtn('수납취소')
                            confirmPay(renter, title, getbill, textValueName, 'Y');
                        } else {
                            setSavebtn('수납하기')
                            confirmPay(renter, title, getbill, textValueName, 'N');
                        }
                    } else if (name === 'edit') {
                        console.log('form Submit 수납하기+수정하기', { savebtn: savebtn, renter: renter, title: title, value: getbill, key: textValueName })
                        updateData(renter, title, getbill, textValueName);
                    }
                    // updateData(renter, title, getbill, textValueName, limitdate);
                }
            }}>
                <Box sx={{
                    padding: '20px',
                }}>

                    <Grid container sx={{ backgroundColor: '#F7F7F7' }} spacing={3}>
                        <Grid item xs={6} sx={GridCss} >
                            <SelProvider
                                value={selprovider}
                                title={title}
                            />
                        </Grid>
                        <Grid item xs={6} sx={GridCss} >
                            {title === '계약정보' || title === '임차인추가' ?
                                createGridWithDtpicker('계약일', '', '', Contdate)
                                : createGridWithDtpicker('수납일', '', '', limitdate)
                            }
                        </Grid>
                        {extractedValues}
                        <Grid item xs={12} >
                            <Divider variant="middle" orientation="horizontal" sx={{ margin: '10px' }} />
                        </Grid>
                        <TotalComponents />
                        <SaveBtn />
                    </Grid>
                </Box>
            </form>
        </>
    )
}
export default InfoPopup