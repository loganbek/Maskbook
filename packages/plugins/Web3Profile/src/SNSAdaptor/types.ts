import type { BindingProof, NextIDPlatform, ProfileInformation } from '@masknet/shared-base'
import type { Web3ProfileStorage, WalletsCollection, CollectionTypes } from '@masknet/shared'

export interface GeneralAsset {
    platform: string
    identity: string
    id: string // contractAddress-id or admin_address
    type: string
    info: {
        collection?: string
        collection_icon?: string
        image_preview_url?: string | null
        animation_url?: string | null
        animation_original_url?: string | null
        title?: string
        total_contribs?: number
        token_contribs?: Array<{
            token: string
            amount: string
        }>
        start_date?: string
        end_date?: string
        country?: string
        city?: string
    }
}

export interface PersonaKV {
    persona: string
    proofs?: Proof[]
}
export interface Proof {
    platform: NextIDPlatform
    identity: string
    content?: Record<string, Web3ProfileStorage>
}
export interface Collection {
    address: string
    collections?: CollectionTypes[]
}
export enum AssetType {
    GitcoinDonation = 'Gitcoin-Donation',
    POAP = 'POAP',
}
export interface Response {
    status: boolean
    assets: GeneralAsset[]
}

export interface AccountType extends BindingProof {
    walletList: WalletsCollection
    linkedProfile?: ProfileInformation
}

export interface AlchemyResponse_EVM {
    ownedNfts: AlchemyNFT_EVM[]
    pageKey?: string
}

export interface AlchemyNFT_EVM {
    contract: {
        address: string
    }
    id: {
        tokenId: string
        tokenMetadata: {
            tokenType: 'ERC721' | 'ERC1155'
        }
    }
    title: string
    description: string
    tokenUri: {
        raw: string
        gateway: string
    }
    media: [
        {
            raw: string
            gateway: string
        },
    ]
    metadata: {
        name: string
        description: string
        image: string
        image_url: string
        external_url: string
        animation_url: string
        attributes: Array<{
            value: string
            trait_type: string
        }>
    }
    timeLastUpdated: string
}

export interface UnlistedConfig {
    wallets: { [identity in string]: WalletsCollection }
    collections: {
        [identity in string]: {
            [address in string]: {
                /** key list */
                Donations: string[]
                /** key list */
                Footprints: string[]
                /** key list */
                NFTs: string[]
            }
        }
    }
}
