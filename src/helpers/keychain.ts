export type SIGNATURE = {
  success: boolean
  error:   string
  result:  string
  data: {
    request_id: number
    type:       string
    username:   string
    message:    string
    method:     string
    key:        string
  },
  message:      string
  request_id:   number
  publicKey:    string
}

export type BROADCAST = {
  success: boolean
  error:   string|null
  result:  {
    id:               string
    ref_block_num:    number
    ref_block_prefix: number
    expiration:       string
    operations:       unknown
    extension:        []
    signatures:       string[]
  }|null
  data: {
    request_id: number
    type:       string
    typeWif:    string
    username:   string
    operations: unknown
    method:     string
    key:        string
  },
  message:      string
  request_id:   number
}

export type KEYS = 'Posting'|'Active'|'Memo'