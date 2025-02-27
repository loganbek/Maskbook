import { memo } from 'react'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { MaskAvatar } from '../../../../components/MaskAvatar/index.js'
import { Icons } from '@masknet/icons'
import { makeStyles, MaskColorVar } from '@masknet/theme'
import { formatPersonaFingerprint } from '@masknet/shared-base'

const useStyles = makeStyles()((theme) => ({
    iconButton: {
        padding: 0,
        fontSize: 24,
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: `1px solid ${MaskColorVar.blue.alpha(0.1)}`,
        color: MaskColorVar.primary,
    },
}))

interface PersonaStateBarProps {
    nickname?: string
    fingerprint?: string
    drawerOpen: boolean
    toggleDrawer(): void
}

export const PersonaStateBar = memo<PersonaStateBarProps>(({ nickname, toggleDrawer, drawerOpen, fingerprint }) => {
    const { classes } = useStyles()

    return (
        // magic number of z-index: https://next.material-ui.com/customization/z-index/#main-content
        <Box display="flex" alignItems="center" sx={{ zIndex: 1201 }}>
            <MaskAvatar onClick={toggleDrawer} />
            <Stack sx={{ px: 2 }} justifyContent="space-around">
                <Typography variant="body1" lineHeight={1.2}>
                    {nickname}
                </Typography>
                <Typography variant="caption" lineHeight={1.2}>
                    {formatPersonaFingerprint(fingerprint ?? '', 6)}
                </Typography>
            </Stack>
            <IconButton onClick={toggleDrawer} size="small" className={classes.iconButton}>
                {drawerOpen ? <Icons.ArrowUpRound size={28} /> : <Icons.ArrowDownRound size={16} />}
            </IconButton>
        </Box>
    )
})
