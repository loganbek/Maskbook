import { ProfileIdentifier, CheckedError, OptionalResult } from '@masknet/base'
import { Ok } from 'ts-results-es'
import { PayloadParseResult, SocialNetworkEnum } from '../payload/index.js'
import { CryptoException, PayloadException } from '../types/index.js'
import { importAES } from '../utils/index.js'

const import_AES_GCM_256 = CheckedError.withErr(importAES, CryptoException.InvalidCryptoKey)

/**
 * @internal
 * In payload version 38, the AES key is encrypted by this key.
 */
const v38PublicSharedJwk: JsonWebKey = {
    alg: 'A256GCM',
    ext: true,
    /* cspell:disable-next-line */
    k: '3Bf8BJ3ZPSMUM2jg2ThODeLuRRD_-_iwQEaeLdcQXpg',
    key_ops: ['encrypt', 'decrypt'],
    kty: 'oct',
}

let v38PublicSharedCryptoKey: CryptoKey

export async function get_v38PublicSharedCryptoKey() {
    if (v38PublicSharedCryptoKey) return Ok(v38PublicSharedCryptoKey)

    const imported = await import_AES_GCM_256(v38PublicSharedJwk)
    if (imported.err) return imported
    v38PublicSharedCryptoKey = imported.val
    return Ok(v38PublicSharedCryptoKey)
}

export function parseAuthor(network: unknown, id: unknown): PayloadParseResult.Payload['author'] {
    if (network === null || network === undefined) return OptionalResult.None
    if (id === '' || id === null || id === undefined) return OptionalResult.None
    if (typeof id !== 'string') return new CheckedError(PayloadException.InvalidPayload, 'Invalid user id').toErr()

    let net = ''
    if (network === SocialNetworkEnum.Facebook) net = 'facebook.com'
    else if (network === SocialNetworkEnum.Twitter) net = 'twitter.com'
    else if (network === SocialNetworkEnum.Instagram) net = 'instagram.com'
    else if (network === SocialNetworkEnum.Minds) net = 'minds.com'
    else if (typeof network === 'string') net = network
    else if (typeof network !== 'number')
        return new CheckedError(PayloadException.InvalidPayload, 'Invalid network').toErr()
    else return new CheckedError(PayloadException.UnknownEnumMember, 'unknown network').toErr()

    if (net.includes('/')) return new CheckedError(PayloadException.InvalidPayload, 'Invalid network').toErr()

    const identifier = ProfileIdentifier.of(net, id)
    if (identifier.some) return OptionalResult.Some(identifier.val)
    return OptionalResult.None
}
