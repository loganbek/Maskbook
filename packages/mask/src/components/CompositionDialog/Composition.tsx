import { useCallback, useEffect, useState, useRef } from 'react'
import { DialogActions, DialogContent } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import { activatedSocialNetworkUI } from '../../social-network/index.js'
import { MaskMessages, useI18N } from '../../utils/index.js'
import { CrossIsolationMessages } from '@masknet/shared-base'
import { useRecipientsList } from './useRecipientsList.js'
import { InjectedDialog } from '@masknet/shared'
import { CompositionDialogUI, CompositionRef, E2EUnavailableReason } from './CompositionUI.js'
import { useCompositionClipboardRequest } from './useCompositionClipboardRequest.js'
import Services from '../../extension/service.js'
import { useSubmit } from './useSubmit.js'
import { useAsync } from 'react-use'
import { useCurrentIdentity } from '../DataSource/useActivatedUI.js'
import { useCurrentPersonaConnectStatus } from '../DataSource/usePersonaConnectStatus.js'
import { Flags } from '../../../shared/index.js'

const useStyles = makeStyles()({
    dialogRoot: {
        minWidth: 400,
        width: 600,
        boxShadow: 'none',
        backgroundImage: 'none',
        maxWidth: 'none',
    },
    hideDialogRoot: {
        visibility: 'hidden',
    },
    dialogContent: {
        padding: 16,
    },
})
export interface PostDialogProps {
    type?: 'popup' | 'timeline'
    requireClipboardPermission?: boolean
}
let openOnInitAnswered = false
export function Composition({ type = 'timeline', requireClipboardPermission }: PostDialogProps) {
    const { t } = useI18N()
    const { classes, cx } = useStyles()
    const currentIdentity = useCurrentIdentity()?.identifier
    const { value: connectStatus } = useCurrentPersonaConnectStatus()
    /** @deprecated */
    const { value: hasLocalKey } = useAsync(
        async () => (currentIdentity ? Services.Identity.hasLocalKey(currentIdentity) : false),
        [currentIdentity, connectStatus],
    )

    const [reason, setReason] = useState<'timeline' | 'popup' | 'reply'>('timeline')
    const [version, setVersion] = useState<-38 | -37>(Flags.v37PayloadDefaultEnabled ? -37 : -38)
    // #region Open
    const [open, setOpen] = useState(false)
    const [isOpenFromApplicationBoard, setIsOpenFromApplicationBoard] = useState(false)

    const onClose = useCallback(() => {
        setOpen(false)

        UI.current?.reset()
    }, [])

    useEffect(() => {
        if (openOnInitAnswered) return
        openOnInitAnswered = true
        Services.SocialNetwork.getDesignatedAutoStartPluginID().then((plugin) => {
            if (!plugin) return
            setOpen(true)
            UI.current?.startPlugin(plugin)
        })
    }, [])

    const { onQueryClipboardPermission, hasClipboardPermission, onRequestClipboardPermission } =
        useCompositionClipboardRequest(requireClipboardPermission || false)

    useEffect(() => {
        return MaskMessages.events.requestExtensionPermission.on(() => onQueryClipboardPermission?.())
    }, [onQueryClipboardPermission])

    useEffect(() => {
        return CrossIsolationMessages.events.compositionDialogEvent.on(({ reason, open, content, options }) => {
            if ((reason !== 'reply' && reason !== type) || (reason === 'reply' && type === 'popup')) return

            setOpen(open)
            setReason(reason)
            setIsOpenFromApplicationBoard(Boolean(options?.isOpenFromApplicationBoard))
            if (content) UI.current?.setMessage(content)
            if (options?.target) UI.current?.setEncryptionKind(options.target)
            if (options?.startupPlugin) UI.current?.startPlugin(options.startupPlugin, options.startupPluginProps)
        })
    }, [type])
    useEffect(() => {
        if (!open) return

        return MaskMessages.events.replaceComposition.on((message) => {
            const ui = UI.current
            if (!ui) return
            UI.current.setMessage(message)
        })
    }, [open])
    // #endregion

    // #region submit
    const onSubmit_ = useSubmit(onClose, reason)
    // #endregion

    const UI = useRef<CompositionRef>(null)
    const networkSupport = activatedSocialNetworkUI.injection.newPostComposition?.supportedOutputTypes
    const recipients = useRecipientsList()
    const isE2E_Disabled = (() => {
        if (!connectStatus.currentPersona && !connectStatus.hasPersona) return E2EUnavailableReason.NoPersona
        if (!connectStatus.connected && connectStatus.hasPersona) return E2EUnavailableReason.NoConnection
        if (!hasLocalKey && version === -38) return E2EUnavailableReason.NoLocalKey
        return
    })()

    return (
        <InjectedDialog
            classes={{ paper: cx(classes.dialogRoot, !open ? classes.hideDialogRoot : '') }}
            keepMounted
            open={open}
            onClose={onClose}
            title={t('post_dialog__title')}>
            <DialogContent classes={{ root: classes.dialogContent }}>
                <CompositionDialogUI
                    version={version}
                    setVersion={setVersion}
                    ref={UI}
                    hasClipboardPermission={hasClipboardPermission}
                    onRequestClipboardPermission={onRequestClipboardPermission}
                    requireClipboardPermission={requireClipboardPermission}
                    recipients={recipients}
                    maxLength={560}
                    onSubmit={onSubmit_}
                    supportImageEncoding={networkSupport?.text ?? false}
                    supportTextEncoding={networkSupport?.image ?? false}
                    e2eEncryptionDisabled={isE2E_Disabled}
                    isOpenFromApplicationBoard={isOpenFromApplicationBoard}
                />
            </DialogContent>
            <DialogActions sx={{ height: 68, padding: '0px !important' }} />
        </InjectedDialog>
    )
}
