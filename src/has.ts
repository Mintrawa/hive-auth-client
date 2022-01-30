/* eslint-disable @typescript-eslint/no-explicit-any */

/** Require */
import { v4 as uuidv4 } from 'uuid'
import CryptoJS   from 'crypto-js'
import AES        from 'crypto-js/aes'
import { Buffer } from 'buffer'

/** RXJS */
import { webSocket, WebSocketSubject } from 'rxjs/webSocket'

import { 
  HAS_STATUS, HAS_CONNECTED_MSG, HAS_RECV_MSG,
  HAS_AUTH_WAIT_MSG, HAS_AUTH_ACK_MSG, HAS_AUTH_NACK_MSG, HAS_SIGN_WAIT_MSG, HAS_SIGN_ACK_MSG, HAS_SIGN_NACK_MSG, HAS_SIGN_ERR_MSG,
  HAS_APP, HAS_AUTH_REQ_DATA, HAS_AUTH_REQ_MSG, HAS_DECODED_AUTH_ACK
} from './helpers/has'

/** Hive Authentication Client */
import { hacAddAccount, hacMsg } from './'
import { HAC_PREVIOUS_CONNECTION } from './helpers/hac'

/**
 * 
 * HIVE AUTHENTICATION SERVICES
 * 
 */
let socket$: WebSocketSubject<any>

/** HAS default servers */
let has = ["wss://hive-auth.arcange.eu"]
let hasIndex = 0
let hasTry = 0

/** HAS status */
let hasStatus: HAS_STATUS

let hasAccount: HAC_PREVIOUS_CONNECTION
let hasPreAuth: { account: string, challenge: string }

let uuid:string
let expire: number

let hasKey: string

/** [HAS] Get the status of the connection */
export const hasGetConnectionStatus = (): HAS_STATUS|null => {
  return hasStatus ? hasStatus : null
}
 
/** [HAS] Set the status of the connection */
const hasSetConnectedStatus = (has: HAS_CONNECTED_MSG): void => {
  hasStatus = {
    status:    "connected",
    ping_rate: has.ping_rate,
    protocol:  has.protocol,
    server:    has.server,
    socketid:  has.socketid,
    timeout:   has.timeout,
    version:   has.version
  }
}

/** [HAS] Get the account */
export const hasGetAccount = (): HAC_PREVIOUS_CONNECTION => {
  return hasAccount
}

/** [HAS] Set the account */
export const hasSetAccount = (account: HAC_PREVIOUS_CONNECTION): void => {
  hasAccount = account
  if(hasAccount.has) hasKey = hasAccount.has.auth_key
  if(sessionStorage.getItem("hasmode")) console.log('%c[HAS Set Account]', 'color: seagreen', hasAccount)
}

/**
 * [HAS] Connect via websocket to Hive Authentication Services
 * @param { string[] } [ hasServer ] - list of websocket url of HAS server
 */ 
export const HiveAuthService = (hasServers?:string[]): void => {
  if(hasServers) has = hasServers

  socket$ = webSocket(has[hasIndex])
  socket$.subscribe({
    next: (recv_msg: HAS_RECV_MSG) => {
      if(typeof(recv_msg) !== 'object' || !recv_msg.cmd) throw new Error(`HAS: invalid data received`)
      if(sessionStorage.getItem("hasmode")) console.log('%c[HAS RECV]', 'color: seagreen', recv_msg)

      switch (recv_msg.cmd) {

        /** Connected to the HAS */
        case 'connected':
          hasSetConnectedStatus(recv_msg as HAS_CONNECTED_MSG)
          hasTry = 0
          break

        /** Waiting validation by the PKSA */
        case 'auth_wait':
          recvAuthWait(recv_msg as HAS_AUTH_WAIT_MSG)
          break

        /** Authentication approval */
        case 'auth_ack':
          recvAuthAck(recv_msg as HAS_AUTH_ACK_MSG)
          break

        /** Authentication refused */
        case 'auth_nack':
          recvAuthNack(recv_msg as HAS_AUTH_NACK_MSG)
          break

        /** Waiting validation by the PKSA of the Sign request */
        case 'sign_wait':
          recvSignWait(recv_msg as HAS_SIGN_WAIT_MSG)
          break

        /** Sign request approved */
        case 'sign_ack':
          recvSignAck(recv_msg as HAS_SIGN_ACK_MSG)
          break

        /** Sign request refused */
        case 'sign_nack':
          recvSignNack(recv_msg as HAS_SIGN_NACK_MSG)
          break

        /** Sign request error */
        case 'sign_err':
          recvSignErr(recv_msg as HAS_SIGN_ERR_MSG)
          break

        default:
          break
      }
    },
    /** Restart websocket if error (try another HAS server if available) */
    error: () => {
      hasTry++
      if(hasStatus) hasStatus.status = "disconnected"
      if(sessionStorage.getItem("hasmode")) console.log('%c[HAS] error websocket!', 'color: crimson')
      hasIndex = typeof(has[hasIndex++]) === "string" ? hasIndex++ : 0
      if(hasTry < 10) {
        setTimeout(() => {
          HiveAuthService()
        }, 250)
      }
    },
    complete: () => {
      hasStatus.status = "disconnected"
    } 
  })     
}

