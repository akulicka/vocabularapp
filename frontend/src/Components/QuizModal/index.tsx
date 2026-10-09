import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Box, Button, Stack } from '@mui/material'
import QuizQuestion from '@components/QuizModal/QuizQuestion'
import QuizFeedback from '@components/QuizModal/QuizFeedback'
import QuizInput from '@components/QuizModal/QuizInput'
import QuizTimer from '@components/QuizModal/QuizTimer'
import { FeedbackData } from '@components/QuizModal/QuizFeedback'
import { useFinishQuiz, useSubmitAnswer } from '@api/quiz'
import { error } from '@util/notify'
import { QuizTally, StartedQuiz } from '@vocabularapp/shared-types/types'

interface QuizModalProps {
    userId: string
    quiz: StartedQuiz
    onClose: () => void
    onQuizComplete: (tally: QuizTally) => void
}

function QuizModal({ userId, quiz, onClose, onQuizComplete }: QuizModalProps) {
    const [englishById] = useState(() => {
        const english: Record<string, string> = {}
        for (const word of quiz.words) {
            english[word.wordId] = word.english
        }
        return english
    })
    const [queue, setQueue] = useState(() => quiz.words.map((word) => word.wordId))
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
    const [timerActive, setTimerActive] = useState(true)
    const finishedRef = useRef(false)

    const submitAnswerMutation = useSubmitAnswer()
    const finishQuizMutation = useFinishQuiz(userId)
    const quizId = quiz.quizId
    const poolSize = quiz.words.length

    const currentWordId = queue[0]
    const currentQuestion = currentWordId ? { wordId: currentWordId, english: englishById[currentWordId] ?? '' } : null
    const answeredCount = poolSize - queue.length + (showFeedback ? 1 : 0)

    const finish = async () => {
        if (finishedRef.current || !quizId) return
        finishedRef.current = true
        setTimerActive(false)
        try {
            const tally = await finishQuizMutation.mutateAsync(quizId)
            onQuizComplete(tally)
        } catch (err) {
            error('Failed to finish quiz: ' + (err instanceof Error ? err.message : 'Unknown error'))
            onClose()
        }
    }

    useEffect(() => {
        if (queue.length > 0) return
        void finish()
    }, [queue.length])

    const handleAnswerSubmit = async () => {
        if (!currentAnswer.trim() || !currentWordId || !quizId || showFeedback || submitAnswerMutation.isPending) return

        try {
            const graded = await submitAnswerMutation.mutateAsync({
                quizId,
                wordId: currentWordId,
                userAnswer: currentAnswer.trim(),
            })
            setFeedbackData({
                isCorrect: graded.isCorrect,
                userAnswer: graded.userAnswer,
                correctAnswer: graded.root ?? '',
                arabicWithTashkeel: graded.arabic,
            })
            setShowFeedback(true)
        } catch (err) {
            error('Failed to submit answer: ' + (err instanceof Error ? err.message : 'Unknown error'))
        }
    }

    const handleSkipQuestion = () => {
        if (!currentWordId || showFeedback) return
        setCurrentAnswer('')
        setQueue((prev) => {
            if (prev.length <= 1) return prev
            return [...prev.slice(1), prev[0]]
        })
    }

    const handleNextQuestion = () => {
        setShowFeedback(false)
        setFeedbackData(null)
        setCurrentAnswer('')
        setQueue((prev) => prev.slice(1))
    }

    const handleKeyPress = (event: { key: string }) => {
        if (event.key === 'Enter') {
            void handleAnswerSubmit()
        }
    }

    if (!currentQuestion) {
        return null
    }

    return (
        <Dialog
            open
            onClose={() => onClose()}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <DialogTitle>
                <QuizTimer endsAt={quiz.endsAt} isActive={timerActive} answeredCount={answeredCount} totalQuestions={poolSize} onTimeUp={finish} showTimeRemaining={true} showProgress={true} />
            </DialogTitle>

            <DialogContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <QuizQuestion currentQuestion={currentQuestion} />
                    <QuizFeedback showFeedback={showFeedback} feedbackData={feedbackData} onNext={handleNextQuestion} />
                    <QuizInput currentAnswer={currentAnswer} setCurrentAnswer={setCurrentAnswer} onKeyPress={handleKeyPress} disabled={showFeedback} />
                </Box>

                {!showFeedback && (
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                        <Button variant="contained" onClick={() => void handleAnswerSubmit()} disabled={!currentAnswer.trim() || submitAnswerMutation.isPending} size="large">
                            Submit Answer
                        </Button>
                        <Button variant="outlined" onClick={handleSkipQuestion} size="large">
                            Skip
                        </Button>
                        <Button variant="outlined" onClick={() => onClose()} size="large">
                            Exit Quiz
                        </Button>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default QuizModal
