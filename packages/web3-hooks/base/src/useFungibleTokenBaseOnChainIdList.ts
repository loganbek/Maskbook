import { useAsyncRetry } from 'react-use'
import { flatten } from 'lodash-es'
import type { NetworkPluginID } from '@masknet/shared-base'
import type { Web3Helper } from '@masknet/web3-helpers'
import { useWeb3Connection, useWeb3State, useChainId } from '@masknet/web3-hooks-base'
import { attemptUntil } from '@masknet/web3-shared-base'

export function useFungibleTokenBaseOnChainIdList<
    S extends 'all' | void = void,
    T extends NetworkPluginID = NetworkPluginID,
>(
    pluginID?: T,
    address?: string,
    chainIdList?: Web3Helper.ChainIdAll[],
    fallbackToken?: Web3Helper.FungibleTokenScope<S, T>,
    options?: Web3Helper.Web3HubOptionsScope<S, T>,
) {
    const connection = useWeb3Connection(pluginID, options)
    const { Token, Others } = useWeb3State(pluginID)
    const currentChainId = useChainId(pluginID, options?.chainId)

    return useAsyncRetry<Web3Helper.FungibleTokenScope<S, T> | undefined>(async () => {
        if (!connection || !chainIdList || !Others?.isValidAddress(address)) return
        return attemptUntil(
            flatten(
                chainIdList?.map((chainId) => [
                    async () => {
                        const token = await connection?.getFungibleToken?.(address ?? '', { ...options, chainId })

                        return !token?.name ||
                            token?.name.toUpperCase() === 'UNKNOWN' ||
                            token?.symbol.toUpperCase() === 'UNKNOWN'
                            ? undefined
                            : token
                    },
                    async () => {
                        const token = await Token?.createFungibleToken?.(chainId, address ?? '')

                        return !token?.name ||
                            token?.name.toUpperCase() === 'UNKNOWN' ||
                            token?.symbol.toUpperCase() === 'UNKNOWN'
                            ? undefined
                            : token
                    },
                ]),
            ),
            fallbackToken,
        )
    }, [address, connection, currentChainId, JSON.stringify(chainIdList), JSON.stringify(options)])
}
