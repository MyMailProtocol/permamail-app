// Copyright (C) 2021, MyMail Labs Inc.  Proprietary and Confidential.
// All rights reserved.  Unauthorized copying or use of this file, in whole or in part, using any medium is strictly prohibited.

import { writable } from 'svelte-local-storage-store'

// First param `keyStore` is the local storage key.
// Second param is the initial value.
export const keyStore = writable('keyStore', {
  keys: null,
  gatewayUrl: "",
  weaveMailInboxThreads: [],
  emailInboxThreads: [],
  inboxThreads: [],
  isLoggedIn: false
});