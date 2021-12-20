# Permamail.app

Everything you need to know to get started rnning the projec tlocally.

## Setup

Clone the project from github

```bash
# tell npm to downlad the package dependencies
npm install

# run the app locally on localhost:3000
npm run dev
```

## Developing Locally
If you want to test locally, run `arlocal`to simulate arweave locally.
```bash
npx arlocal --persist
```
Create a few test wallets, I like to use [arweave.app](https://arweave.app) to generate new Arweave wallets and download the jwk files.

Mint some tokens int your wallets so they have the funds to post transactions.

`http://localhost:1984/mint/{walletAddress}/{amountOfWinstons}
`

Edit [arweaveConfig.ts](https://github.com/MyMailProtocol/mail-app/blob/main/src/lib/arweaveConfig.ts#L7-L11) and uncomment the local config (commenting out the live config at the same time)
```code
// const config = {
//     host: "localhost",
//     port: 1984,
//     protocol: "http"
// }
```

> Note: You will need to have sent a transaction locally before another wallet can send a weavemail to your wallet.

Uncomment the [Post Transction](https://github.com/MyMailProtocol/mail-app/blob/main/src/lib/header/Header.svelte#L196) menu item in header.svelt to be able to post a test transaction to `arlocal` to make it possible for other wallets to send a message to your wallet. If you're testing with multiple wallets locally you'll need to do this for each wallet you wish to receive messages.

## Developer environment

Visual Code recommended plugins

* https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
