import { log } from '@graphprotocol/graph-ts/index'
import { PoolAdded } from '../generated/AddressProvider/CryptoRegistry'
import { ADDRESS_ZERO, REGISTRY_V2 } from '../../../packages/constants'
import { TokenExchange } from '../generated/templates/RegistryTemplate/CurvePoolV2'
import { createNewFactoryPool, createNewRegistryPool } from './services/pools'
import { MetaPool } from '../generated/templates/RegistryTemplate/MetaPool'
import { getLpToken } from './mapping'
import { handleExchange } from './services/swaps'
import { CryptoPoolDeployed } from '../generated/templates/CryptoFactoryTemplate/CryptoFactory'
import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'


export function addCryptoRegistryPool(pool: Address,
                                      registry: Address,
                                      block: BigInt,
                                      timestamp: BigInt,
                                      hash: Bytes): void {

  log.debug('New V2 factory crypto pool {} deployed at {}', [
    pool.toHexString(),
    hash.toHexString(),
  ])

  // Useless for now, but v2 metapools may be a thing at some point
  const testMetaPool = MetaPool.bind(pool)
  const testMetaPoolResult = testMetaPool.try_base_pool()
  if (!testMetaPoolResult.reverted) {
    createNewRegistryPool(
      pool,
      testMetaPoolResult.value,
      getLpToken(pool, registry),
      true,
      true,
      REGISTRY_V2,
      timestamp,
      block,
      hash
    )
  } else {
    createNewRegistryPool(
      pool,
      ADDRESS_ZERO,
      getLpToken(pool, registry),
      false,
      true,
      REGISTRY_V2,
      timestamp,
      block,
      hash
    )
  }
                                      }

export function handleCryptoPoolAdded(event: PoolAdded): void {
  addCryptoRegistryPool(
    event.params.pool,
    event.address,
    event.block.number,
    event.block.timestamp,
    event.transaction.hash
  )
}

export function handleCryptoPoolDeployed(event: CryptoPoolDeployed): void {
  log.debug('New V2 factory crypto pool deployed at {}', [event.transaction.hash.toHexString()])
  createNewFactoryPool(
    2,
    event.address,
    false,
    ADDRESS_ZERO,
    event.params.token,
    event.block.timestamp,
    event.block.number,
    event.transaction.hash
  )
}

export function handleTokenExchangeV2(event: TokenExchange): void {
  log.debug('swap for v2 pool: {} at {}', [event.address.toHexString(), event.transaction.hash.toHexString()])
  const trade = event.params

  handleExchange(
    trade.buyer,
    trade.sold_id,
    trade.bought_id,
    trade.tokens_sold,
    trade.tokens_bought,
    event.block.timestamp,
    event.block.number,
    event.address,
    event.transaction.hash,
    false
  )
}
