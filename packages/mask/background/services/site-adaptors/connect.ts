import { delay } from '@masknet/kit'
import type { PersonaIdentifier, ProfileIdentifier } from '@masknet/shared-base'
import { openOrActiveTab } from '@masknet/shared-base-ui'
import { currentSetupGuideStatus, userGuideStatus } from '../../../shared/legacy-settings/settings.js'
import { SetupGuideStep } from '../../../shared/legacy-settings/types.js'
import { definedSiteAdaptors } from '../../../shared/site-adaptors/definitions.js'
import { requestSiteAdaptorsPermission } from '../helper/request-permission.js'
import stringify from 'json-stable-stringify'

export async function getSupportedSites(options: { isSocialNetwork?: boolean } = {}): Promise<
    Array<{
        networkIdentifier: string
    }>
> {
    return [...definedSiteAdaptors.values()]
        .filter((x) => (options.isSocialNetwork === undefined ? true : x.isSocialNetwork === options.isSocialNetwork))
        .map((x) => ({ networkIdentifier: x.networkIdentifier }))
}

export async function setupSite(network: string, newTab: boolean) {
    const worker = definedSiteAdaptors.get(network)
    const home = worker?.homepage

    // request permission from all sites supported.
    if (!(await requestSiteAdaptorsPermission([...definedSiteAdaptors.values()]))) return

    userGuideStatus[network].value = '1'
    await delay(100)
    if (!home) return
    if (!newTab) return home

    browser.tabs.create({ active: true, url: home })
    return
}

export async function connectSite(
    identifier: PersonaIdentifier,
    network: string,
    type?: 'local' | 'nextID',
    profile?: ProfileIdentifier,
    openInNewTab = true,
) {
    const worker = definedSiteAdaptors.get(network)
    if (!worker) return

    if (!(await requestSiteAdaptorsPermission([worker]))) return

    // #region reset the global setup status setting
    currentSetupGuideStatus[network].value = stringify({
        status: type === 'nextID' ? SetupGuideStep.VerifyOnNextID : SetupGuideStep.FindUsername,
        persona: identifier.toText(),
        username: profile?.userId,
    })

    await delay(100)
    // #endregion
    if (openInNewTab) {
        await browser.tabs.create({ active: true, url: worker.homepage })
    } else {
        await openOrActiveTab(worker.homepage)
    }
}
