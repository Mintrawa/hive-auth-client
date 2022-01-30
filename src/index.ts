/** RXJS */
import { Subject } from 'rxjs'

/** Encrytion */
import CryptoJS   from 'crypto-js'
import AES        from 'crypto-js/aes'

/** Hive Authentication Client */
import {
  HAC_MODULE, HAC_STATUS, HAC_PREVIOUS_CONNECTION, HAC_MESSAGE
} from './helpers/hac'

/** Hive Authentication Service */
import { 
  HiveAuthService, hasGetConnectionStatus, hasSendAuthReq, hasSetAccount, hasGetAccount, sendSignReq
} from './has'
import { 
  HAS_APP
} from './helpers/has'

/** Hive Keychain */
import { keychainCheck, keychain, keychainSignBuffer, keychainBroadcast } from './keychain'

/** HIVE */
import { CUSTOM_JSON, FOLLOWING } from './helpers/hive/custom_json'
import { 
  OPERATION, CLAIM_ACCOUNT, VOTE, ACCOUNT_WITNESS_VOTE, ACCOUNT_WITNESS_PROXY, 
  TRANSFER, TRANSFER_TO_VESTING, WITHDRAW_VESTING, DELEGATE_VESTING_SHARES, CONVERT 
} from './helpers/hive'

/** Internal fonction */
const firstCharUpper = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * 
 * HIVE AUTH CLIENT
 * 
 */

/** Default value */
let keychainDelay = 200
let hacModule: HAC_MODULE = "has"

/** HAC accounts history */
let hacAccounts: HAC_PREVIOUS_CONNECTION[] = []

let hacPwd: string
let username: string

/**
 * Hive Auth Client RxJS messaging
 */
export const hacMsg = new Subject<HAC_MESSAGE>()

/**
 * [HAC] Main Function => Hive Auth Client 
 * @param { string[] } [ hasServer ] - list of websocket url of HAS server
 * @param { debug?:boolean, delay?: number } [ options ] - options
 * @returns void
 */
export const HiveAuthClient = (hasServer?:string[], options?: { debug?:boolean, delay?: number }): void => {
  if(options) {
    sessionStorage.removeItem("hasmode")
    if(options.debug) sessionStorage.setItem("hasmode", "debug")
    if(options.delay) keychainDelay = options.delay
  }

  /** Start HiveAuthService */
  hasServer? HiveAuthService(hasServer) : HiveAuthService()

  /** Check Hive Keychain browser extension */
  keychainCheck(keychainDelay)
}

export const hacGetConnectionStatus = (): HAC_STATUS => {
  const status:HAC_STATUS = {
    keychain,
    has: hasGetConnectionStatus()
  }
  return status
}

/**
 * [HAC] Get all or one specific connection info
 * @param { string } [account] - Account to retrieve
 * @param { string } [pwd] - Password to use to decrypt localStorage
 * @returns HAC_PREVIOUS_CONNECTION[]
 */
export const hacGetAccounts = (account?: string, pwd?: string): HAC_PREVIOUS_CONNECTION[] => {
  try {
    if(pwd && typeof(pwd) !== "string") throw new Error("Password need to be a string")
    if(!pwd && typeof(hacPwd) !== "string") throw new Error("No Password yet")
    if(account && typeof(account) !== "string") throw new Error("Account is not a valid string")

    /** if password OK */
    if(hacCheckPwd(pwd ? pwd : hacPwd)) {
      if(pwd) hacPwd = pwd

      /** Decrypt Accounts */
      const a = localStorage.getItem('hac') ? localStorage.getItem('hac') : undefined
      hacAccounts = a ? JSON.parse(AES.decrypt(a.substring(64), hacPwd).toString(CryptoJS.enc.Utf8)) : []

      /** Check expired for account via HAS and remove them */
      for (const [i, acc] of hacAccounts.entries()) {
        if(acc.has && acc.has.has_expire && acc.has.has_expire < Date.now()) hacAccounts.splice(i, 1)
      }

      const enc = AES.encrypt(JSON.stringify(hacAccounts), hacPwd).toString()
      const hmac = CryptoJS.HmacSHA256(enc, CryptoJS.SHA256(hacPwd)).toString()
      localStorage.setItem('hac', hmac+enc)

      if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Accounts]', 'color: deeppink', hacAccounts)

      /** If search specific account */
      if(account) {
        const lycos = hacAccounts.find(a => a.account === account)
        if(lycos) {
          hasSetAccount(lycos)
          username = lycos.account
        }
        if(lycos && lycos.hkc) {
          hacModule = "keychain"
        } else {
          hacModule = "has"
        }
        return hasGetAccount() ? [hasGetAccount()] : []
      /** Return all accounts */
      } else {
        return hacAccounts
      }
    } else {
      localStorage.removeItem('hac')
      return []
    }
  } catch (e) {
    if(sessionStorage.getItem("hasmode")) console.error(e)
    return []
  }
}

