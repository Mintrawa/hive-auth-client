# Hive Authentication Client (HAC)

Hive Authentication Client (HAC) is a password less users authentication, sign and broadcast transactions for the [HIVE Blockchain](https://hive.io/) through the [Hive Authentication Services (HAS)](https://docs.hiveauth.com/) or [Hive Keychain Browser Extension (KBE)](https://github.com/stoodkev/hive-keychain). 

Authentications and transactions are performed by the wallet supporting the HAS protocol or the Hive Keychain Browser Extension without communicating the private key, which thus remains secure. The results of each operation are sent by subscription (RxJS).

Hive Authentication Client (HAC) manages previous connections as well through encrypted data in the localStorage. 

**Hive Authentication Services (HAS)**

Manage the WebSocket connection to the HAS and all communication with it. Support reconnection to another HAS WebSocket server in case of failure.

**Hive Keychain Browser Extension  (KBE)**

Manage the communication with the Hive Keychain Browser Extension  if present

## Getting Started

### Installation

#### Using npm:

```bash
$  npm install @mintrawa/hive-auth-client --save
```

#### Using browser:

```html
<script type="module" src="./dist/hive-auth-client.min.js"></script>
```

#### From the source:

clone the repository

```bash
$  git clone https://github.com/Mintrawa/hive-auth-client.git
```

Build for NodeJS/Angular... in `"./lib"` directory

```bash
$  npm run build
```

Build for browser (minified) in `"./dist"` directory

```bash
$  npm run build-browser
```

## Initialisation

Initialise the Hive Authentication Client with **params**

```ts
import { HiveAuthClient } from "@mintrawa/hive-auth-client"

/** Init the Hive Authentication Client */
HiveAuthClient(["HAS server"], { debug: true })
```

or without **params** just

```ts
import { HiveAuthClient } from "@mintrawa/hive-auth-client"

/** Init the Hive Authentication Client */
HiveAuthClient()
```

**Params**
- `has` (optional): array of HAS server (default: ["wss://hive-auth.arcange.eu"])
- `options` (optional):
    - `debug` (boolean): if true activate console.log (default: false)
    - `delay` (number): delay in ms before to check the avaibility of Hive Keychain (default: 200)

*On Angular app a `delay` is needed before the avaibility of a browser extension*

## Hive Authentication Client Message subscription

All returns of information from ***HAC***, ***HAS*** or ***KBE*** are managed by RxJS messages subscription.

### hacMsg.subscribe()

Use of RxJS to send the result of user authentication and transaction signing and broadcasting.

#### Usage

```ts
import { hacMsg } from "@mintrawa/hive-auth-client"

/** Subscribe results */
hacMsg.subscribe({
  next: async message => {
    ...
  },
  error: error => {
    ...
  }
})
```

#### message

```ts
{
  "type": string
  "msg"?: {
    "result": {
      ...
    } 
  },
  "error"?: {
    "msg": string
  }
}
```

## Functions

### Main

#### hacGetConnectionStatus()

Retrieve the status of keychain and the connection status to the Hive Authentication Services (HAS)

##### Usage

```ts
import { hacGetConnectionStatus } from "@mintrawa/hive-auth-client"

/** [HAS] Get the status of the connection */
hacGetConnectionStatus()
```

##### Result
```ts
{
  "keychain": boolean
  "has": {
    "status": "connected"|"disconnected"
    "ping_rate": number
    "protocol": number
    "server": string
    "socketid": string
    "timeout": number
    "version": string
  }
}
```

#### hacGetAccounts()

Get the array of all account known for this browser or of one specific account if specified

##### Params
- `account` (optional): HIVE username to retrieve
- `pwd` (optional): password to decrypt the data if it's the first call

##### Usage

```ts
import { hacGetAccounts } from "@mintrawa/hive-auth-client"

/**
 * [HAC] Get all or one specific connection info
 * @param { string } [account] - Account to retrieve
 * @param { string } [pwd] - Password to use to decrypt localStorage
 * @returns HAC_PREVIOUS_CONNECTION[]
 */
hacGetAccounts()
```

##### Result
```ts
[{
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
}]
```

#### hacRemoveAccount()

Remove an account from the storage

##### Params

- account: HIVE username to remove 

##### Usage

```ts
import { hacRemoveAccount } from "@mintrawa/hive-auth-client"

/**
 * [HAC] Remove an account
 * @param { string } account 
 * @returns boolean
 */
hacRemoveAccount(mintrawa)
```

Return `true` or `false`

#### hacCheckPwd()

Check the validity of the string password used to encrypt the localStorage

##### Params
 
- pwd: string to encrypt the localStorage

##### Usage

```ts
import { hacCheckPwd } from "@mintrawa/hive-auth-client"

/**
 * [HAC] Check password
 * @param { string } pwd
 * @returns boolean
 */
hacCheckPwd(mintrawa)
```

Return `true` or `false`

#### hacUserAuth()

Authentication of the HIVE user through the HAS or KBE

##### Params
- `account`: HIVE username to connect
- `app`: HAS_APP<sup>*</sup> information
- `pwd`: string to encrypt the localStorage
- `challenge`: object with private `key_type` ("active"|"posting") to use and string to sign
- `m` (optional): module to use "has"|"keychain" (default: "has")

HAS_APP<sup>*</sup> need to be on the form of:
```
{
  "name": string = short name of the app (ex: "peakd")
  "description"?: string = description of the app (ex: "Peakd for Hive"),
  "icon"?: string = URL to retrieve the application icon (ex: "https://peakd.com/logo.png")
}
```

##### Usage

```ts
import { hacUserAuth } from "@mintrawa/hive-auth-client"

/**
 * HAC User Authentication
 * @param { string }     account - Hive username to connect
 * @param { HAS_APP }    app - App
 * @param { string }     pwd - Password to use to encrypt localStorage
 * @param { string }     challenge - String to sign with Hive User private key 
 * @param { HAC_MODULE } [m] - Module to use (has, keychain)
 * @returns void
 */
hacUserAuth("mintrawa", { name: 'HACtutorial' }, "MyPa$$w0rd", { key_type: 'active', value: "MyCha11en6e" })
```

##### Result through subscription (RxJS)
```ts
{
  type: "authentication"
  msg?: {
    status: "authentified"|"rejected"
    data?: {
      challenge:   string
      has_token?:  string
      has_expire?: number
      has_server?: string
    } 
  },
  error?: {
    msg: string
  }
}
```

### Operations

#### hacManualTransaction()

Send a Manual Transaction

##### Params
- `key_type`: "owner"|"active"|"posting"|"memo"
- `op`: Operation recognize by the HIVE Blockchain, more info: [Hive Developer Portal](https://developers.hive.io/apidefinitions/#apidefinitions-broadcast-ops)

##### Usage

```ts
import { hacManualTransaction } from "@mintrawa/hive-auth-client"

/**
 * HAC Send a Manual Transaction
 * @param { "owner"|"active"|"posting" } key_type 
 * @param { OPERATION } op 
 */
hacManualTransaction("active", [ "claim_account", { fee: "0.000 HIVE", creator: "mintrawa", extensions: [] } ])
```

##### Result through subscription (RxJS)
```ts
{
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
```

### Operations specifics

In order to save time on the learning curve of the HIVE blockchain, some operations exist in short version

- hacFollowing(following: string, follow: boolean)
- hacVote(author: string, permlink: string, weight: number)
- hacTransfer(to: string, amount: string, currency: "HIVE"|"HBD", memo: string)
- hacTransferToVesting(to: string, amount: string)
- hacWithdrawVesting(vesting_shares: string)
- hacDelegation(delegatee: string, vesting_shares: string)
- hacConvert(amount: string, currency: "HIVE"|"HBD")
- hacWitnessVote(witness: string, approve: boolean)
- hacWitnessProxy(proxy: string)

## Examples

https://stackblitz.com/edit/angular-ivy-ew73hs

https://github.com/Mintrawa/hac-tutorial

## Contributing

Pull requests for new features, bug fixes, and suggestions are welcome!

## License

Copyright (C) 2021  @mintrawa (https://hive.blog/@mintrawa)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.