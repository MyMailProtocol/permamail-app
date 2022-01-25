import { ArweaveWebWallet } from 'arweave-wallet-connector';
import type { AppInfo } from 'arweave-wallet-connector';

export class MyMailWebWallet extends ArweaveWebWallet {
  state: any;

  constructor(appInfo?: AppInfo, url?: string) {
    super(appInfo, url);
    this.keepPopup = false;
    this.on('connect', (address) => {
      console.log(`connect: ${address}`);
    });
  }
}

let webWallet: MyMailWebWallet;

// This window check prevents vite from trhing to execute this client code for 
// SSR when operating in `npm run dev` mode locally.
// TODO: pull this out into a svelte component so vite doesn't try to SSR it.
if (typeof window != 'undefined') {
  webWallet = new MyMailWebWallet({
    name: 'Weavemail',
    logo: 'https://jfbeats.github.io/ArweaveWalletConnector/placeholder.svg',
  }, 'arweave.app');
}

export default webWallet;

