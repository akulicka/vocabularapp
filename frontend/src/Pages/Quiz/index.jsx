import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TagList from "../../Components/TagList";
import LinearProgress from "@mui/material/LinearProgress";
import { error } from "../../Util/notify";
import Request from '../../Api/request';
import { Stack } from "@mui/material";

function Quiz () {
    const [selectedTags, setSelectedTags] = useState([])
    const [progress, setProgress] = useState(100);
    const [endTime, setEndTime] = useState(0);
    const [remaining, setRemaining] = useState(0)
    const [done, setDone] = useState(false);
    const [preCountDown, setPreCountDown] = useState(0)
    const timeout = 6000
    let timer
    let cdTimer

    const stopTimer = () => {
        timer && clearInterval(timer);
        setDone(true)
        setRemaining(+(0).toFixed(2))
    }

    useEffect(() => {
        const startTimer = () => {
            timer = setInterval(() => {
                setProgress((oldProgress) => {
                    if (oldProgress === 0) {
                        stopTimer()
                        return 0
                    }
                    setRemaining( +Math.max(((endTime - Date.now()) / 1000).toFixed(2), 0))
                    return Math.max(((endTime - Date.now()) / timeout) * 100,0);
                });
            }, 10)
        }
        if(endTime && preCountDown === 0) {
            startTimer()
        }
    }, [endTime, preCountDown])

    const kickOff = () => {
        setProgress(100)
        setPreCountDown(3)
        setDone(false)
        cdTimer = setInterval(() => {
            console.log('preCountDown', preCountDown)
            setPreCountDown((oldPreCountDown) => {
                if(oldPreCountDown === 1) {
                    setEndTime(Date.now() + timeout)
                    clearInterval(cdTimer)
                    return 0
                }
                return oldPreCountDown - 1
            })
        }, 1000)
    }

    // useEffect(() => {
    //     console.log('CLEARING?', preCountDown, cdTimer ? 'y': 'n')
    //     if(preCountDown === 0 && cdTimer) {
    //         console.log('CLEARING')
    //         clearInterval(cdTimer)
    //     }
    // } ,[preCountDown, cdTimer])

    const uiString = useMemo(() => {
        if(done) return 'DONE' 
        if (endTime && preCountDown === 0) return remaining
        if (preCountDown != 0) return preCountDown
        return 'READY'
    }, [done, preCountDown, endTime, remaining])

    return(
        <>
            <Typography textAlign={'center'} variant={"h1"}>Quiz</Typography>
            <Typography textAlign={'center'} variant={"h6"}>{uiString}</Typography>
            <Stack direction={"row"} spacing={2} alignItems={'center'}>
                <Button variant='contained' disabled={(!done && endTime) || preCountDown != 0 } onClick={kickOff}> Start </Button>
                <LinearProgress sx={{flexGrow:1}} variant='determinate' value={progress} />
            </Stack>
            <TagList selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
        </>
    )
}

export default Quiz


// import * as React from 'react';
// import Box from '@mui/material/Box';
// import LinearProgress from '@mui/material/LinearProgress';

// export default function LinearDeterminate() {
//   const [progress, setProgress] = React.useState(0);

//   React.useEffect(() => {
//     const timer = setInterval(() => {
//       setProgress((oldProgress) => {
//         if (oldProgress === 100) {
//           return 0;
//         }
//         const diff = Math.random() * 10;
//         return Math.min(oldProgress + diff, 100);
//       });
//     }, 500);

//     return () => {
//       clearInterval(timer);
//     };
//   }, []);

//   return (
//     <Box sx={{ width: '100%' }}>
//       <LinearProgress variant="determinate" value={progress} />
//     </Box>
//   );
// }