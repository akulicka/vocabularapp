import { useState, useEffect } from 'react'
import { LinearProgress, Typography, Box } from '@mui/material'

interface QuizTimerProps {
    duration?: number // milliseconds
    isActive?: boolean
    answeredCount?: number
    totalQuestions?: number
    onTimeUp?: () => void
    showTimeRemaining?: boolean
    showProgress?: boolean
}

function QuizTimer({
    duration = 120000, // 2 minutes default
    isActive = false, // Parent controls when timer is active
    answeredCount = 0,
    totalQuestions = 0,
    onTimeUp,
    showTimeRemaining = true,
    showProgress = true,
}: QuizTimerProps) {
    const [progress, setProgress] = useState(100)
    const [endTime, setEndTime] = useState(0)
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

    // Derive remaining time from progress
    const remaining = Math.ceil((progress / 100) * (duration / 1000))

    useEffect(() => console.log('endTime', endTime), [endTime])
    useEffect(() => console.log('progress', progress), [progress])
    useEffect(() => console.log('isActive', isActive), [isActive])

    const startTimer = () => {
        console.log('0')
        if (timer) return // Already running

        const now = Date.now()
        const targetEndTime = now + duration
        setEndTime(targetEndTime)
        const newTimer = setInterval(() => {
            const currentTime = Date.now()
            const timeLeft = Math.max(targetEndTime - currentTime, 0)
            const progressPercent = Math.max((timeLeft / duration) * 100, 0)

            setProgress(progressPercent)

            if (timeLeft <= 0) {
                stopTimer()
                onTimeUp?.()
            }
        }, 100)
        setTimer(newTimer)
    }

    const stopTimer = () => {
        if (timer) {
            clearInterval(timer)
            // clearInterval(timerRef.current)
            setTimer(null)
        }
        setProgress(0)
    }

    // Auto-start when isActive becomes true
    useEffect(() => {
        console.log('useEffect triggered - isActive:', isActive)
        if (isActive && !timer) {
            console.log('Starting timer...')
            startTimer()
        } else if (!isActive && timer) {
            console.log('Stopping timer...')
            stopTimer()
        }
    }, [isActive])

    // Cleanup on unmount TEST
    useEffect(() => stopTimer(), [])

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            {/* Quiz Progress */}
            <Typography variant="h6" sx={{ mb: 1 }}>
                Quiz Progress: {answeredCount} / {totalQuestions}
            </Typography>

            {/* Timer Display */}
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
