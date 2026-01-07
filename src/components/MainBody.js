import React, { useState, useCallback, } from 'react';
import Dtpicker from './Dtpicker.js'
import LinearProgress from './LinearProgress.js'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import InfoPopup from './infoPopup.js'
import { Provider, useDispatch } from 'react-redux';
import store from './store'
import { setCurrentName } from './store';
import { searchBtn } from './common.js'
const apiUrl = process.env.REACT_APP_API_URL;
const rowsInit = [];


function MainTable(props) {
    const [Rows, setRows] = useState(rowsInit);
    const [Search, setSearch] = useState();
    const [checkedtop, setCheckedtop] = useState(false);
    let prevState = store.getState();


    React.useEffect(() => {
        const state = store.getState();
        const title = state.contentPop.title
        // console.log(state)
        if(title==='init'){
            searchRenter();
        }
        const subscribeCallback = () => {
            const state = store.getState();
            const title = state.contentPop.title
            // if (state.chgMonth !== prevState.chgMonth) {
             console.log('MainBody : state change')
            searchRenter();
            // }
            prevState = state;
        };
        store.subscribe(subscribeCallback);
        return () => {
            store.unsubscribe(subscribeCallback);
        };
    }, []);



    async function searchRenter(){
        let data= await searchBtn(Search)
        let checkArr=[]
        console.log('searchRenter',data)
        setRows(data)
        data.forEach((e, index) => { 
           if(e.finish==='Y'){
            checkArr.push(true)
           }else{
            checkArr.push(false)
           }
         });
         setCheckedtop(checkArr)
    }
 

    function BasicTable() {
        const dispatch = useDispatch();
        const SwitchComponent = (event) => {
            // console.log('Switch',event.index)
            const [checked, setChecked] = useState(checkedtop);
            const handleChange = useCallback((e) => {
                const isChecked = e.target.checked;
                const renter = e.target.name
                setChecked(isChecked);
                dispatch(setCurrentName({value:renter,title:'수납하기'}))
            }, []);

            return (
                <FormControlLabel
                    control={<Switch checked={checked[event.index]} onChange={handleChange} name={event.name} key={event.name} />}
                    label=""
                />
            );
        };
        const TableRowClick = (e) => {
            const renter = e.target.innerHTML
            // console.log('tablerowClick : ',renter)
            dispatch(setCurrentName(''))
            dispatch(setCurrentName({value:renter,title:'계약정보'}))
            // setPopContent(<InfoPopup/>);
            // setDialogOpen(true);
        }

        return (
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: '100%' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>상호(업체명)</TableCell>
                            <TableCell align="right">납부현황</TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Rows.map((row,index) => (
                            <TableRow
                                key={row.name}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row"
                                    name={row.name}
                                    onClick={TableRowClick}
                                >
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">
                                    <SwitchComponent name={row.name} index={index}/>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
  

    return (
        <Provider store={store}>
            <>  
                <div>
                    <React.Fragment>
                        <Box>
                            <Dtpicker />
                            <LinearProgress />
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <Grid container sx={{ width: '100%', backgroundColor: 'blud' }}>
                                <Grid item xs={12} >
                                    <ButtonGroup variant="contained" aria-label="outlined primary button group"
                                        sx={{ width: '100%', bgcolor: '#fff', borderRadius: 0 }}>
                                        <TextField id="outlined-search"
                                            sx={{ width: '100%', marginTop: '10px', marginLeft: '10px' }}
                                            label="Search" type="search"
                                            onChange={e => {
                                                setSearch(e.target.value)
                                            }}
                                            value={Search}
                                        />
                                        <Button variant="contained"
                                            style={{ margin: '8px' }}
                                            sx={{ width: '20%', padding: '5px' }}
                                            onClick={searchRenter}
                                        >검색</Button>
                                    </ButtonGroup>
                                </Grid>
                                <Grid item xs={12} >
                                    <BasicTable />
                                </Grid>
                            </Grid>
                        </Box>
                    </React.Fragment>
                </div>
            </>
        </Provider>
    )
}

export default MainTable;