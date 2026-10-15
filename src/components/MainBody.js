import React, { useState, useCallback, useRef, } from 'react';
import LinearProgress from './LinearProgress.js'
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
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
console.log('Main Body apiUrl',apiUrl)
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PUBLIC_URL:", process.env.PUBLIC_URL);
console.log("LOCATION:", window.location.href);
console.log("API_URL:", process.env.REACT_APP_API_URL);



function MainTable(props) {
    const [Rows, setRows] = useState(rowsInit);
    const [Search, setSearch] = useState('');
    const [checkedtop, setCheckedtop] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const searchRef = useRef('');
    const requestId = useRef(0);

    const searchRenter = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        setError('');
        try {
            const data = await searchBtn(searchRef.current);
            if (id !== requestId.current) return;
            const rows = Array.isArray(data) ? data : [];
            setRows(rows);
            setCheckedtop(rows.map(row => row.finish === 'Y'));
        } catch (err) {
            if (id === requestId.current) setError(err.message || '청구내역을 불러오지 못했습니다. 다시 조회해 주세요.');
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        // A tab remount must load regardless of the last opened popup title.
        searchRenter();
        const unsubscribe = store.subscribe(searchRenter);
        return () => {
            unsubscribe();
            requestId.current += 1;
        };
    }, [searchRenter]);

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
                                                setSearch(e.target.value); searchRef.current = e.target.value;
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
                                    {error && <Alert severity="error" action={<Button onClick={searchRenter}>다시 조회</Button>}>{error}</Alert>}
                                    {loading && <Alert severity="info">청구내역을 불러오는 중입니다.</Alert>}
                                    {!loading && !error && Rows.length === 0 && <Alert severity="info">조회 조건에 맞는 청구내역이 없습니다.</Alert>}
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