/**
 * [SEND] an authentication request to the Hive Authentication Services via websocket
 * @param { string } account 
 * @param app 
 * @param { key_type: "active"|"posting", value: string } challenge 
 */
export const hasSendAuthReq = ( account: string, app: HAS_APP, challenge: { key_type: "active"|"posting", value: string }): void => {
  if(!socket$) throw new Error(`No connection to HAS`)

  const auth_data: HAS_AUTH_REQ_DATA = {
    app,
    challenge: {
      key_type:challenge.key_type,
      challenge: challenge.value
    }
  }

  if(!hasAccount || !hasAccount.has) hasKey = uuidv4()
  if(hasAccount && hasAccount.has) hasKey = hasAccount.has.auth_key

  const enc = AES.encrypt(JSON.stringify(auth_data), hasKey).toString()
  const auth_req: HAS_AUTH_REQ_MSG = { cmd: "auth_req", token: auth_data.token, account, data: enc }
  if(sessionStorage.getItem("hasmode")) console.log('%c[HAS SEND]', 'color: dodgerblue', auth_req)
  socket$.next(auth_req)

  hasPreAuth = { account, challenge: challenge.value }
}
 
/**
* [RECV] an Authentication waiting (auth_wait)
* @param recv_msg 
* @param auth_key 
*/
const recvAuthWait = (recv_msg: HAS_AUTH_WAIT_MSG): void => {
  uuid = recv_msg.uuid

  /** Prepare the data for the QRcode */
  const json = JSON.stringify({
    account: recv_msg.account, 
    uuid:    uuid,
    key:     hasKey,
    host:    has[hasIndex]
  })

  /** [HAC MSG] Emit a qrCode msg (qr_code) */
  hacMsg.next({
    type: 'qr_code',
    msg: Buffer.from(json).toString('base64')
  })
}
 
/**
* [RECV] an Authentication ack (auth_ack)
* @param recv_msg 
*/
const recvAuthAck = (recv_msg: HAS_AUTH_ACK_MSG): void => {
  try {
    /** decode the encrypted data */
    const data: HAS_DECODED_AUTH_ACK = JSON.parse(AES.decrypt(recv_msg.data, hasKey).toString(CryptoJS.enc.Utf8))
    const challenge = data.challenge ? data.challenge.challenge : ''

    /** [HAC MSG] Emit an authentication msg */
    hacMsg.next({
      type: "authentication",
      msg:  {
        status: "authentified",
        data: {
          challenge,
          has_token:  data.token,
          has_expire: data.expire,
          has_server: has[hasIndex]
        }
      }
    })

    /** Update hacAccount */
    hacAddAccount({
      account: hasPreAuth.account,
      has: {
        auth_key:   hasKey,
        has_token:  data.token,
        has_expire: data.expire,
        has_server: has[hasIndex]
      },
      hkc: false,
      challenge: {
        value: hasPreAuth.challenge,
        signature: challenge
      }
    })
  } catch (e) {
    if(sessionStorage.getItem("hasmode")) console.error(e)
    const msg = e instanceof Error ? e.message : "Error Authentication ack (auth_ack)"
    /** [HAC MSG] Emit an authentication error msg */
    hacMsg.next({ type: "authentication", error: { msg } })
  }
}
 
