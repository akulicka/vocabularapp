import MUIDialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button'

function Dialog({onSubmit, ...props}){
    // console.log(props)
    return (
        <MUIDialog {...props}>
            <DialogContent>
                {props.children}
            </DialogContent>
            <DialogActions>
                <Button onClick={onSubmit}>OK</Button>
                <Button onClick={() => props?.onClose()}>Cancel</Button>
            </DialogActions>
        </MUIDialog>
    )
}
export default Dialog