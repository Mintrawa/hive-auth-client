/* eslint-disable @typescript-eslint/no-explicit-any */

/** Hive Keychain */
import { SIGNATURE, BROADCAST } from './helpers/keychain'

/** Hive Authentication Client */
import { hacMsg, hacAddAccount } from './index'
import { HAC_MSG_AUTHENTICATION, HAC_MSG_TX_RESULT } from './helpers/hac'

/** Hive Authentication Services */
import { hasGetAccount } from './has'

/**
 * 
 * HIVE KEYCHAIN BROWSER EXTENSION
 * 
 */
 export let keychain = false

/**
 * [KEYCHAIN] Check if installed
 * @param { number } ms - delay (ms) before execute 
 */
export const keychainCheck = (ms: number): void => {
  setTimeout(async () => {
    if ((window as any).hive_keychain) {
      (window as any).hive_keychain.requestHandshake(() => {
        keychain = true
        if(sessionStorage.getItem("hasmode")) console.log('%c[KEYCHAIN Handshake]', 'color: blueviolet', 'Check Keychain', keychain)
        hacMsg.next({ type: "keychainStatus", msg: keychain ? "active" : "not installed" })
      })      
    } else {
      hacMsg.next({ type: "keychainStatus", msg: "not installed" })
    }
  }, ms)
}
 
/**
 * [KEYCHAIN] Sign a msg
 * @param { string } account - Hive account to use to sign the message
 * @param { string } msg - message to sign
 * @param { "Active"|"Posting"|"Memo" } key - Hive private key to use to sign the message
 * @param { number } ms - delay (ms) before execute
 */
export const keychainSignBuffer = (account: string, msg: string, key: "Owner"|"Active"|"Posting"|"Memo", ms: number): void => {
  setTimeout(() => {
    (window as any).hive_keychain.requestSignBuffer(account, msg, key, (response: SIGNATURE) => {
      if(sessionStorage.getItem("hasmode")) console.log('%c[KEYCHAIN Sign Buffer]', 'color: blueviolet', response)
      if(response.success) {
        /** HAC add Account */
        hacAddAccount({ account, hkc: true, challenge: { value: msg, signature: response.result } })
        const authentified: HAC_MSG_AUTHENTICATION = {
          type: "authentication",
          msg: {
            status: "authentified",
            data: {
              challenge: response.result
            }
          }
        }
        hacMsg.next(authentified)
      } else {
        const authentified: HAC_MSG_AUTHENTICATION = {
          type: "authentication",
          msg: {
            status: "rejected",
            data: {
              challenge: response.message
            }
          }
        }
        hacMsg.next(authentified)
      }
    })
  }, ms)
}
 
/* Request to Broadcast operation */
export const keychainBroadcast = (account: string, operations:any[], key: "Owner"|"Active"|"Posting"|"Memo", ms: number): void => {
  if(!hasGetAccount()) throw new Error('User not connected')
  setTimeout(() => {
    (window as any).hive_keychain.requestBroadcast(account, operations, key, (response: BROADCAST) => {
      if(sessionStorage.getItem("hasmode")) console.log('%c[KEYCHAIN Broadcast]', 'color: blueviolet', response)
      if(response.success) {
        const tx_result: HAC_MSG_TX_RESULT = {
          type: "tx_result",
          msg: {
            status: "accepted",
            data: response.result
          }
        }
        hacMsg.next(tx_result)
      } else {
        const tx_result: HAC_MSG_TX_RESULT = {
          type: "tx_result",
          msg: {
            status: "rejected",
            data: response.message
          }
        }
        hacMsg.next(tx_result)
      }
    })
  }, ms)
}
 
/* Request to sign a transaction */
export const keychainSignTx = (account: string, tx:any, key:'Posting'|'Active'|'Memo', ms: number): Promise<any> => {
  return new Promise(resolve => setTimeout(() => {
    (window as any).hive_keychain.requestSignTx(account, tx, key, (response: any) => {
      resolve(response)
    })
  }, ms))
}