import { calculateBillingValues } from './billingAmounts';
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
    const [textValue, setTextValue] = useState([['건물명', '동호수', '입주자[상호]', '사업자번호', '담당자', '연락처', '이메일', '메모'], ['계약시작일', '계약종료일', '보증금', '임대료', '관리비', '부가세', '수도료', '기타요금', '기타 부가세']]);
    const [textValueName, setTextValueName] = useState([]);

  

    const texthandleChange = (index) => (event) => {
        const newValues = [...getbill];
        newValues[index] = event.target.value;
        if (title === '임차인추가') {
            newValues[8] = startdate.format('YYYY.MM.DD')
            newValues[9] = enddate.format('YYYY.MM.DD')
            newValues[17] = Contdate.format('YYYY.MM.DD')
        }
        applyBillingValues(newValues);

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
                newValues[17] = dayjs(event).format('YYYY.MM.DD')
                setContdate(dayjs(event))
            }
        } else if (title === '청구서생성') {
            if (label === '수납일') {
                newValues[7] = dayjs(event).format('YYYY.MM.DD')
                setLimitdate(dayjs(event))
            }
        }
        console.log('dtpickerChange2 : ', { newValues: newValues })
        setGetbill(newValues);
    };

    const applyBillingValues = (values) => {
        const calculated = calculateBillingValues(values, title);
        setGetbill(calculated.values);
        setVat(calculated.vat);
        setTotal(calculated.total);
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
                if (apidata && apidata.exists) {
                    alert('해당 월의 청구서가 이미 존재합니다.')
                    settingData(apidata.value[0], renter)
                    setSavebtn('수정')
                } else {
                    settingData(apidata[0], renter)
                }
            } else if (title === '수납하기') {
                if (!apidata[0]) {
                    alert('선택한 월의 청구서가 없습니다.')
                    return
                }
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

            setTextValueName(arrKey);
            applyBillingValues(arrValue);
        }
    }

    useEffect(() => {
        const state = store.getState();
        const renter = state.contentPop.value
        const title = state.contentPop.title
        if (title === '계약정보' || title === '임차인추가') {
            setTextValue([['건물명', '동호수', '입주자[상호]', '담당자', '사업자번호', '연락처', '이메일', '메모'], ['계약시작일', '계약종료일', '보증금', '임대료', '관리비', '부가세', '수도료', '기타요금', '기타 부가세']]);
            getdata(renter, title)

        } else if (title === '수납하기' || title === '청구서생성') {
            setTextValue([['임대료', '관리비', '부가세', '수도료', '기타요금', '기타 부가세', '메모']])
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
                                                ? { inputComponent: NumericFormatCustom, readOnly: true }
                                                : value === '수도료'
                                                    ? { inputComponent: NumericFormatCustom }
                                                    : value === '기타요금'
                                                        ? { inputComponent: NumericFormatCustom }
                                                        : value === '기타 부가세'
                                                            ? { inputComponent: NumericFormatCustom, readOnly: true }
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
                        inputComponent: Numerictotal, readOnly: true
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
            <form onSubmit={async event => {
                // console.log('onSubmit', { event: event.nativeEvent.submitter.name });
                const name = event.nativeEvent.submitter.name
                event.preventDefault();
                const saveValues = calculateBillingValues(getbill, title).values;
                try {
                if (title === '계약정보') {
                    // console.log('form Submit 계약정보+수정 ', { renter: renter, title: title, value: getbill, key: textValueName })
                    await updateData(renter, title, saveValues, textValueName);
                } else if (title === '임차인추가') {
                    // console.log('form Submit 임차인추가+저장 ', { renter: renter, title: title, value: getbill, key: textValueName })
                    await createData(renter, title, saveValues, textValueName);
                } else if (title === '청구서생성') {
                    if (savebtn === '저장') {
                        // console.log('form Submit 청구서생성+저장', { renter: renter, title: title, value: getbill, key: textValueName })
                        await createData(renter, title, saveValues, textValueName);
                    } else if (savebtn === '수정') {
                        // console.log('form Submit 청구서생성+수정', { renter: renter, title: title, value: getbill, key: textValueName })
                        await updateData(renter, title, saveValues, textValueName);
                    }
                } else if (title === '수납하기') {
                    if (name === 'save') {
                        console.log('form Submit 수납하기+수납하기', { savebtn: savebtn, renter: renter, title: title, value: getbill, key: textValueName })
                        if (savebtn === '수납하기') {
                            setSavebtn('수납취소')
                            await confirmPay(renter, title, saveValues, textValueName, 'Y');
                        } else {
                            setSavebtn('수납하기')
                            await confirmPay(renter, title, saveValues, textValueName, 'N');
                        }
                    } else if (name === 'edit') {
                        console.log('form Submit 수납하기+수정하기', { savebtn: savebtn, renter: renter, title: title, value: getbill, key: textValueName })
                        await updateData(renter, title, saveValues, textValueName);
                    }
                    // updateData(renter, title, getbill, textValueName, limitdate);
                }
                } catch (error) {
                    alert(error.message || '저장에 실패했습니다.');
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
