import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import store from './store'
import { getPromise } from './common.js'
import { Provider, useDispatch } from 'react-redux';
import { setCurrentName } from './store';
import storeAsync from './storeAsync';

const apiUrl = process.env.REACT_APP_API_URL;
var i = 0;

export default function ProviderSelect(props) {
    const state = store.getState();
    const renter = state.contentPop.value
    const title = state.contentPop.title
    const [renterlist, setRenterlist] = React.useState([]);
    const [renterName, setRenterName] = React.useState(state.contentPop.value);
    const [disabled, setDisabled] = React.useState(false);

    React.useEffect(() => {
        console.log('provider title : ',title)
        if(title==='임차인추가'||title==='수납하기'){
            setDisabled(true)
        }else{
            setDisabled(false)
        }
        const searchBtn = async () => {
            const data = await getPromise('/api/renters?all=true')
            // console.log('provider',data)
            setRenterlist(data);
        }
        searchBtn();
        // console.log('Provider : state change renter : ', renter)
        setRenterName(renter)
    }, [state]);




    function Pro() {
        const dispatch = useDispatch();
        const handleChange = (event) => {
            // console.log('Provider HandleChange : ', {event:event.target.value,renter:renter,title:title})
            setRenterName(event.target.value)
            dispatch(setCurrentName({value:event.target.value,title:title}))
        };


        return (
            <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">임차인</InputLabel>

                    <Select
                        // value={state.contentPop.value}
                        value={renterName}
                        onChange={handleChange}
                        sx={{ height: '42px' }}
                        disabled={disabled}
                    >
                        <MenuItem value="선택">- 선택 -</MenuItem>
                        {renterlist.map((item, index) => (
                            <MenuItem key={item.name} value={item.name}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        );
    }
    return (
        <Provider store={store}>
            <div>
                <Pro></Pro>
            </div>
        </Provider>

    );
}
