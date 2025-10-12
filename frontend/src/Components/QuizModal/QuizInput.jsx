import { useState, useEffect, useRef } from 'react'
import { Box, TextField, IconButton } from '@mui/material'
import SimpleKeyboard from 'simple-keyboard'
import arabic from 'simple-keyboard-layouts/build/layouts/arabic'
import 'simple-keyboard/build/css/index.css'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import KeyboardHideIcon from '@mui/icons-material/KeyboardHide'

function QuizInput({ currentAnswer, setCurrentAnswer, onKeyPress, disabled = false }) {
    const [showKeyboard, setShowKeyboard] = useState(true)
    const inputRef = useRef(null)
    const keyboardRef = useRef(null)
    const keyboardInstanceRef = useRef(null)

    // Initialize keyboard
    useEffect(() => {
        if (keyboardRef.current && showKeyboard && !keyboardInstanceRef.current) {
            keyboardInstanceRef.current = new SimpleKeyboard(keyboardRef.current, {
                ...arabic,
                onChange: handleKeyboardChange,
                onKeyPress: handleKeyboardKeyPress,
                theme: 'hg-theme-default',
                physicalKeyboardHighlight: true,
                syncInstanceInputs: true,
            })
        }
    }, [keyboardRef.current, showKeyboard])

    // Cleanup keyboard instance
    useEffect(() => {
        return () => {
            if (keyboardInstanceRef.current && !showKeyboard) {
                keyboardInstanceRef.current.destroy()
                keyboardInstanceRef.current = null
            }
        }
    }, [showKeyboard])

    // Update keyboard input when currentAnswer changes
    useEffect(() => {
        if (keyboardInstanceRef.current) {
            keyboardInstanceRef.current.setInput(currentAnswer)
        }
    }, [currentAnswer])

    const handleKeyboardChange = (input) => {
        setCurrentAnswer(input)
    }

    const handleKeyboardKeyPress = (button) => {
        if (button === '{enter}') {
            onKeyPress({ key: 'Enter' })
        }
    }

    const toggleKeyboard = () => {
        setShowKeyboard(!showKeyboard)
    }

    return (
        <>
            {/* Input Field */}
            <Box sx={{ textAlign: 'center' }}>
                <TextField
                    ref={inputRef}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyPress={onKeyPress}
                    placeholder="Type in Arabic..."
                    variant="outlined"
                    fullWidth
                    disabled={disabled}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            fontSize: '1.2rem',
                            textAlign: 'center',
                            direction: 'rtl', // Right-to-left for Arabic
                            fontFamily: 'Arial, sans-serif', // Better Arabic font support
                        },
                    }}
                    inputProps={{
                        style: {
                            textAlign: 'center',
                            direction: 'rtl',
                            unicodeBidi: 'bidi-override',
                        },
                    }}
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={toggleKeyboard} edge="end" color="primary" title={showKeyboard ? 'Hide virtual keyboard' : 'Show virtual keyboard'} disabled={disabled}>
                                {showKeyboard ? <KeyboardHideIcon /> : <KeyboardIcon />}
                            </IconButton>
                        ),
                    }}
                />
            </Box>

            {/* Virtual Keyboard */}
            <Box
                sx={{
                    mt: 2,
                    mb: 2,
                    display: showKeyboard ? 'block' : 'none',
                }}
                ref={keyboardRef}
            />
        </>
    )
}

export default QuizInput
