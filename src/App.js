import './App.css';
import Mainbody from './components/MainBody.js'
import LinearProgress from './components/LinearProgress.js'
import React, { useRef, useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import InfoPopup from './components/infoPopup.js'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import BungalowIcon from '@mui/icons-material/Bungalow';
import ArticleIcon from '@mui/icons-material/Article';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import store, { setCurrentName } from './components/store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { getPromise } from './components/common';
import { exportExcel, rentBillReport } from './components/exportExcel';
import dayjs from 'dayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
const apiUrl = process.env.REACT_APP_API_URL;

const theme = createTheme();

const actions = [
  { icon: <DownloadIcon />, name: '[계산서]엑셀다운', operation: 'taxbillDown' },
  { icon: <DownloadIcon />, name: '[청구서]엑셀다운', operation: 'rentbillDown' },
  { icon: <ArticleIcon />, name: '청구서생성', operation: 'RentBill' },
  { icon: <BungalowIcon />, name: '임차인추가', operation: 'RentEr' },
  // { icon: <CheckIcon />, name: '수납하기', operation: 'Payment' },
];

function Header(props) {
  return <header>
    <h1 style={{ textAlign: 'left', paddingLeft: '20px' }}><a className="MainTitle" href='/'
      style={{ textDecoration: 'none' }}
      onClick={(e) => {
        e.preventDefault();
        props.onChangeMode()
      }}>{props.title}</a></h1>
  </header>
}

function App() {
  const [DialogOpen, setDialogOpen] = useState(false);
  const [popTitle, setpopTitle] = useState();
  const [PopContent, setPopContent] = useState();
  // const [mode, setMode] = useState('loginCheck');
  const [mode, setMode] = useState('loginCheck');
  const prevState = useRef(store.getState());
  useEffect(() => {
    console.log('apiUrl : ', apiUrl)
    const subscribeCallback = () => {
      setMode('loginOK')
      const state = store.getState();
      const renter = state.contentPop.value;
      const title = state.contentPop.title;
      setpopTitle(title);

      console.log('mode', mode)
      if (state.contentPop !== prevState.current.contentPop) {
        // console.log('App : state [contentPop] change', title);
        setPopContent(<InfoPopup />);
        setDialogOpen(true);
      }
      prevState.current = state;
    };

    store.subscribe(subscribeCallback);
    return () => {
      store.unsubscribe(subscribeCallback);
    };
  }, []);

  async function getExcel(kind) {
    let fileName
    let result
    let newArr = []
    const state = store.getState();
    const date = dayjs(state.chgMonth.value).format('YYYY.MM.DD')
    const year = dayjs(state.chgMonth.value).format('YYYY')
    const month = dayjs(state.chgMonth.value).format('MM')
    const last = dayjs(new Date(year, month, 0)).format('DD');
    const WriteDate = year + month + last
    if (kind === 'rentbillDown') {
      fileName = date + '청구서엑셀다운로드'
      result = await getPromise('/jbd/getExcelData?date=' + date + '&kind=rentbilldown')
      rentBillReport(result, fileName);
    } else if (kind === 'taxbillDown') {

      result = await getPromise('/jbd/getExcelData?date=' + date + '&kind=taxbilldown')
      // console.log('result', result)
      for (let k = 0; k < result.length; k++) {
        for (let i = 0; i < result[k].length; i++) {
          for (let j = 0; j < Object.keys(result[k][i]).length; j++) {
            let keys = Object.keys(result[k][i])[j]
            if (keys.indexOf('공급가액') === 0 || keys.indexOf('세액') === 0) {
              result[k][i][Object.keys(result[k][i])[j]] = Number(Object.values(result[k][i])[j])
            }
            if (keys.indexOf('공급가액2') === 0 || keys.indexOf('세액3') === 0) {
              if (k !== 0) {
                result[k][i][Object.keys(result[k][i])[j]] = ''
              }
            }
            if (keys.indexOf('공급가액3') === 0 || keys.indexOf('세액3') === 0) {
              result[k][i][Object.keys(result[k][i])[j]] = ''
            }
            if (keys.indexOf('공급가액4') === 0 || keys.indexOf('세액4') === 0) {
              result[k][i][Object.keys(result[k][i])[j]] = ''
            }
            if (keys.indexOf('작성일자') === 0) {
              result[k][i][Object.keys(result[k][i])[j]] = WriteDate
            }
            if (keys.indexOf('일자1') > 0 || keys.indexOf('일자2') === 0) {
              result[k][i][Object.keys(result[k][i])[j]] = last
            }
            if (keys.indexOf('일자2') === 0) {
              if (k > 0) {
                result[k][i][Object.keys(result[k][i])[j]] = ''
              }

            }
          }
        }
        if (k === 0) {
          fileName = '제이빌딩[' + month + ']월임대료세금계산서발행'
        } else {
          fileName = '제이빌딩[' + month + ']월수도료계산서발행'
        }

        console.log('exportExcel result', { data: result[k], WriteDate: WriteDate })

        exportExcel(result[k], fileName);
      }
    }

  }


  function SpeedDialBtn() {
    const dispatch = useDispatch();
    const SpeedDialClick = (e) => {

      if (e === 'RentBill') {
        dispatch(setCurrentName({ value: '선택', title: '청구서생성' }))
        setPopContent(<InfoPopup />)
        setDialogOpen(true)
      } else if (e === 'RentEr') {
        dispatch(setCurrentName({ value: '선택', title: '임차인추가' }))
        setPopContent(<InfoPopup />)
        setDialogOpen(true)
      } else if (e === 'rentbillDown' || e === 'taxbillDown') {
        getExcel(e)
      }
    }
    return (
      <>

        <SpeedDial
          ariaLabel="SpeedDial example"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon openIcon={<CloseIcon />} />}
        // onClick={SpeedDialClick}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={(e) => {
                SpeedDialClick(action.operation)
              }}
            />
          ))}


        </SpeedDial>
      </>
    )
  };

  function MainDialog() {
    const dispatch = useDispatch();
    const handleClose = () => {
      dispatch(setCurrentName({ value: 'Close', title: '임차인추가' }))
      setDialogOpen(false);
    };


    return (
      <Dialog
        open={DialogOpen}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description">

        <DialogTitle>
          <Grid container spacing={2} >
            <Grid item xs={10} ><DialogTitle id="scroll-dialog-title">{popTitle}</DialogTitle></Grid>
            <Grid item xs={2} >
              <DialogActions>
                <Button onClick={handleClose}>CLOSE</Button>
              </DialogActions>
            </Grid>
          </Grid>
        </DialogTitle>
        {PopContent}
      </Dialog>
    )
  }

  async function loginApi(id, pw) {
    if(id==='jcool' && pw==='dkffjqb@81'){
      setMode('loginOK')
    }else{
      alert('아이디 또는 비밀번호가 틀립니다')
    }
 
    // const response = await fetch(apiUrl + '/api/login?id=' + id + '&pw=' + pw, {
    //   credentials: 'include',
    //   //  credentials: 'same-origin',
    // })
    //   .then((response) => response.json())
    //   .then((data) => {
    //     if (data.result === 'ok') {

    //       setMode('loginOK')
    //     } else {
    //       setMode('login')
    //       if (id !== '') {
    //         alert('아이디 또는 비밀번호가 틀립니다')
    //       }
    //     }
    //   });
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      id: data.get('id'),
      password: data.get('password'),
    });
    loginApi(data.get('id'), data.get('password'))
  };



  if (mode === 'loginCheck') {
    return (
      <ThemeProvider theme={theme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              WelCome!!
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="ID"
                name="id"
                autoComplete="id"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 1, mb: 2, height: 50 }}
              >
                Sign In
              </Button>

            </Box>
          </Box>

        </Container>
      </ThemeProvider>
    );
  } else if (mode === 'loginOK') {
    return (
      <div className="App" sx={{ maxWidth: '600px' }}>
        <Provider store={store}>

          <Header title="제이빌딩 임대료관리" />
          <MainDialog />
          <React.Fragment>
            <CssBaseline />
            <Container maxWidth="sm">
              <Mainbody />
            </Container>
          </React.Fragment>
          <Box sx={{
            height: 320, transform: 'translateZ(0px)', flexGrow: 1,
            // position: 'fixed',
            bottom: '10px',
            right: '10px',
          }}>
            <SpeedDialBtn />
          </Box>
        </Provider>
      </div >
    )
  }
}



export default App;
