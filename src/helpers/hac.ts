/* eslint-disable @typescript-eslint/no-explicit-any */

import { HAS_STATUS } from "./has"

/** HAC_MODULE */
export type HAC_MODULE = "has"|"keychain"

/** HAC_STATUS */
export type HAC_STATUS = {
  keychain: boolean,
  has: HAS_STATUS|null
}

/** HAC_PREVIOUS_CONNECTIONS */
export type HAC_PREVIOUS_CONNECTION = {
  account: string
  has?: {
    auth_key:   string
    has_token:  string
    has_expire: number
    has_server: string
  },
  hkc: boolean,
  challenge: {
    value: string
    signature: string
  }
}

/** HAC_KEYCHAIN_STATUS */
export type HAC_KEYCHAIN_STATUS = {
  type: "keychainStatus"
  msg:  "active"|"not installed"
}

/** HAC_MSG_QR_CODE */
export type HAC_MSG_QR_CODE = {
  type: "qr_code"
  msg?:  string
  error?: {
    msg: string
  }
}

/** HAC_MSG_AUTHENTICATION */
export type HAC_MSG_AUTHENTICATION = {
  type: "authentication"
  msg?: {
    status: "authentified"|"rejected"
    data?: {
      challenge:    string
      has_token?:  string
      has_expire?: number
      has_server?: string
    } 
  },
  error?: {
    msg: string
  }
}

/** HAC_MSG_SIGN_WAIT */
export type HAC_MSG_SIGN_WAIT = {
  type: "sign_wait"
  msg?: {
    uuid:    string
    expire:  number
  },
  error?: {
    msg: string
  }
}

/** HAC_MSG_TX_RESULT */
export type HAC_MSG_TX_RESULT = {
  type: "tx_result"
  msg?: {
    status:     "accepted"|"rejected"|"signature"|"error"
    uuid?:      string
    broadcast?: boolean
    data?:      unknown
  },
  error?: {
    msg: string
  }
}

export type HAC_MESSAGE = 
  |HAC_KEYCHAIN_STATUS
  |HAC_MSG_QR_CODE
  |HAC_MSG_AUTHENTICATION
  |HAC_MSG_SIGN_WAIT
  |HAC_MSG_TX_RESULT
