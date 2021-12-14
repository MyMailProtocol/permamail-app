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

Edit [arweaveConfig.ts](https://github.com/MyMailProtocol/mail-app/src/arweaveConfig.ts) and uncomment the local config (commenting out the live config at the same time)
```code
// const config = {
//     host: "localhost",
//     port: 1984,
//     protocol: "http"
// }
```

> Note: You will need to have sent a transaction locally before another wallet can send a weavemail to your wallet.


