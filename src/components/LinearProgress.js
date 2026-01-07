import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import store from './store'
import { getSunabMoney } from './common.js'
function LinearProgressWithLabel(props) {
    return (
        <Box sx={{}}>
            <Box sx={{ width: '100%', height: '10px' }}>
                <LinearProgress variant="determinate" {...props} sx={{ width: '100%', height: '10px' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}

LinearProgressWithLabel.propTypes = {
    value: PropTypes.number.isRequired,
};




export default function LinearWithValueLabel() {
    const [progress, setProgress] = useState(10);
    const [tmoney, setTMoney] = useState(10);
    const [sunabmoney, setSunabMoney] = useState(10);
    const [value, setValue] = useState(0);

    let prevState = store.getState();

    React.useEffect(() => {
        const state = store.getState();
        getsunab(state.chgMonth.value)
        const subscribeCallback = () => {
            const state = store.getState();
            const title = state.contentPop.title
            getsunab(state.chgMonth.value)
            prevState = state;
        };
        store.subscribe(subscribeCallback);
        const timer = setInterval(() => {
            setProgress((prevProgress) => (prevProgress >= 100 ? 10 : prevProgress + 10));
        }, 800);
        return () => {
            store.unsubscribe(subscribeCallback);
            clearInterval(timer);
        };
    }, []);

    async function getsunab(date){
        let data=await getSunabMoney(date)
        let tmoney=numberWithCommas(data[0].tmoney)
        let minab=numberWithCommas(data[0].minab)
        let value=Number(data[0].minab) / Number(data[0].tmoney)
        console.log('value',value*100)
        value=value*100
        setValue(value)
        setTMoney(tmoney)
        setSunabMoney(minab)
    }
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    return (
        <Box sx={{ marginTop: '80px' }}>
            <Grid container>
                <Grid item xs={12}>{sunabmoney} / {tmoney}</Grid>
                <Grid item xs={2}></Grid>
                <Grid item xs={8} >
                    <LinearProgressWithLabel value={Number(value)} sx={{ width: '100%' }} />
                </Grid>
                <Grid item xs={2}></Grid>
            </Grid>
        </Box>

    );
}