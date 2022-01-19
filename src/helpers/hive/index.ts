/* eslint-disable @typescript-eslint/no-explicit-any */

// import { CUSTOM_JSON } from "./custom_json"

/**
 * 
 * ACCOUNT
 * 
 */

// KEYS => active owner
export type CLAIM_ACCOUNT = [
  "claim_account",
  {
    "fee":        string,
    "creator":    string
    "extensions": []
  }
]

// KEYS => active owner
export type ACCOUNT_UPDATE = [
  "account_update",
  {
    "account": string
    "owner": {
      "weight_threshold": number
      "account_auths":    [[ string, number ]]|[],
      "key_auths":        [[ string, number ]],
    }
    "active": {
      "weight_threshold": number
      "account_auths":    [[ string, number ]]|[],
      "key_auths":        [[ string, number ]],
    }
    "posting": {
      "weight_threshold": number
      "account_auths":    [[ string, number ]]|[],
      "key_auths":        [[ string, number ]],
    }
    "memo_key":      string
    "json_metadata": string
    "extensions":    [],
  }
]

// KEYS => posting active owner
export type ACCOUNT_UPDATE2 = [
  "account_update2",
  {
    "account":               string
    "posting_json_metadata": string
    "json_metadata": ""
    "extensions":    []
  }
]

/**
 * 
 * COMMENT
 * 
 */

// KEYS => posting active owner
export type COMMENT = [
  "comment",
  {
    "author":          string
    "title":           string
    "body":            string
    "parent_author":   string
    "parent_permlink": string
    "permlink":        string
    "json_metadata":   string
  }
]

// KEYS => posting active owner
export type DELETE_COMMENT = [
  "delete_comment",
  {
    "author":   string
    "permlink": string
  }
]

// KEYS => posting active owner
export type VOTE = [
  "vote",
  {
    "voter":     string
    "author":    string
    "permlink":  string
    "weight":    number
  }
]

/**
 * 
 * WALLET
 * 
 */

// KEYS => active owner
export type TRANSFER = [
  "transfer",
  {
    "from":   string
    "to":     string
    "amount": string
    "memo":   string
  }
]

// KEYS => active owner
export type TRANSFER_TO_VESTING = [
  "transfer_to_vesting",
  {
    "from":   string
    "to":     string
    "amount": string
  }
]

// KEYS => active owner
export type WITHDRAW_VESTING = [
  "withdraw_vesting",
  {
    "account":        string
    "vesting_shares": string
  }
]

// KEYS => active owner
export type DELEGATE_VESTING_SHARES = [
  "delegate_vesting_shares",
  {
    "delegator": string
    "delegatee": string
    "vesting_shares": string
  }
]

// KEYS => active owner
export type CONVERT = [
  "convert"|"collateralized_convert",
  {
    "owner":     string
    "requestid": number
    "amount":    string
  }
]

/**
 * 
 * WITNESSES
 * 
 */

// KEYS => active owner
export type ACCOUNT_WITNESS_VOTE = [
  "account_witness_vote",
  {
    "account": string
    "witness": string
    "approve": boolean
  }
]

// KEYS => active owner
export type ACCOUNT_WITNESS_PROXY = [
  "account_witness_proxy",
  { "account": string, "proxy": string }
]

// KEYS => signing active owner
export type WITNESS_SET_PROPERTIES = [
  "witness_set_properties",
  {
    "owner": string
    "props": {
      "account_creation_fee":   string
      "account_subsidy_budget": number
      "account_subsidy_decay":  number
      "maximum_block_size":     number
      "hbd_interest_rate":      string
      "hbd_exchange_rate": { "base": string, "quote": string },
      "url":                    string
      "new_signing_key":        string
    },
    "extensions": []
  }
]

// KEYS => active owner
export type WITNESS_UPDATE = [
  "witness_update",
  {
    "owner": string
    "url":   string
    "block_signing_key": string
    "props": {
      "account_creation_fee": {
        "amount":    string
        "precision": number
        "nai":       "@@000000021"
      },
      "maximum_block_size": number
      "hbd_interest_rate":  number
    },
    "fee": {
      "amount":    string
      "precision": number
      "nai":       "@@000000021"
    }
  }
]

export type OPERATION = any
