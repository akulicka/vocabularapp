import { Box, Typography, Button } from '@mui/material'

export interface FeedbackData {
    isCorrect: boolean
    userAnswer: string
    correctAnswer: string
    arabicWithTashkeel: string
}

interface QuizFeedbackProps {
    showFeedback: boolean
    feedbackData: FeedbackData | null
    onNext: () => void
}

function QuizFeedback({ showFeedback, feedbackData, onNext }: QuizFeedbackProps) {
    if (!showFeedback || !feedbackData) {
        return null
    }

    return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: feedbackData.isCorrect ? 'success.light' : 'error.light',
                    color: feedbackData.isCorrect ? 'success.contrastText' : 'error.contrastText',
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {feedbackData.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Your answer: {feedbackData.userAnswer}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Root: {feedbackData.correctAnswer}
                </Typography>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    With tashkeel: {feedbackData.arabicWithTashkeel}
                </Typography>
                <Button
                    variant="contained"
                    onClick={onNext}
                    size="large"
                    sx={{
                        backgroundColor: feedbackData.isCorrect ? 'success.main' : 'error.main',
                        '&:hover': {
                            backgroundColor: feedbackData.isCorrect ? 'success.dark' : 'error.dark',
                        },
                    }}
                >
                    Next Question
                </Button>
            </Box>
        </Box>
    )
}

export default QuizFeedback
