import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TagList from '../../Components/TagList'
import { error, success } from '../../Util/notify'
import { Stack } from '@mui/material'
import { useStartQuiz, useSubmitQuiz } from '../../Api/quiz'
import { useTags } from '../../Api/words'
import QuizModal from '../../Components/QuizModal'

function Quiz() {
    const [selectedTags, setSelectedTags] = useState([])
    const [modalOpen, setModalOpen] = useState(false)

    // TanStack Query hooks
    const { data: tags, isLoading: tagsLoading } = useTags()
    const submitQuizMutation = useSubmitQuiz()

    const kickOff = () => {
        if (selectedTags.length === 0) {
            error('Please select at least one tag')
            return
        }

        setModalOpen(true)
    }

    const handleQuizComplete = async (quizAnswers, quizData) => {
        if (!quizData || !quizAnswers || quizAnswers.length === 0) {
            error('No quiz data or answers to submit')
            return
        }

        try {
            const result = await submitQuizMutation.mutateAsync({
                quizId: quizData.quizId,
                answers: quizAnswers,
                timeSpent: 120000, // Timer will handle actual time calculation
            })

            success(`Quiz completed! Score: ${result.correctAnswers}/${result.totalQuestions}`)
            setModalOpen(false)
        } catch (err) {
            error('Failed to submit quiz: ' + err.message)
        }
    }

    const handleModalClose = () => {
        setModalOpen(false)
    }

    return (
        <>
            <Stack spacing={2} alignItems={'center'}>
                <Typography textAlign={'center'} variant={'h1'}>
                    Quiz
                </Typography>

                <TagList selectedTags={selectedTags} setSelectedTags={setSelectedTags} tags={tags} isLoading={tagsLoading} />

                <Button variant="contained" disabled={modalOpen} onClick={kickOff}>
                    Start
                </Button>
            </Stack>

            {/* Quiz Modal */}
            {modalOpen && <QuizModal open={modalOpen} onClose={handleModalClose} selectedTags={selectedTags} onQuizComplete={handleQuizComplete} />}
        </>
    )
}

export default Quiz
