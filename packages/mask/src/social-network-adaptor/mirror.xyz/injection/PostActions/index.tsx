import {
    createInjectHooksRenderer,
    PostInfo,
    PostInfoProvider,
    useActivatedPluginsSNSAdaptor,
    usePostInfoDetails,
} from '@masknet/plugin-infra/content-script'
import { Plugin } from '@masknet/plugin-infra'
import { Flags } from '../../../../../shared/index.js'
import { createReactRootShadowed } from '../../../../utils'
import { noop } from 'lodash-unified'
import { PluginIDContextProvider, useWeb3State } from '@masknet/plugin-infra/web3'
import { NetworkPluginID } from '@masknet/web3-shared-base'

const ActionsRenderer = createInjectHooksRenderer(
    useActivatedPluginsSNSAdaptor.visibility.useNotMinimalMode,
    (plugin) => plugin.TipsRealm?.UI?.Content,
)

export function PostActions() {
    const { Others } = useWeb3State()

    const identifier = usePostInfoDetails.author()
    const nickname = usePostInfoDetails.nickname()
    const coAuthors = usePostInfoDetails.coAuthors()

    if (!identifier) return null
    return (
        <ActionsRenderer
            // In Mirror, then profile identifier is wallet address
            tipsAccounts={[
                {
                    pluginId: NetworkPluginID.PLUGIN_EVM,
                    address: identifier.userId,
                    name: nickname ? `(${nickname}) ${Others?.formatAddress(identifier.userId, 4)}` : identifier.userId,
                },
                ...(coAuthors?.map((x) => ({
                    pluginId: NetworkPluginID.PLUGIN_EVM,
                    address: x.author.userId,
                    name: x.nickname ? `(${x.nickname}) ${Others?.formatAddress(x.author.userId, 4)}` : x.author.userId,
                })) ?? []),
            ]}
            identity={identifier}
            slot={Plugin.SNSAdaptor.TipsSlot.MirrorEntry}
        />
    )
}

function createPostActionsInjector() {
    return function injectPostActions(postInfo: PostInfo, signal: AbortSignal) {
        const jsx = (
            <PluginIDContextProvider value={NetworkPluginID.PLUGIN_EVM}>
                <PostInfoProvider post={postInfo}>
                    <PostActions />
                </PostInfoProvider>
            </PluginIDContextProvider>
        )
        if (postInfo.actionsElement) {
            const root = createReactRootShadowed(postInfo.actionsElement.afterShadow, {
                key: 'post-actions',
                signal,
            })

            const parentNode = postInfo.actionsElement?.realCurrent?.parentNode as HTMLDivElement
            if (parentNode?.lastElementChild) {
                ;(parentNode.lastElementChild as HTMLDivElement).style.flex = '1'
                parentNode.style.flex = '1 1 auto'
            }
            root.render(jsx)
            return root.destroy
        }
        return noop
    }
}

export function injectPostActionsAtMirror(signal: AbortSignal, postInfo: PostInfo) {
    if (!Flags.post_actions_enabled) return
    const injector = createPostActionsInjector()
    return injector(postInfo, signal)
}