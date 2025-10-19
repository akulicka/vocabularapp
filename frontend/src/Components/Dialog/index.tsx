import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MUIDialog, { DialogProps as MUIDialogProps } from '@mui/material/Dialog'

interface DialogProps extends MUIDialogProps {
    onSubmit: () => void
    title?: string
    submitLabel?: string
    onClose?: () => void // TODO - remove when refactor complete - replace call signatures everywhere in app
    [key: string]: any // For spreading additional props to MUIDialog
}

function Dialog({ onSubmit, title = 'Alert', submitLabel = 'OK', onClose, ...props }: DialogProps) {
    return (
        <MUIDialog {...props}>
            <DialogTitle variant="h6" textAlign="center">
                {title}
            </DialogTitle>
            <DialogContent>{props.children}</DialogContent>
            <DialogActions sx={{ justifyContent: 'space-around' }}>
                <Button variant="contained" color="success" onClick={onSubmit}>
                    {submitLabel}
                </Button>
                <Button variant="contained" color="error" onClick={() => onClose()}>
                    Cancel
                </Button>
            </DialogActions>
        </MUIDialog>
    )
}
export default Dialog
