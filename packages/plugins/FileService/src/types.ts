export enum Provider {
    Arweave = 'arweave',
    IPFS = 'ipfs',
}

export interface ProviderConfig {
    name: string
    provider: Provider
}

export interface LandingPageMetadata {
    key: string | null | undefined
    name: string
    size: number
    type: string
    txId: string
    useCDN: boolean
}

export interface AttachmentOptions {
    key?: string | null
    type: string
    block: Uint8Array
    name: string
}

export interface ProviderAgent {
    makeAttachment(options: AttachmentOptions): Promise<string>
    upload(id: string): AsyncGenerator<number>
    uploadLandingPage(metadata: LandingPageMetadata): Promise<string>
}

export interface FileInfo {
    type: 'file'
    provider: Provider
    id: string

    name: string
    size: number
    createdAt: Date

    key: string | undefined
    /** Doesn't exist in uploading file info */
    payloadTxID?: string
    /** Doesn't exist in uploading file info */
    landingTxID?: string
}

export type FileInfoV1 = Omit<FileInfo, 'type' | 'provider'> & {
    type: 'arweave'
}

export type DialogCloseCallback = () => void
