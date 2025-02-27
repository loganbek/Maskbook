import { appearanceSettings, pluginIDSettings, languageSettings, currentPersonaIdentifier } from './settings.js'
import type { MaskSettingsEvents, ValueRefWithReady } from '@masknet/shared-base'

type ToBeListedSettings = {
    [key in keyof MaskSettingsEvents]: ValueRefWithReady<MaskSettingsEvents[key]>
}
export function ToBeListened(): ToBeListedSettings {
    return {
        appearanceSettings,
        pluginIDSettings,
        languageSettings,
        currentPersonaIdentifier,
    }
}