/**
 * [HAC] Add or Update account
 * @param { HAC_PREVIOUS_CONNECTION } account 
 * @returns void
 */
export const hacAddAccount = (account: HAC_PREVIOUS_CONNECTION): void => {
  if(typeof(hacPwd) !== "string") throw new Error("No Password yet")
  username = account.account
  hasSetAccount(account)
  const lycos = hacAccounts.findIndex(a => a.account === account.account)

  if(lycos > -1) {
    hacAccounts[lycos] = account
  } else {
    hacAccounts.push(account)
  }

  const enc = AES.encrypt(JSON.stringify(hacAccounts), hacPwd).toString()
  const hmac = CryptoJS.HmacSHA256(enc, CryptoJS.SHA256(hacPwd)).toString()
  localStorage.setItem('hac', hmac+enc)
}

/**
 * [HAC] Remove an account
 * @param { string } account 
 * @returns boolean
 */
 export const hacRemoveAccount = (account: string): boolean => {
  try {
    if(account && typeof(account) !== "string") throw new Error("Account is not a valid string")
    if(hacAccounts.length === 0) throw new Error("No account in array")

    /** Search account index in array */
    const lycos = hacAccounts.findIndex(a => a.account === account)
    hacAccounts.splice(lycos, 1)

    /** if no account in array delete localStorage */
    if(hacAccounts.length === 0) {
      localStorage.removeItem('hac')
    } else {
      const enc = AES.encrypt(JSON.stringify(hacAccounts), hacPwd).toString()
      const hmac = CryptoJS.HmacSHA256(enc, CryptoJS.SHA256(hacPwd)).toString()
      localStorage.setItem('hac', hmac+enc)
    }
    return true   
  } catch (e) {
    if(sessionStorage.getItem("hasmode")) console.error(e)
    throw new Error("Something went wrong when tryin to remove the account")
  }
}

/**
 * [HAC] Check password
 * @param { string } pwd
 * @returns boolean
 */
export const hacCheckPwd = (pwd: string): boolean => {
  try {
    if(pwd && typeof(pwd) !== "string") throw new Error("Password need to be a string")
  
    /** Retrieve accounts stored */
    const a = localStorage.getItem('hac') ? localStorage.getItem('hac') : undefined
    if(a) {
      /** Check HMAC */
      const hmac = a.substring(0, 64)
      const enc  = a.substring(64)
      const decryptedhmac = CryptoJS.HmacSHA256(enc, CryptoJS.SHA256(pwd ? pwd : hacPwd)).toString()
      /** HMAC not match the reference HMAC */
      if(decryptedhmac !== hmac) {
        return false
      /** Both HMAC match */
      } else {
        return true
      }
    /** No accounts stored yet */
    } else {
      throw new Error("No accounts stored yet")
    }
  /** Something went wrong */
  } catch (e) {
    if(sessionStorage.getItem("hasmode")) console.error(e)
    throw new Error("Something went wrong with the password check")
  }
}

/**
 * HAC User Authentication
 * @param { string }     account - Hive User to connect
 * @param { HAS_APP }    app - App
 * @param { string }     pwd - Password to use to encrypt localStorage
 * @param { string }     challenge - String to sign with Hive User private key 
 * @param { HAC_MODULE } [m] - Module to use (has, keychain)
 * @returns void
 */
