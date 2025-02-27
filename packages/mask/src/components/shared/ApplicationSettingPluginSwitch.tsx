import { memo, useEffect, useMemo, useRef } from 'react'
import { Icons } from '@masknet/icons'
import { PluginI18NFieldRender, useActivatedPluginsSNSAdaptor } from '@masknet/plugin-infra/content-script'
import { CrossIsolationMessages, PluginID } from '@masknet/shared-base'
import { openWindow } from '@masknet/shared-base-ui'
import { makeStyles, MaskColorVar } from '@masknet/theme'
import { Avatar, Box, List, ListItem, ListItemAvatar, Stack, Switch, Typography } from '@mui/material'
import { Services } from '../../extension/service.js'

const useStyles = makeStyles()((theme) => ({
    listItem: {
        padding: theme.spacing(1.5),
        borderRadius: 12,
        boxShadow:
            theme.palette.mode === 'dark'
                ? '0px 0px 20px rgba(255, 255, 255, 0.12)'
                : '0px 0px 20px rgba(0, 0, 0, 0.05)',
        '&:hover': {
            boxShadow:
                theme.palette.mode === 'dark'
                    ? '0px 0px 20px rgba(255, 255, 255, 0.06)'
                    : '0px 0px 20px rgba(0, 0, 0, 0.1)',
        },
        '&:hover .MuiAvatar-root': {
            background: theme.palette.background.paper,
        },
        '&:not(:last-child)': {
            marginBottom: theme.spacing(1.5),
        },
    },
    listContent: {
        display: 'flex',
        flexDirection: 'row',
        flexGrow: 1,
        alignItems: 'center',
    },
    headerWrapper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    settings: {
        alignSelf: 'flex-start',
        paddingTop: theme.spacing(0.5),
        marginLeft: theme.spacing(0.5),
        cursor: 'pointer',
        color: MaskColorVar.textSecondary,
        opacity: theme.palette.mode === 'dark' ? 0.5 : 1,
    },
    avatar: {
        background: theme.palette.background.default,
        width: '44px',
        height: '44px',
        '> *': {
            width: 26,
            height: 26,
        },
    },
    placeholder: {
        minWidth: 56,
    },
    info: {
        maxWidth: 420,
    },
    name: {
        fontSize: 14,
        fontWeight: 700,
    },
    desc: {
        fontSize: 12,
        fontWeight: 400,
        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.primary,
    },
}))

interface Props {
    focusPluginID?: PluginID
}

export const ApplicationSettingPluginSwitch = memo(({ focusPluginID }: Props) => {
    const { classes } = useStyles()
    const snsAdaptorPlugins = useActivatedPluginsSNSAdaptor('any')
    const snsAdaptorMinimalPlugins = useActivatedPluginsSNSAdaptor(true)
    const availablePlugins = useMemo(() => {
        return snsAdaptorPlugins
            .flatMap(({ ID, ApplicationEntries: entries }) => (entries ?? []).map((entry) => ({ entry, pluginID: ID })))
            .filter((x) => x.entry.category === 'dapp')
            .sort((a, b) => (a.entry.marketListSortingPriority ?? 0) - (b.entry.marketListSortingPriority ?? 0))
    }, [snsAdaptorPlugins])

    const targetPluginRef = useRef<HTMLLIElement | null>()
    const noAvailablePlugins = availablePlugins.length === 0

    useEffect(() => {
        if (!focusPluginID || noAvailablePlugins || !targetPluginRef.current) return
        targetPluginRef.current.scrollIntoView()
    }, [focusPluginID, noAvailablePlugins])

    async function onSwitch(id: string, checked: boolean) {
        if (id === PluginID.GoPlusSecurity && checked === false)
            return CrossIsolationMessages.events.checkSecurityConfirmationDialogEvent.sendToAll({ open: true })
        await Services.Settings.setPluginMinimalModeEnabled(id, !checked)
    }

    return (
        <List>
            {availablePlugins.map((x) => (
                <ListItem
                    key={x.entry.ApplicationEntryID}
                    ref={(ele) => {
                        if (x.pluginID === focusPluginID) {
                            targetPluginRef.current = ele
                        }
                    }}
                    className={classes.listItem}>
                    <Stack width="100%">
                        <Stack direction="row" width="100%">
                            <section className={classes.listContent}>
                                <ListItemAvatar>
                                    <Avatar className={classes.avatar}>{x.entry.icon}</Avatar>
                                </ListItemAvatar>
                                <Stack className={classes.info} flex={1}>
                                    <div className={classes.headerWrapper}>
                                        <Typography className={classes.name}>
                                            <PluginI18NFieldRender field={x.entry.name} pluginID={x.pluginID} />
                                        </Typography>
                                        {x.entry.tutorialLink ? (
                                            <Box className={classes.settings}>
                                                <Icons.Tutorial
                                                    size={22}
                                                    onClick={() => openWindow(x.entry.tutorialLink)}
                                                />
                                            </Box>
                                        ) : null}
                                    </div>
                                    <Typography className={classes.desc}>
                                        <PluginI18NFieldRender field={x.entry.description} pluginID={x.pluginID} />
                                    </Typography>
                                </Stack>
                            </section>
                            <Stack justifyContent="center">
                                <Switch
                                    checked={!snsAdaptorMinimalPlugins.map((x) => x.ID).includes(x.pluginID)}
                                    onChange={(event) => onSwitch(x.pluginID, event.target.checked)}
                                />
                            </Stack>
                        </Stack>
                        {x.entry.features?.length && (
                            <Stack direction="row" mt={1.25}>
                                <Box className={classes.placeholder} />
                                <Stack spacing={1.25}>
                                    {x.entry.features?.map((f, i) => (
                                        <Stack key={i}>
                                            <Typography className={classes.name} fontSize={14}>
                                                <PluginI18NFieldRender field={f.name} pluginID={x.pluginID} />
                                            </Typography>
                                            <Typography className={classes.desc}>
                                                <PluginI18NFieldRender field={f.description} pluginID={x.pluginID} />
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </ListItem>
            ))}
        </List>
    )
})
