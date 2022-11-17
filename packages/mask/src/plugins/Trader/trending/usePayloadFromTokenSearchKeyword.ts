import { DataProvider } from '@masknet/public-api'
import type { NetworkPluginID } from '@masknet/shared-base'
import { useWeb3State } from '@masknet/web3-hooks-base'
import type { ChainId } from '@masknet/web3-shared-evm'
import { useTrendingById, useCoinIdByAddress } from '../trending/useTrending.js'
import { TagType } from '../types/index.js'

export function usePayloadFromTokenSearchKeyword(pluginID?: NetworkPluginID, keyword = '') {
    const regexResult = keyword.match(/([#$])(\w+)/) ?? []
    const { Others } = useWeb3State(pluginID)
    const searchedContractAddress = Others?.isValidAddress(keyword) ? keyword : ''
    const type = searchedContractAddress ? '$' : regexResult[1]

    const [_, _type, name = ''] = keyword.match(/([#$])(\w+)/) ?? []

    const trendingByIdResult = useTrendingById(searchedContractAddress, DataProvider.NFTScan)
    const { value: nonFungibleAsset } = trendingByIdResult
    const { value: fungibleAsset } = useCoinIdByAddress(searchedContractAddress)

    const nonFungibleAssetName = nonFungibleAsset?.trending?.coin.symbol || nonFungibleAsset?.trending?.coin.name
    const isNFT = !!nonFungibleAssetName
    const presetDataProviders = isNFT
        ? [DataProvider.NFTScan]
        : [DataProvider.CoinGecko, DataProvider.CoinMarketCap, DataProvider.UniswapInfo]

    return {
        name: searchedContractAddress ? (isNFT ? nonFungibleAssetName : fungibleAsset?.name ?? '') : name,
        chainId: isNFT ? nonFungibleAsset.trending?.coin.chainId : (fungibleAsset?.chainId as ChainId),
        asset: isNFT ? trendingByIdResult : undefined,
        presetDataProviders,
        searchedContractAddress: Others?.isValidAddress(keyword) ? keyword : undefined,
        type: type === '$' ? TagType.CASH : TagType.HASH,
    }
}
