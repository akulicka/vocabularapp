import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Box, Button, Stack } from '@mui/material'
import QuizQuestion from '@components/QuizModal/QuizQuestion'
import QuizFeedback from '@components/QuizModal/QuizFeedback'
import QuizInput from '@components/QuizModal/QuizInput'
import QuizTimer from '@components/QuizModal/QuizTimer'
import { FeedbackData } from '@components/QuizModal/QuizFeedback'
import { useFinishQuiz, useStartQuiz, useSubmitAnswer } from '@api/quiz'
import { error } from '@util/notify'
import { QuizTally } from '@vocabularapp/shared-types/types'

interface QuizModalProps {
    open: boolean
    onClose: () => void
    selectedTags: string[]
    onQuizComplete: (tally: QuizTally) => void
}

function QuizModal({ open, onClose, selectedTags, onQuizComplete }: QuizModalProps) {
    const [quizId, setQuizId] = useState<string | null>(null)
    const [endsAt, setEndsAt] = useState<Date | string | null>(null)
    const [englishById, setEnglishById] = useState<Record<string, string>>({})
    const [queue, setQueue] = useState<string[]>([])
    const [poolSize, setPoolSize] = useState(0)
    const [ready, setReady] = useState(false)
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
    const [timerActive, setTimerActive] = useState(false)
    const finishedRef = useRef(false)

    const startQuizMutation = useStartQuiz()
    const submitAnswerMutation = useSubmitAnswer()
    const finishQuizMutation = useFinishQuiz()

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
        if (!open || selectedTags.length === 0) {
            setTimerActive(false)
            setReady(false)
            return
        }

        let ignore = false
        const startQuiz = async () => {
            try {
                const result = await startQuizMutation.mutateAsync(selectedTags)
                if (ignore) return
                const english: Record<string, string> = {}
                for (const word of result.words) {
                    english[word.wordId] = word.english
                }
                finishedRef.current = false
                setQuizId(result.quizId)
                setEndsAt(result.endsAt)
                setEnglishById(english)
                setQueue(result.words.map((word) => word.wordId))
                setPoolSize(result.words.length)
                setReady(true)
                setTimerActive(true)
            } catch (err) {
                if (ignore) return
                error('Failed to start quiz: ' + (err instanceof Error ? err.message : 'Unknown error'))
                onClose()
            }
        }
        startQuiz()

        return () => {
            ignore = true
        }
    }, [open, selectedTags])

    useEffect(() => {
        if (!ready || queue.length > 0) return
        void finish()
    }, [ready, queue.length])

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

    if (!quizId || !endsAt || !currentQuestion) {
        return null
    }

    return (
        <Dialog
            open={open}
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
                <QuizTimer endsAt={endsAt} isActive={timerActive} answeredCount={answeredCount} totalQuestions={poolSize} onTimeUp={finish} showTimeRemaining={true} showProgress={true} />
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
