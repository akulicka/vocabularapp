import { useEffect, useRef, useState } from 'react'
import { LinearProgress, Typography, Box } from '@mui/material'

interface QuizTimerProps {
    endsAt: Date | string
    isActive?: boolean
    answeredCount?: number
    totalQuestions?: number
    onTimeUp?: () => void
    showTimeRemaining?: boolean
    showProgress?: boolean
}

function QuizTimer({ endsAt, isActive = false, answeredCount = 0, totalQuestions = 0, onTimeUp, showTimeRemaining = true, showProgress = true }: QuizTimerProps) {
    const endMs = new Date(endsAt).getTime()
    const totalMs = useRef(Math.max(endMs - Date.now(), 1))
    const [remainingMs, setRemainingMs] = useState(() => Math.max(endMs - Date.now(), 0))
    const onTimeUpRef = useRef(onTimeUp)
    onTimeUpRef.current = onTimeUp

    useEffect(() => {
        if (!isActive) return

        const end = new Date(endsAt).getTime()
        totalMs.current = Math.max(end - Date.now(), 1)
        let fired = false

        const tick = () => {
            const left = Math.max(end - Date.now(), 0)
            setRemainingMs(left)
            if (left <= 0 && !fired) {
                fired = true
                onTimeUpRef.current?.()
            }
        }

        tick()
        const id = window.setInterval(tick, 200)
        return () => window.clearInterval(id)
    }, [isActive, endsAt])

    const remaining = Math.ceil(remainingMs / 1000)
    const progress = Math.max((remainingMs / totalMs.current) * 100, 0)

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                Quiz Progress: {answeredCount} / {totalQuestions}
            </Typography>

            {showTimeRemaining && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Time: {remaining}s
                </Typography>
            )}
            {showProgress && (
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'primary.light',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: 'primary.main',
                        },
                    }}
                />
            )}
        </Box>
    )
}

export default QuizTimer
