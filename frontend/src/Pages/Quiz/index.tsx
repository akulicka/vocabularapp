import { useState } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Stack } from '@mui/material'

import TagList from '@components/TagList'
import { error, success } from '@util/notify'
import { useSubmitQuiz } from '@api/quiz'
import { useTags } from '@api/words'
import QuizModal from '@components/QuizModal'
import { type QuizData, type QuizAnswer } from '@shared/types/quiz'

function Quiz() {
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [modalOpen, setModalOpen] = useState<boolean>(false)

    const { data: tags, isLoading: tagsLoading } = useTags()
    const submitQuizMutation = useSubmitQuiz()

    const kickOff = () => {
        if (selectedTags.length === 0) {
            error('Please select at least one tag')
            return
        }

        setModalOpen(true)
    }

    const handleQuizComplete = async (quizAnswers: QuizAnswer[], quizData: QuizData) => {
        if (!quizData || !quizAnswers || quizAnswers.length === 0) {
            error('No quiz data or answers to submit')
            return
        }
        // TODO - test - zod undefined instead of array
        try {
            const result = await submitQuizMutation.mutateAsync({
                quizId: quizData.quizId,
                answers: quizAnswers,
                timeSpent: 120000,
            })

            success(`Quiz completed! Score: ${result.correctAnswers}/${result.totalQuestions}`)
            setModalOpen(false)
        } catch (err) {
            error('Failed to submit quiz: ' + (err instanceof Error ? err.message : 'Unknown error'))
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
