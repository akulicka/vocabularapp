import Add from '@mui/icons-material/Add'
import Fab from '@mui/material/Fab'
import Grid from '@mui/material/Grid2'
import map from 'lodash/map'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect, useState } from 'react'

import Dialog from '../../Components/Dialog'
import DropZone from '../../Components/DropZone'
import List from '../../Components/List'
import Request from '../../Api/request'

const test_listData = [
    {name: 'list1', id:'123', items: [{text: 'abc'},{text:'def'},{text: 'zhi'}]},
    {name: 'list2', id:'234', items: [{text: 'abc'},{text:'def'},{text: 'zhi'}]},
    {name: 'list3', id:'456', items: [{text: 'abc'},{text:'def'},{text: 'zhi'}]},
]

function Lists () {
    const [lists, setLists] = useState([{}])
    const [isOpen, setIsOpen] = useState(false)
    const [listName, setListName] = useState("")

    useEffect(() => {
        const getLists = async() => {
            try{
                const userListData = await Request.get('lists')
                setLists(userListData.data)
            }catch(err){
                console.log('err', err.message)
            }
        }
        // getLists()
        setLists(test_listData)
    }, [])


    const createList = async() => {
        try{
            const userListData = await Request.post('lists', {listName})
            const {list} = userListData.data
            setLists([...lists, {name: list.listName, id: list.listId, items: []}])
            console.log(lists)
            setIsOpen(false)
        }
        catch(err){
            console.log(err.message)
        }
    }

    const getBuckets = async() => {
        try{
            const buckets = await Request.get('buckets')
            console.log(buckets)
        }catch(err){
            console.log(err)
        }
    }

    const test = async() => {
        try{
            const test = await Request.post('logout')
            console.log(test)
        }catch(err){
            console.log(err)
        }
    }

    // useEffect(() => {
    //     const getLists = async() => {
    //         try{
    //             const userListData = await Request.get('lists')
    //             setLists(userListData.data)
    //         }catch(err){
    //             console.log('err', err.message)
    //         }
    //     }
    //     getLists()
    // }
    // , [lists])

    return (
        <>
            <Stack spacing={8} flexGrow={1}>
                <Grid container spacing={8} alignContent={'top'}>
                    {map(lists, (listData) => {
                        return (
                            <Grid key={listData.id} flexGrow={1}>
                                <List listData={{name: listData.name, id: listData.id}} listItems={listData.items}/>
                            </Grid>
                        )
                    })}
                </Grid>
                <Stack justifyContent={'center'} direction={'row'} spacing={8}>
                    <Fab justifyContent={'center'} onClick={() => setIsOpen(true)} >
                        <Add/>
                    </Fab>
                    <Fab justifyContent={'left'} onClick={() => test()} >
                        <Add/>
                    </Fab>
                </Stack>
                <DropZone />
            </Stack>
            <Dialog open={isOpen} onSubmit={createList} onClose={() => setIsOpen(false)} > 
                <TextField onChange={(e) => setListName(e?.target?.value)} placeholder="Name" /> 
            </Dialog> 
        </>
    )
}
export default Lists