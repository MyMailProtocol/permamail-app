import { writable } from 'svelte-local-storage-store'

// First param `keyStore` is the local storage key.
// Second param is the initial value.
export const keyStore = writable('keyStore', {
  keys: null,
  gatewayUrl: '',
  weaveMailInboxThreads: [],
  emailInboxThreads: [],
  inboxThreads: [],
  isLoggedIn: false,
  activeAddress: '',
});
