import { Box, Typography } from '@mui/material'
import { QuizQuestion as QuizQuestionType } from '@shared/types'

interface QuizQuestionProps {
    currentQuestion: QuizQuestionType
}

function QuizQuestion({ currentQuestion }: QuizQuestionProps) {
    return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
                variant="h3"
                component="div"
                sx={{
                    fontWeight: 'bold',
                    color: 'primary.main',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {currentQuestion.english}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Type the Arabic root translation
            </Typography>
        </Box>
    )
}

export default QuizQuestion
