import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Buffer } from 'buffer'
import AccountCircle from '@mui/icons-material/AccountCircle'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useDashboard } from '@api/quiz'
import request from '@api/request'
import { error } from '@util/notify'
import type { Dashboard as DashboardData } from '@vocabularapp/shared-types/types'

type RateColor = 'error' | 'warning' | 'success'

function rate(correct: number, total: number): number {
    if (total <= 0) return 0
    return correct / total
}

function percentLabel(correct: number, total: number): string {
    return `${Math.round(rate(correct, total) * 100)}%`
}

// Under 40% error, 40–70% warning, above 70% success. No color when there is no denominator.
function rateColor(correct: number, total: number): RateColor | undefined {
    if (total <= 0) return undefined
    const value = rate(correct, total)
    if (value < 0.4) return 'error'
    if (value <= 0.7) return 'warning'
    return 'success'
}

function joinedMonth(createdAt: string): string {
    return new Date(createdAt).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

function quizTime(completedAt: string): string {
    return new Date(completedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function ImgPreview({ pic }: { pic: Blob }) {
    const url = URL.createObjectURL(pic)
    return <Avatar alt="profile" src={url} sx={{ width: 56, height: 56 }} onLoad={() => URL.revokeObjectURL(url)} />
}

function ProfileAvatar() {
    const [pic, setPic] = useState<Blob | undefined>()

    useEffect(() => {
        const getPic = async () => {
            try {
                const response = await request.get('user/img', { timeout: 5000 })
                if (response?.data?.img_buffer) {
                    const buffer = Buffer.from(response.data.img_buffer)
                    setPic(new Blob([buffer]))
                }
            } catch (err) {
                error(`Error retrieving profile pic: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
        }
        void getPic()
    }, [])

    if (pic) return <ImgPreview pic={pic} />
    return <AccountCircle sx={{ fontSize: 56 }} color="action" />
}

function SummaryStat({ label, value, color }: { label: string; value: string; color?: RateColor }) {
    return (
        <Box>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="h6" color={color ? `${color}.main` : 'text.primary'}>
                {value}
            </Typography>
        </Box>
    )
}

function ProfileHeader({ user, summary }: { user: DashboardData['user']; summary: DashboardData['summary'] }) {
    return (
        <Card sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Stack direction="row" spacing={2} alignItems="center">
                    <ProfileAvatar />
                    <Box>
                        <Typography variant="h5">{user.username}</Typography>
                        <Typography color="text.secondary">Learning Arabic</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Joined {joinedMonth(user.createdAt)}
                        </Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={4}>
                    <SummaryStat label="Quizzes" value={String(summary.quizCount)} />
                    <SummaryStat label="Accuracy" value={percentLabel(summary.correct, summary.attempts)} color={rateColor(summary.correct, summary.attempts)} />
                    <SummaryStat label="Words studied" value={String(summary.wordsStudied)} />
                </Stack>
            </Stack>
        </Card>
    )
}

function RateBar({ label, detail, correct, total, dir }: { label: string; detail?: string; correct: number; total: number; dir?: 'rtl' }) {
    const color = rateColor(correct, total)

    return (
        <Stack spacing={0.5} sx={{ py: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography dir={dir}>{label}</Typography>
                    {detail && (
                        <Typography variant="body2" color="text.secondary">
                            {detail}
                        </Typography>
                    )}
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                    {percentLabel(correct, total)} {correct}/{total}
                </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={rate(correct, total) * 100} color={color ?? 'primary'} />
        </Stack>
    )
}

function ColumnFrame({ title, children, controls }: { title: string; children: ReactNode; controls?: ReactNode }) {
    return (
        <Card sx={{ flex: 1, minWidth: 0, p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">{title}</Typography>
            {controls}
            <Box sx={{ maxHeight: 420, overflow: 'auto' }}>{children}</Box>
        </Card>
    )
}

function RateControls({ strongestFirst, onToggleSort, minAttempts, onMinAttempts }: { strongestFirst: boolean; onToggleSort: () => void; minAttempts: boolean; onMinAttempts: (value: boolean) => void }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Button size="small" onClick={onToggleSort}>
                {strongestFirst ? 'Strongest first' : 'Weakest first'}
            </Button>
            <FormControlLabel control={<Checkbox size="small" checked={minAttempts} onChange={(event) => onMinAttempts(event.target.checked)} />} label="At least 5 attempts" />
        </Stack>
    )
}

function useRateOrder<T extends { correct: number; attempts: number }>(rows: T[]) {
    const [strongestFirst, setStrongestFirst] = useState(false)
    const [minAttempts, setMinAttempts] = useState(false)

    const visible = useMemo(() => {
        const filtered = minAttempts ? rows.filter((row) => row.attempts >= 5) : rows
        return [...filtered].sort((a, b) => {
            const diff = rate(a.correct, a.attempts) - rate(b.correct, b.attempts)
            return strongestFirst ? -diff : diff
        })
    }, [rows, strongestFirst, minAttempts])

    return {
        visible,
        strongestFirst,
        toggleSort: () => setStrongestFirst((value) => !value),
        minAttempts,
        setMinAttempts,
    }
}

function QuizColumn({ quizzes }: { quizzes: DashboardData['quizzes'] }) {
    const sorted = useMemo(() => [...quizzes].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()), [quizzes])

    return (
        <ColumnFrame title="Recent quizzes">
            {sorted.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No finished quizzes yet.
                </Typography>
            ) : (
                sorted.map((quiz) => <RateBar key={quiz.quizId} label={quizTime(quiz.completedAt)} correct={quiz.correctAnswers} total={quiz.poolSize} />)
            )}
        </ColumnFrame>
    )
}

function WordColumn({ words }: { words: DashboardData['words'] }) {
    const { visible, strongestFirst, toggleSort, minAttempts, setMinAttempts } = useRateOrder(words)

    return (
        <ColumnFrame title="Words" controls={<RateControls strongestFirst={strongestFirst} onToggleSort={toggleSort} minAttempts={minAttempts} onMinAttempts={setMinAttempts} />}>
            {visible.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No words to show.
                </Typography>
            ) : (
                visible.map((word) => <RateBar key={word.wordId} label={word.arabic} detail={word.english} correct={word.correct} total={word.attempts} dir="rtl" />)
            )}
        </ColumnFrame>
    )
}

function TagColumn({ tags }: { tags: DashboardData['tags'] }) {
    const { visible, strongestFirst, toggleSort, minAttempts, setMinAttempts } = useRateOrder(tags)

    return (
        <ColumnFrame title="Tags" controls={<RateControls strongestFirst={strongestFirst} onToggleSort={toggleSort} minAttempts={minAttempts} onMinAttempts={setMinAttempts} />}>
            {visible.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No tags to show.
                </Typography>
            ) : (
                visible.map((tag) => <RateBar key={tag.tagId} label={tag.tagName} correct={tag.correct} total={tag.attempts} />)
            )}
        </ColumnFrame>
    )
}

function Dashboard({ userId }: { userId: string }) {
    const { data, isLoading, isError } = useDashboard(userId)

    if (isLoading) {
        return <Typography>Loading dashboard...</Typography>
    }

    if (isError || !data) {
        return <Typography>Could not load the dashboard.</Typography>
    }

    return (
        <Stack spacing={2}>
            <ProfileHeader user={data.user} summary={data.summary} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
                <QuizColumn quizzes={data.quizzes} />
                <WordColumn words={data.words} />
                <TagColumn tags={data.tags} />
            </Stack>
        </Stack>
    )
}

export default Dashboard
