import { createRenderWithMetadata, createTypedMessageMetadataReader } from '@masknet/typed-message-react'
import { RedPacketMetaKey, RedPacketNftMetaKey } from '../constants.js'
import type { RedPacketJSONPayload, RedPacketNftJSONPayload } from '../types.js'
import schema from '../schema.json'
import schemaNtf from '../schema-nft.json'

export const RedPacketMetadataReader = createTypedMessageMetadataReader<RedPacketJSONPayload>(RedPacketMetaKey, schema)
export const renderWithRedPacketMetadata = createRenderWithMetadata(RedPacketMetadataReader)

export const RedPacketNftMetadataReader = createTypedMessageMetadataReader<RedPacketNftJSONPayload>(
    RedPacketNftMetaKey,
    schemaNtf,
)
export const renderWithRedPacketNftMetadata = createRenderWithMetadata(RedPacketNftMetadataReader)
