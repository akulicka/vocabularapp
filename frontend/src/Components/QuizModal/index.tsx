import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, Box, Button, Stack } from '@mui/material'
// import { forwardRef } from 'react'
// import { Slide } from '@mui/material'
import QuizQuestion from '@components/QuizModal/QuizQuestion'
import QuizFeedback from '@components/QuizModal/QuizFeedback'
import QuizInput from '@components/QuizModal/QuizInput'
import QuizTimer from '@components/QuizModal/QuizTimer'
import { FeedbackData } from '@components/QuizModal/QuizFeedback'
import { useStartQuiz } from '@api/quiz'
import { QuizData, QuizAnswer /*, QuizQuestion as QuizQuestionType */ } from '@shared/types'
// Custom transition for word sliding
// const WordTransition = forwardRef<HTMLDivElement, any>(function Transition(props, ref) {
//     return <Slide direction="left" ref={ref} {...props}>{props.children}</Slide>
// })

interface QuizModalProps {
    open: boolean
    onClose: () => void
    selectedTags: string[]
    onQuizComplete: (answers: QuizAnswer[], quizData: QuizData) => void
}

function QuizModal({ open, onClose, selectedTags, onQuizComplete }: QuizModalProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({}) // wordId -> QuizAnswer
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
    const [timerActive, setTimerActive] = useState(false)
    const [quizData, setQuizData] = useState<QuizData | null>(null)

    // TanStack Query hooks
    const startQuizMutation = useStartQuiz()

    const currentQuestion = quizData?.questions?.[currentQuestionIndex]

    useEffect(() => {
        console.log('answers', answers)
    }, [answers])

    useEffect(() => {
        console.log('quizData', quizData)
    }, [quizData])

    useEffect(() => {
        console.log('currentQuestion', currentQuestion)
    }, [currentQuestion])

    useEffect(() => {
        console.log('currentAnswer', currentAnswer)
    }, [currentAnswer])

    useEffect(() => {
        console.log('showFeedback', showFeedback)
    }, [showFeedback])

    useEffect(() => {
        console.log('feedbackData', feedbackData)
    }, [feedbackData])

    // Start quiz and timer when modal opens
    useEffect(() => {
        if (open && selectedTags && selectedTags.length > 0) {
            // Start the quiz
            const startQuiz = async () => {
                try {
                    const result = await startQuizMutation.mutateAsync(selectedTags)
                    setQuizData(result)
                    setTimerActive(true)
                } catch (err) {
                    console.error('Failed to start quiz:', err)
                    onClose() // Close modal on error
                }
            }
            startQuiz()
        } else {
            setTimerActive(false)
            setQuizData(null)
        }
    }, [open, selectedTags])

    // Simple helper - get answer for current question
    // const getCurrentAnswer = (): QuizAnswer | undefined => answers[currentQuestion?.wordId]

    // Check if quiz is complete
    const isQuizComplete = (): boolean => {
        return quizData?.questions?.every((q) => answers[q.wordId]) ?? false
    }

    // Get next question to show
    const getNextQuestion = (): number | null => {
        // First, find incorrect answers to repeat
        // for (const question of quizData.questions) {
        //     const answer = answers[question.wordId]
        //     if (answer && !answer.isCorrect && !answer.skipped) {
        //         return quizData.questions.findIndex(q => q.wordId === question.wordId)
        //     }
        // }

        // Then, find unanswered questions
        if (quizData?.questions) {
            for (let i = 0; i < quizData.questions.length; i++) {
                if (!answers[quizData.questions[i].wordId]) {
                    return i
                }
            }
        }

        return null // Quiz complete
    }

    const handleAnswerSubmit = () => {
        if (!currentAnswer.trim() || !currentQuestion) return

        const isCorrect = currentAnswer.trim().toLowerCase() === (currentQuestion.root?.toLowerCase() ?? '')

        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.wordId]: {
                wordId: currentQuestion.wordId,
                userAnswer: currentAnswer.trim(),
                isCorrect,
                skipped: false,
            },
        }))

        // Show feedback
        setFeedbackData({
            isCorrect,
            userAnswer: currentAnswer.trim(),
            correctAnswer: currentQuestion.root ?? '',
            arabicWithTashkeel: currentQuestion.arabic,
        })
        setShowFeedback(true)
    }

    const handleSkipQuestion = () => {
        if (!currentQuestion) return

        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.wordId]: {
                wordId: currentQuestion.wordId,
                userAnswer: '',
                isCorrect: false,
                skipped: true,
            },
        }))
        handleNextQuestion()
    }

    const handleNextQuestion = () => {
        setShowFeedback(false)
        setFeedbackData(null)
        setCurrentAnswer('')

        if (isQuizComplete() && quizData) {
            // Convert answers object to array format for backend
            const answersArray = Object.values(answers)

            setTimerActive(false)
            onQuizComplete(answersArray, quizData)
            return
        }

        const nextIndex = getNextQuestion()
        if (nextIndex !== null) {
            setCurrentQuestionIndex(nextIndex)
        }
    }

    const handleKeyPress = (event: { key: string }) => {
        if (event.key === 'Enter') {
            handleAnswerSubmit()
        }
    }

    if (!quizData || !currentQuestion) {
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
                <QuizTimer
                    duration={120000}
                    isActive={timerActive}
                    answeredCount={Object.keys(answers).length}
                    totalQuestions={quizData.totalQuestions}
                    onTimeUp={() => {
                        // Auto-submit when time expires
                        if (quizData) {
                            const answersArray = Object.values(answers)
                            onQuizComplete(answersArray, quizData)
                        }
                    }}
                    showTimeRemaining={true}
                    showProgress={true}
                />
            </DialogTitle>

            <DialogContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Word Display */}
                    <QuizQuestion currentQuestion={currentQuestion} />

                    {/* Feedback Display */}
                    <QuizFeedback showFeedback={showFeedback} feedbackData={feedbackData} onNext={handleNextQuestion} />

                    {/* Input Field */}
                    <QuizInput currentAnswer={currentAnswer} setCurrentAnswer={setCurrentAnswer} onKeyPress={handleKeyPress} disabled={showFeedback} />
                </Box>

                {/* Action Buttons - Only show when not showing feedback */}
                {!showFeedback && (
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                        <Button variant="contained" onClick={handleAnswerSubmit} disabled={!currentAnswer.trim()} size="large">
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
