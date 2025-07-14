import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MUIDialog from '@mui/material/Dialog'

function Dialog({ onSubmit, title = 'Alert', submitLabel = 'OK', ...props }) {
    return (
        <MUIDialog {...props}>
            <DialogTitle variant="contained" textAlign="center">
                {title}
            </DialogTitle>
            <DialogContent>{props.children}</DialogContent>
            <DialogActions sx={{ justifyContent: 'space-around' }}>
                <Button variant="contained" color="success" onClick={onSubmit}>
                    {submitLabel}
                </Button>
                <Button variant="contained" color="error" onClick={() => props?.onClose()}>
                    Cancel
                </Button>
            </DialogActions>
        </MUIDialog>
    )
}
export default Dialog
