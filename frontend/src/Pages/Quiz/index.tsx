import { useState } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Stack } from '@mui/material'

import TagList from '@components/TagList'
import { error, success } from '@util/notify'
import { useTags } from '@api/words'
import QuizModal from '@components/QuizModal'
import { type QuizTally } from '@vocabularapp/shared-types/types/quiz'

function Quiz() {
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [modalOpen, setModalOpen] = useState<boolean>(false)

    const { data: tags, isLoading: tagsLoading } = useTags()

    const kickOff = () => {
        if (selectedTags.length === 0) {
            error('Please select at least one tag')
            return
        }

        setModalOpen(true)
    }

    const handleQuizComplete = (tally: QuizTally) => {
        success(`Quiz completed! Score: ${tally.correctAnswers}/${tally.poolSize}`)
        setModalOpen(false)
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

                <TagList selectedTags={selectedTags} setSelectedTags={setSelectedTags} tags={tags} isLoading={tagsLoading} canEdit={false} />

                <Button variant="contained" disabled={modalOpen} onClick={kickOff}>
                    Start
                </Button>
            </Stack>

            {modalOpen && <QuizModal open={modalOpen} onClose={handleModalClose} selectedTags={selectedTags} onQuizComplete={handleQuizComplete} />}
        </>
    )
}

export default Quiz
