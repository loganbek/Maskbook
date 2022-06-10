import { CoinGecko, DeBank, EthereumWeb3, MetaSwap, NFTScan, OpenSea, TokenList, Zerion } from '@masknet/web3-providers'
import {
    FungibleToken,
    NonFungibleToken,
    NonFungibleTokenCollection,
    SourceType,
    FungibleAsset,
    HubOptions,
    NonFungibleAsset,
    Pageable,
    GasOptionType,
    createPageable,
    isSameAddress,
    currySameAddress,
    CurrencyType,
    Transaction,
} from '@masknet/web3-shared-base'
import {
    ChainId,
    chainResolver,
    formatEthereumAddress,
    GasOption,
    getCoinGeckoConstants,
    getTokenAssetBaseURLConstants,
    getTokenConstants,
    getTokenListConstants,
    isNativeTokenAddress,
    SchemaType,
} from '@masknet/web3-shared-evm'
import SPECIAL_ICON_LIST from './TokenIconSpecialIconList.json'
import type { EVM_Hub } from './types'

class Hub implements EVM_Hub {
    constructor(
        private chainId?: ChainId,
        private account?: string,
        private sourceType?: SourceType,
        private currencyType?: CurrencyType,
        private sizePerPage = 50,
        private maxPageSize = 25,
    ) {}

    async getFungibleTokensFromTokenList(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<FungibleToken<ChainId, SchemaType>>> {
        const expectedChainId = options?.chainId ?? chainId
        const { FUNGIBLE_TOKEN_LISTS = [] } = getTokenListConstants(expectedChainId)
        return TokenList.fetchFungibleTokensFromTokenLists(expectedChainId, FUNGIBLE_TOKEN_LISTS)
    }
    async getNonFungibleTokensFromTokenList(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<NonFungibleToken<ChainId, SchemaType>>> {
        throw new Error('Method not implemented.')
    }
    async getGasOptions(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Record<GasOptionType, GasOption>> {
        const expectedChainId = options?.chainId ?? chainId

        try {
            const isEIP1559 = chainResolver.isSupport(expectedChainId, 'EIP1559')
            if (isEIP1559) return await MetaSwap.getGasOptions(expectedChainId)
            return await DeBank.getGasOptions(expectedChainId)
        } catch (error) {
            return EthereumWeb3.getGasOptions(expectedChainId)
        }
    }
    getFungibleAsset(
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<FungibleAsset<ChainId, SchemaType>> {
        throw new Error('Method not implemented.')
    }
    async getFungibleAssets(
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Pageable<FungibleAsset<ChainId, SchemaType>>> {
        // only the first page is available
        if ((options?.indicator ?? 0) > 0) return createPageable([], 0)
        try {
            return await DeBank.getAssets(account, { chainId: this.chainId, ...options })
        } catch {
            return Zerion.getAssets(account, { chainId: this.chainId, ...options })
        }
    }
    async getNonFungibleAsset(
        address: string,
        tokenId: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<NonFungibleAsset<ChainId, SchemaType> | undefined> {
        return OpenSea.getAsset(address, tokenId, options)
    }
    getNonFungibleAssets(
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Pageable<NonFungibleAsset<ChainId, SchemaType>>> {
        try {
            return OpenSea.getTokens(account, { chainId: this.chainId, ...options })
        } catch {
            return NFTScan.getTokens(account, { chainId: this.chainId, ...options })
        }
    }
    getNonFungibleCollections(
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Pageable<NonFungibleTokenCollection<ChainId>>> {
        return OpenSea.getCollections(account, options)
    }
    getFungibleTokenPrice(
        chainId: ChainId,
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<number> {
        const expectedChainId = options?.chainId ?? chainId
        const expectedCurrencyType = options?.currencyType ?? this.currencyType
        const { PLATFORM_ID = '', COIN_ID = '' } = getCoinGeckoConstants(expectedChainId)

        if (isNativeTokenAddress(address)) {
            return CoinGecko.getTokenPriceByCoinId(COIN_ID, expectedCurrencyType)
        }

        return CoinGecko.getTokenPrice(PLATFORM_ID, address, expectedCurrencyType)
    }
    getNonFungibleTokenPrice(
        chainId: ChainId,
        address: string,
        tokenId: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<never> {
        throw new Error('Method not implemented.')
    }
    async getFungibleTokenIconURLs(
        chainId: ChainId,
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<string[]> {
        const expectedChainId = options?.chainId ?? chainId
        const { TOKEN_ASSET_BASE_URI = [] } = getTokenAssetBaseURLConstants(expectedChainId)
        const checkSummedAddress = formatEthereumAddress(address)

        if (isSameAddress(getTokenConstants().NATIVE_TOKEN_ADDRESS, checkSummedAddress)) {
            return TOKEN_ASSET_BASE_URI.map((x) => `${x}/info/logo.png`)
        }

        const specialIcon = SPECIAL_ICON_LIST.find(currySameAddress(address))
        if (specialIcon) return [specialIcon.logo_url]

        // load from remote
        return TOKEN_ASSET_BASE_URI.map((x) => `${x}/assets/${checkSummedAddress}/logo.png`)
    }
    getNonFungibleTokenIconURLs(
        chainId: ChainId,
        address: string,
        tokenId?: string | undefined,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<string[]> {
        throw new Error('Method not implemented.')
    }
    async getTransactions(
        chainId: ChainId,
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<Transaction<ChainId, SchemaType>>> {
        const expectedChainId = options?.chainId ?? chainId
        return DeBank.getTransactions(account, { chainId: expectedChainId })
    }

    async *getAllFungibleAssets(address: string): AsyncIterableIterator<FungibleAsset<ChainId, SchemaType>> {
        for (let i = 0; i < this.maxPageSize; i += 1) {
            const pageable = await this.getFungibleAssets(address, {
                indicator: i,
                size: this.sizePerPage,
            })

            yield* pageable.data

            if (pageable.data.length === 0) return
        }
    }

    async *getAllNonFungibleAssets(address: string): AsyncIterableIterator<NonFungibleAsset<ChainId, SchemaType>> {
        for (let i = 0; i < this.maxPageSize; i += 1) {
            const pageable = await this.getNonFungibleAssets(address, {
                indicator: i,
                size: this.sizePerPage,
            })

            yield* pageable.data

            if (pageable.data.length === 0) return
        }
    }

    async *getAllNonFungibleCollections(
        address: string,
        options?: HubOptions<ChainId>,
    ): AsyncIterableIterator<NonFungibleTokenCollection<ChainId>> {
        for (let i = 0; i < this.maxPageSize; i += 1) {
            const pageable = await this.getNonFungibleCollections(address, {
                indicator: i,
                size: this.sizePerPage,
                chainId: options?.chainId,
            })

            yield* pageable.data

            if (pageable.data.length === 0) return
        }
    }
}

export function createHub(
    chainId?: ChainId,
    account?: string,
    sourceType?: SourceType,
    currencyType?: CurrencyType,
    sizePerPage?: number,
    maxPageSize?: number,
) {
    return new Hub(chainId, account, sourceType, currencyType, sizePerPage, maxPageSize)
}
