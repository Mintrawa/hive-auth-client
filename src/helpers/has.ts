/**
 * HAS TYPES
 */

/** HAS_CONNECTED */
export type HAS_STATUS = {
  status:    "connected"|"disconnected"
  ping_rate: number
  protocol:  number
  server:    string
  socketid:  string
  timeout:   number
  version:   string
}

/** [RECV] CONNECTED_MSG */
export type HAS_CONNECTED_MSG = {
  cmd:       "connected"
  ping_rate: number
  protocol:  number
  server:    string
  socketid:  string
  timeout:   number
  version:   string
}

/** HAC_APP */
export type HAS_APP = {
  name:         string
  description?: string
  icon?:        string
}

/** [SEND] AUTH_REQ */
export type HAS_AUTH_REQ_MSG = {
  cmd:      "auth_req"
  account:  string
  data:     string
  token:    string|undefined
}

export type HAS_AUTH_REQ_DATA = {
  token?: string
  app: HAS_APP
  challenge?: {
    key_type: 'active'|'posting'
    challenge: string
  }|undefined
}

/** [RECV] MESSAGE */
export type HAS_RECV_MSG = {
  cmd: "connected"|"auth_wait"|"auth_nack"|"auth_ack"|"sign_wait"|"sign_ack"|"sign_nack"|"sign_err"
  [index: string]: unknown
}

/** [RECV] AUTH_WAIT_MSG */
export type HAS_AUTH_WAIT_MSG = {
  cmd:     "auth_wait"
  account: string
  uuid:    string
  expire:  number
}

/** [RECV] AUTH_ACK_MSG */
export type HAS_AUTH_ACK_MSG = {
  cmd:     "auth_ack"
  data:    string
  uuid:    string
}

/** DECODED_AUTH_ACK */
export type HAS_DECODED_AUTH_ACK = {
  token:  string
  expire: number
  challenge: {
    challenge: string
    pubkey:    string
  }
}

/** [RECV] AUTH_NACK_MSG */
export type HAS_AUTH_NACK_MSG = {
  cmd: "auth_nack"
  uuid: string
  data: string
}

/** [SEND] SIGN_REQ */
export type HAS_OPERATION = {
  key_type:  string
  ops:       string
  broadcast: boolean
}

export type HAS_SIGN_REQ = { 
  cmd:     "sign_req" 
  account: string
  token:   string
  data:    string
}

/** [RECV] SIGN_WAIT_MSG */
export type HAS_SIGN_WAIT_MSG = {
  cmd:     "sign_wait"
  uuid:    string
  expire:  number
}

/** [RECV] SIGN_ACK_MSG */
export type HAS_SIGN_ACK_MSG = {
  cmd:       "sign_ack"
  uuid:      string
  broadcast: boolean
  data:      object
}

/** [RECV] SIGN_NACK_MSG */
export type HAS_SIGN_NACK_MSG = {
  cmd:       "sign_ack"
  uuid:      string
  data:      object
}

/** [RECV] SIGN_ERR_MSG */
export type HAS_SIGN_ERR_MSG = {
  cmd:       "sign_ack"
  uuid:      string
  error:     string
}