export const hacUserAuth = (account: string, app: HAS_APP, pwd: string, challenge: { key_type: "active"|"posting", value: string }, m?: HAC_MODULE): void => {
  try {
    if(typeof(account) !== "string") throw new Error("Account need to be a string")
    if(typeof(pwd) !== "string") throw new Error("Password need to be a string")
    if(typeof(challenge.value) !== "string") throw new Error("Challenge value need to be a string")
    if(!challenge.key_type || (challenge.key_type !== "active" && challenge.key_type !== "posting")) throw new Error('Key value need to be "posting" or "active"')

    /** if previous */
    if(localStorage.getItem('hac')) {
      /** Retrieve account if known */
      const a = hacGetAccounts(account, pwd)
      if(a.length === 1 && a[0].hkc) {
        hacModule = "keychain"
      } else {
        hacModule = "has"
      }
    } else {
      if(pwd) hacPwd = pwd
    }

    /** If force module */
    if(m) hacModule = m

    /** Auth by Hive Keychain */
    if(hacModule === "keychain") keychainSignBuffer(account, challenge.value, firstCharUpper(challenge.key_type) as "Owner"|"Active"|"Posting"|"Memo", keychainDelay)

    /** Auth by HAS */
    if(hacModule === "has") hasSendAuthReq(account, app, challenge)
  } catch (e) {
    hacMsg.next({ type: "authentication", error: { msg: e instanceof Error ? e.message : 'error' } })
  }
}

/*****************************
 * 
 * OPERATIONS
 * 
 */

/**
 * HAC Send a Manual Transaction
 * @param { "owner"|"active"|"posting" } key_type 
 * @param { OPERATION } op 
 */
export const hacManualTransaction = (key_type: "owner"|"active"|"posting"|"memo", op: OPERATION ): void => {
  if(typeof(key_type) !== "string" && !["owner","active","posting"].includes(key_type)) throw new Error('Not a valid key_type')
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Following]', 'color: deeppink', op)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [op], firstCharUpper(key_type) as "Owner"|"Active"|"Posting"|"Memo", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type, ops: [op], broadcast: true })
}

/**
 * HAC Claim a free account
 */
export const hacClaimAccount = (): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")

  const claimAccount: CLAIM_ACCOUNT = [ "claim_account", { fee: "0.000 HIVE", creator: username, extensions: [] } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Following]', 'color: deeppink', claimAccount)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [claimAccount], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [claimAccount], broadcast: true })
}

/**
 * Follow/UnFollow a user
 * @param { string } account 
 * @param { string } following 
 * @param { boolean } follow 
 */
export const hacFollowing = (following: string, follow: boolean): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")

  const json: FOLLOWING = [ "follow", { follower: username, following, what: follow ? [ "blog" ] : [] } ]
  const custom_json: CUSTOM_JSON = [ "custom_json", { id: 'follow', json: JSON.stringify(json), required_auths: [], required_posting_auths: [ username ] } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Following]', 'color: deeppink', custom_json)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [custom_json], "Posting", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "posting", ops: [custom_json], broadcast: true })
}

/**
 * Vote/Downvote a user post
 * @param { string } author 
 * @param { string } permlink 
 * @param { number } weight 
 */
export const hacVote = (author: string, permlink: string, weight: number): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(permlink) !== "string") throw new Error("Permlink Error")
  if(weight < -100 || weight > 100) throw new Error("weight need to be between -100 and 100")

  const vote: VOTE = [ "vote", { voter: username, author, permlink, weight: weight * 100 } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Vote]', 'color: deeppink', vote)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [vote], "Posting", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "posting", ops: [vote], broadcast: true })
}

/*****************************
 * 
 * OPERATIONS WALLET
 * 
 */

/**
 * Transfer HIVE or HBD to another user
 * @param to 
 * @param amount 
 * @param currency 
 * @param memo 
 */
export const hacTransfer = (to: string, amount: string, currency: "HIVE"|"HBD", memo: string): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(to) !== "string") throw new Error("recipient must be a string")
  if(typeof(amount) !== "string") throw new Error("amount must be a string")
  if(currency !== "HIVE" && currency !== "HBD") throw new Error("currency must be HIVE or HBD")
  if(typeof(memo) !== "string") throw new Error("memo must be a string")

  const transfer: TRANSFER = [ "transfer", { from: username, to, amount: amount.concat(" ", currency), memo } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Transfer]', 'color: deeppink', transfer)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [transfer], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [transfer], broadcast: true })
}

