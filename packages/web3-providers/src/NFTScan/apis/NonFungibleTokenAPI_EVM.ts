import urlcat from 'urlcat'
import { EMPTY_LIST } from '@masknet/shared-base'
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    HubIndicator,
    HubOptions,
    NonFungibleCollection,
    NonFungibleTokenContract,
    NonFungibleTokenEvent,
    Pageable,
} from '@masknet/web3-shared-base'
import { ChainId, SchemaType, isValidChainId } from '@masknet/web3-shared-evm'
import type { NonFungibleTokenAPI } from '../../types/index.js'
import { EVM, PageableResponse, Response } from '../types/index.js'
import {
    createNonFungibleAsset,
    createNonFungibleTokenContract,
    fetchFromNFTScanV2,
    createNonFungibleTokenEvent,
    createNonFungibleCollectionFromGroup,
    createNonFungibleCollectionFromCollection,
} from '../helpers/EVM.js'

export class NFTScanNonFungibleTokenAPI_EVM implements NonFungibleTokenAPI.Provider<ChainId, SchemaType> {
    async getAsset(address: string, tokenId: string, { chainId = ChainId.Mainnet }: HubOptions<ChainId> = {}) {
        if (!isValidChainId(chainId)) return
        const path = urlcat('/api/v2/assets/:address/:token_id', {
            address,
            contract_address: address,
            token_id: tokenId,
            show_attribute: true,
        })
        const response = await fetchFromNFTScanV2<Response<EVM.Asset>>(chainId, path)
        if (!response?.data) return

        const collection = await this.getCollectionRaw(response.data.contract_address, { chainId })
        return createNonFungibleAsset(chainId, response.data, collection)
    }

    async getAssets(account: string, { chainId = ChainId.Mainnet, indicator, size = 20 }: HubOptions<ChainId> = {}) {
        if (!isValidChainId(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator))
        const path = urlcat('/api/v2/account/own/all/:from', {
            from: account,
            show_attribute: true,
        })
        const response = await fetchFromNFTScanV2<Response<EVM.AssetsGroup[]>>(chainId, path)
        const assets = response?.data?.flatMap((x) => x.assets.map((y) => createNonFungibleAsset(chainId, y, x)))
        return createPageable(assets ?? EMPTY_LIST, createIndicator(indicator))
    }

    async getAssetsByCollection(
        address: string,
        { chainId = ChainId.Mainnet, indicator, size = 20 }: HubOptions<ChainId> = {},
    ) {
        if (!isValidChainId(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator))
        const path = urlcat('/api/v2/assets/:address', {
            address,
            contract_address: address,
            show_attribute: true,
            limit: size,
            cursor: indicator?.id,
        })
        const response = await fetchFromNFTScanV2<PageableResponse<EVM.Asset>>(chainId, path)
        const assets = response?.data?.content.map((x) => createNonFungibleAsset(chainId, x)) ?? EMPTY_LIST
        return createPageable(
            assets,
            createIndicator(indicator),
            response?.data.next ? createNextIndicator(indicator, response?.data.next) : undefined,
        )
    }

    async getCollectionsByOwner(
        account: string,
        { chainId = ChainId.Mainnet, indicator }: HubOptions<ChainId, HubIndicator> = {},
    ): Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>, HubIndicator>> {
        if (!isValidChainId(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator))
        const path = urlcat('/api/v2/account/own/all/:from', {
            from: account,
            erc_type: EVM.ErcType.ERC721,
            show_attribute: true,
        })
        const response = await fetchFromNFTScanV2<Response<EVM.AssetsGroup[]>>(chainId, path)
        const collections = response?.data.map((x) => createNonFungibleCollectionFromGroup(chainId, x)) ?? EMPTY_LIST
        return createPageable(collections, createIndicator(indicator))
    }

    async getCollectionsByKeyword(
        keyword: string,
        { chainId = ChainId.Mainnet, indicator, size = 20 }: HubOptions<ChainId, HubIndicator> = {},
    ): Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>, HubIndicator>> {
        if (!isValidChainId(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator))
        const path = '/api/v2/collections/filters'
        const response = await fetchFromNFTScanV2<Response<EVM.Collection[]>>(chainId, path, {
            method: 'POST',
            body: JSON.stringify({
                name: keyword,
                symbol: '',
                limit: size.toString(),
                offset: (indicator?.index ?? 0) * size,
                contract_address_list: [],
            }),
        })
        const collections =
            response?.data.map((x) => createNonFungibleCollectionFromCollection(chainId, x)) ?? EMPTY_LIST
        return createPageable(collections, createIndicator(indicator))
    }

    async getCollectionRaw(
        address: string,
        { chainId = ChainId.Mainnet }: HubOptions<ChainId, HubIndicator> = {},
    ): Promise<EVM.Collection | undefined> {
        if (!isValidChainId(chainId)) return
        const path = urlcat('/api/v2/collections/:address', {
            address,
        })
        const response = await fetchFromNFTScanV2<Response<EVM.Collection>>(chainId, path)
        return response?.data
    }

    async getCollection(
        address: string,
        { chainId = ChainId.Mainnet }: HubOptions<ChainId, HubIndicator> = {},
    ): Promise<NonFungibleCollection<ChainId, SchemaType> | undefined> {
        const rawCollection = await this.getCollectionRaw(address, { chainId })
        if (!rawCollection) return
        return createNonFungibleCollectionFromCollection(chainId, rawCollection)
    }

    async getContract(
        address: string,
        { chainId = ChainId.Mainnet }: HubOptions<ChainId, HubIndicator> = {},
    ): Promise<NonFungibleTokenContract<ChainId, SchemaType> | undefined> {
        const path = urlcat('/api/v2/collections/:address', {
            address,
        })
        const response = await fetchFromNFTScanV2<Response<EVM.Collection>>(chainId, path)
        if (!response?.data) return
        return createNonFungibleTokenContract(chainId, response.data)
    }

    async getEvents(
        address: string,
        tokenId: string,
        { chainId = ChainId.Mainnet, indicator, size = 20 }: HubOptions<ChainId, HubIndicator> = {},
    ): Promise<Pageable<NonFungibleTokenEvent<ChainId, SchemaType>>> {
        if (!isValidChainId(chainId)) return createPageable(EMPTY_LIST, createIndicator(indicator))
        const path = urlcat('/api/v2/transactions/:address/:tokenId', {
            address,
            tokenId,
            limit: size,
            cursor: indicator?.id,
        })
        const response = await fetchFromNFTScanV2<PageableResponse<EVM.Transaction>>(chainId, path)
        const events = response?.data.content.map((x) => createNonFungibleTokenEvent(chainId, x)) ?? EMPTY_LIST
        return createPageable(
            events,
            createIndicator(indicator),
            response?.data.next ? createNextIndicator(indicator, response?.data.next) : undefined,
        )
    }
}
