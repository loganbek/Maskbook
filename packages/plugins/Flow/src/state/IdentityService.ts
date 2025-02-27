import { compact } from 'lodash-es'
import type { Plugin } from '@masknet/plugin-infra'
import { NetworkPluginID } from '@masknet/shared-base'
import { IdentityServiceState } from '@masknet/web3-state'
import { SocialIdentity, SocialAddress, SocialAddressType } from '@masknet/web3-shared-base'
import { ChainId, isValidAddress } from '@masknet/web3-shared-flow'

function getFlowAddress(bio: string) {
    const addressMatched = bio.match(/\b0x\w{16}\b/) ?? null
    const address = addressMatched?.[0]
    if (address && isValidAddress(address)) return address
    return
}

export class IdentityService extends IdentityServiceState<ChainId> {
    constructor(protected context: Plugin.Shared.SharedContext) {
        super()
    }

    protected override async getFromRemote({ bio = '' }: SocialIdentity) {
        const address = getFlowAddress(bio)

        return compact<SocialAddress<ChainId>>([
            address
                ? {
                      pluginID: NetworkPluginID.PLUGIN_FLOW,
                      type: SocialAddressType.Address,
                      label: address,
                      address,
                  }
                : null,
        ])
    }
}