/**
 * Transfer to Vesting (Power UP)
 * @param { string } to 
 * @param { string } amount 
 */
export const hacTransferToVesting = (to: string, amount: string): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(to) !== "string") throw new Error("recipient must be a string")
  if(typeof(amount) !== "string") throw new Error("amount must be a string")

  const transferToVesting: TRANSFER_TO_VESTING = [ "transfer_to_vesting", { from: username, to, amount: amount+" HIVE" } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Transfer To Vesting]', 'color: deeppink', transferToVesting)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [transferToVesting], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [transferToVesting], broadcast: true })
}

/**
 * Withdraw from Vesting (Power Down)
 * @param { string } vesting_shares 
 */
export const hacWithdrawVesting = (vesting_shares: string): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(vesting_shares) !== "string") throw new Error("amount must be a string")

  const withdrawVesting: WITHDRAW_VESTING = [ "withdraw_vesting", { account: username, vesting_shares } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Withdraw Vesting]', 'color: deeppink', withdrawVesting)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [withdrawVesting], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [withdrawVesting], broadcast: true })
}

/**
 * Delegate HIVE POWER to a user
 * @param { string } delegatee 
 * @param { string } amount 
 */
export const hacDelegation = (delegatee: string, vesting_shares: string): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(delegatee) !== "string") throw new Error("Delegatee must be a string")
  if(typeof(vesting_shares) !== "string") throw new Error("amount must be a string")

  const delegation: DELEGATE_VESTING_SHARES = [ "delegate_vesting_shares", { delegator: username, delegatee, vesting_shares } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Delegation]', 'color: deeppink', delegation)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [delegation], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [delegation], broadcast: true })
}

/**
 * Convert HBD => HIVE or HIVE => HBD
 * @param { string } amount
 * @param { "HIVE"|"HBD" } currency
 */
export const hacConvert = (amount: string, currency: "HIVE"|"HBD"): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(amount) !== "string") throw new Error("amount must be a string")
  //create random number for requestid paramter
  const requestid = Math.floor(Math.random() * 10000000)
  const convert: CONVERT = [ currency === "HBD" ? "convert" : "collateralized_convert", { owner: username, requestid, amount: amount.concat(" ", currency) } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Convert]', 'color: deeppink', convert)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [convert], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [convert], broadcast: true })
}

/*****************************
 * 
 * OPERATIONS WITNESS
 * 
 */

/**
 * Approve/Disapprove a witness
 * @param { string } witness 
 * @param { boolean } approve 
 */
export const hacWitnessVote = (witness: string, approve: boolean): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(witness) !== "string") throw new Error("Witness Error")
  if(typeof(approve) !== "boolean") throw new Error("Approve Error")

  const witnessVote: ACCOUNT_WITNESS_VOTE = [ "account_witness_vote", { account: username, witness, approve } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Vote Witness]', 'color: deeppink', witnessVote)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [witnessVote], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [witnessVote], broadcast: true })
}

/**
 * Set a proxy as Witness
 * @param { string } proxy 
 */
export const hacWitnessProxy = (proxy: string): void => {
  if(typeof(username) !== "string") throw new Error("No user connected yet")
  if(typeof(proxy) !== "string") throw new Error("Proxy Error")

  const witnessProxy: ACCOUNT_WITNESS_PROXY = [ "account_witness_proxy", { account: username, proxy } ]
  if(sessionStorage.getItem("hasmode"))  console.log('%c[HAC Witness Proxy]', 'color: deeppink', witnessProxy)
  /** Keychain */
  if(hacModule === "keychain") keychainBroadcast(username, [witnessProxy], "Active", keychainDelay)
  /** HAS */
  if(hacModule === "has") sendSignReq(username, { key_type: "active", ops: [witnessProxy], broadcast: true })
}

export { hasGetConnectionStatus } from "./has"
export {
  HAC_PREVIOUS_CONNECTION,
  HAC_KEYCHAIN_STATUS,
  HAC_MSG_QR_CODE,
  HAC_MSG_AUTHENTICATION,
  HAC_MSG_SIGN_WAIT,
  HAC_MSG_TX_RESULT
} from './helpers/hac'