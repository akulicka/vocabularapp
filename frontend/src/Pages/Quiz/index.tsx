import { useState } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Stack } from '@mui/material'

import TagList from '@components/TagList'
import { error, success } from '@util/notify'
import { useStartQuiz } from '@api/quiz'
import { useTags } from '@api/words'
import QuizModal from '@components/QuizModal'
import { type QuizTally, type StartedQuiz } from '@vocabularapp/shared-types/types/quiz'

function Quiz() {
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [quiz, setQuiz] = useState<StartedQuiz | null>(null)

    const { data: tags, isLoading: tagsLoading } = useTags()
    const startQuizMutation = useStartQuiz()

    const kickOff = async () => {
        if (selectedTags.length === 0) {
            error('Please select at least one tag')
            return
        }

        try {
            const started = await startQuizMutation.mutateAsync(selectedTags)
            setQuiz(started)
        } catch (err) {
            error('Failed to start quiz: ' + (err instanceof Error ? err.message : 'Unknown error'))
        }
    }

    const handleQuizComplete = (tally: QuizTally) => {
        success(`Quiz completed! Score: ${tally.correctAnswers}/${tally.poolSize}`)
        setQuiz(null)
    }

    const handleModalClose = () => {
        setQuiz(null)
    }

    return (
        <>
            <Stack spacing={2} alignItems={'center'}>
                <Typography textAlign={'center'} variant={'h1'}>
                    Quiz
                </Typography>

                <TagList selectedTags={selectedTags} setSelectedTags={setSelectedTags} tags={tags} isLoading={tagsLoading} canEdit={false} />

                <Button variant="contained" disabled={!!quiz || startQuizMutation.isPending} onClick={() => void kickOff()}>
                    Start
                </Button>
            </Stack>

            {quiz && <QuizModal quiz={quiz} onClose={handleModalClose} onQuizComplete={handleQuizComplete} />}
        </>
    )
}

export default Quiz