/**
* [RECV] a rejected Authentication (auth_nack)
* @param recv_msg 
*/
const recvAuthNack = (recv_msg: HAS_AUTH_NACK_MSG): void => {
  try {
    /** decode the encrypted data */
    const data: unknown = AES.decrypt(recv_msg.data, hasKey).toString(CryptoJS.enc.Utf8)
    if(sessionStorage.getItem("hasmode")) console.log('%cHAS auth_nack => decoded data:', 'color: darkolivegreen', data)
    /** [HAC MSG] Emit a rejected Authentication msg if uuid encrypted match the uuid */
    if(recv_msg.uuid === data) hacMsg.next({
      type: "authentication",
      msg:  {
        status: "rejected",
      },
      error: {
        msg: typeof(data) === "string" ? data : "rejected Authentication (auth_nack)"
      }
    })
  } catch (e) {
    if(sessionStorage.getItem("hasmode")) console.error(e)
    const msg = e instanceof Error ? e.message : "Error rejected Authentication (auth_nack)"
    /** [HAC MSG] Emit an authentication error msg */
    hacMsg.next({ type: "authentication", error: { msg } })
  }
}
 
/**
* [SEND] a Sign request
* @param { string } account 
* @param { string } token 
* @param { key_type: 'active'|'posting'|'memo', ops: string, broadcast: boolean } ops 
* @param { string } auth_key 
*/
export const sendSignReq = (account: string, ops: { key_type: "owner"|"active"|"posting"|"memo", ops: any, broadcast: boolean }): void => {
  if(!socket$) throw new Error(`No connection to HAS`)
  if(!hasAccount || !hasAccount.account || hasAccount.account !== account) throw new Error(`Account not match the HAS account`)
  if(hasAccount.has && !hasAccount.has.has_token) throw new Error(`No token to use with HAS`)
  if(!hasKey) throw new Error(`No auth_key to use with HAS`)

  const enc     = AES.encrypt(JSON.stringify(ops), hasKey).toString()
  const token   = hasAccount.has ? hasAccount.has.has_token : ''
  const ops_req = { cmd: "sign_req", account, token, data: enc }
  if(sessionStorage.getItem("hasmode")) console.log('%c[HAS SEND]', 'color: dodgerblue', ops_req)
  socket$.next(ops_req)
}

/**
* [RECV] a Sign waiting
* @param recv_msg 
*/
const recvSignWait = (recv_msg: HAS_SIGN_WAIT_MSG): void => {
  uuid =   recv_msg.uuid
  expire = recv_msg.expire
  /** [HAC MSG] Emit an sign wait msg (sign_wait) */
  hacMsg.next({
    type: "sign_wait",
    msg: {
      uuid:   uuid,
      expire: expire
    }
  })
}

/**
* [RECV] a Sign ack (sign_ack)
* @param recv_msg 
*/
const recvSignAck = (recv_msg: HAS_SIGN_ACK_MSG): void => {
  /** [HAC MSG] Emit an transaction result msg (tx_result) */
  hacMsg.next({
    type: "tx_result",
    msg: {
      status:    "accepted",
      uuid:      recv_msg.uuid,
      broadcast: recv_msg.broadcast,
      data:      recv_msg.data
    }
  })
}

/**
* [RECV] a Sign Nack (sign_nack)
* @param recv_msg 
*/
const recvSignNack = (recv_msg: HAS_SIGN_NACK_MSG): void => {
  /** [HAC MSG] Emit an transaction result msg (tx_result) */
  hacMsg.next({
    type: "tx_result",
    msg: {
      status:    "rejected",
      uuid:      recv_msg.uuid,
      data:      recv_msg.data
    }
  })
}

/**
* [RECV] a Sign err (sign_err) 
* @param recv_msg 
*/
const recvSignErr = (recv_msg: HAS_SIGN_ERR_MSG): void => {
  /** [HAC MSG] Emit an transaction result msg (tx_result) */
  hacMsg.next({
    type: "tx_result",
    msg: {
      status: "error",
      uuid:   recv_msg.uuid
    },
    error: {
      msg: recv_msg.error
    }
  })
}
 
 