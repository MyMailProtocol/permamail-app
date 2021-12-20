/* eslint-disable no-console */
import * as B64js from 'base64-js';

export interface InboxItem {
  id: number;
  txid: string;
  toName: string;
  toAddress: string;
  fromName: string;
  fromAddress: string;
  body: string;
  date: string;
  subject: string;
  threadId: string;
  fee: number;
  amount: number;
  isFlagged: boolean;
  isRecent: boolean;
  isSeen: boolean;
  contentType: string;
  appVersion: string;
  timestamp: number;
}

function b64UrlEncode(
  b64UrlString: string,
): string {
  return b64UrlString
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/\=/g, '');
}

export function bufferTob64(
  buffer: Uint8Array,
): string {
  return B64js.fromByteArray(new Uint8Array(buffer));
}

export function bufferTob64Url(
  buffer: Uint8Array,
): string {
  return b64UrlEncode(bufferTob64(buffer));
}

export async function getThreadId(
  inboxItem: InboxItem,
): Promise<string> {
  // if there's no subject line, create a unique string from the sender+timestamp
  const subjectLine: string = inboxItem.subject || inboxItem.fromAddress + inboxItem.timestamp;

  // remove anything in square brackets
  let subject: string = subjectLine.replace(/(\[.*?\])/g, '');

  // remove all words followed by a colon from the beginning of the string
  if (subject.includes(':')) {
    let wordArray: string[] = subject.split(' ');
    while (wordArray[0].endsWith(':')) {
      wordArray = wordArray.slice(1);
    }
    subject = wordArray.join('');
  }

  // remove any remaining whitespace
  subject = subject.replace(/\s/g, '');

  // create a sha-256 hash of the pruned subject line, and b64 encode it
  const encoder: TextEncoder = new TextEncoder();
  const data: Uint8Array = encoder.encode(subject);
  const hashBuffer: ArrayBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray: Uint8Array = new Uint8Array(hashBuffer); // convert buffer to byte array
  const b64UrlHash: string = bufferTob64Url(hashArray);
  return b64UrlHash;
}

export class InboxThread {
  public id: string;

  public items: InboxItem[];

  public timestamp: number;

  public subject: string;

  public contentType: string;

  public isSeen: boolean;

  async init(
    item: InboxItem,
  ) {
    this.id = await getThreadId(item);
    this.subject = item.subject;
    this.items = null;
    this.contentType = item.contentType;
    this.isSeen = true;
    this.addItem(item);
  }

  addItem(
    item: InboxItem,
  ) {
    if (!this.items) {
      this.items = [];
      this.items.push(item);
    } else {
      // insert the item chronologically into a the existing thread
      let insertIndex: number = 0;
      if (item.timestamp > this.items[this.items.length - 1].timestamp) {
        // insert at the end of the item list
        insertIndex = this.items.length;
      } else if (item.timestamp < this.items[0].timestamp) {
        // insert at the beginning of the item list
        insertIndex = 0;
      } else {
        // insert in the middle of the item list
      }

      this.items.splice(insertIndex, 0, item);
    }

    // update properties to make sure they reflect the latest data
    const recentItem: InboxItem = this.items[this.items.length - 1];
    this.timestamp = recentItem.timestamp;
  }
}

/**
 * Decrypts an array of encrypted bytes
 * @param arweave An initialized arweave instance
 * @param encryptedData `Uint8Array` of data to decrypt
 * @param privateKey Decryption key
 * @returns Uint8Array of decrypted bytes
 */
export async function decryptMail(
  arweave: any,
  encryptedData: Uint8Array,
  privateKey: CryptoKey,
): Promise<Uint8Array> {
  // Split up the transaction data into the correct parts
  const symmetricKeyBytes: Uint8Array = new Uint8Array(encryptedData.slice(0, 512));
  const mailBytes: Uint8Array = new Uint8Array(encryptedData.slice(512));

  // Decrypt the symmetric key from the first part
  const symmetricKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    symmetricKeyBytes,
  );

  // Use the symmetric key to decrypt the mail from the last part
  return arweave.crypto.decrypt(mailBytes, symmetricKey);
}

async function generateRandomBytes(
  length: number,
): Promise<Uint8Array> {
  const array: Uint8Array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

export async function encryptMail(
  arweave: any,
  content: string,
  subject: string,
  publicKey: CryptoKey,
): Promise<string> {
  const contentEncoder: TextEncoder = new TextEncoder();
  const newFormat: string = JSON.stringify({ subject, body: content });
  const mailBuffer: Uint8Array = contentEncoder.encode(newFormat);
  const keyBuffer: Uint8Array = await generateRandomBytes(256);

  // Encrypt data segments
  const encryptedMail = await arweave.crypto.encrypt(mailBuffer, keyBuffer);
  const encryptedKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    keyBuffer,
  );

  // Concatenate and return them
  return arweave.utils.concatBuffers([encryptedKey, encryptedMail]);
}

export async function getPrivateKey(wallet: object) {
  const walletCopy: any = Object.create(wallet);
  walletCopy.alg = 'RSA-OAEP-256';
  walletCopy.ext = true;

  const algo: any = {
    name: 'RSA-OAEP',
    hash: {
      name: 'SHA-256',
    },
  };

  return crypto.subtle.importKey('jwk', walletCopy, algo, false, [
    'decrypt',
  ]);
}

export async function getPublicKey(
  arweave: any,
  address: any
) {
  const txid = await arweave.wallets.getLastTransactionID(address);

  if (txid === '') {
    return undefined;
  }

  const tx = await arweave.transactions.get(txid);

  if (tx === undefined) {
    return undefined;
  }

  const keyData = {
    kty: 'RSA',
    e: 'AQAB',
    n: tx.owner,
    alg: 'RSA-OAEP-256',
    ext: true,
  };

  const algo = {
    name: 'RSA-OAEP',
    hash: {
      name: 'SHA-256',
    },
  };

  return crypto.subtle.importKey('jwk', keyData, algo, false, ['encrypt']);
}

export async function getWeavemailTransactions(
  arweave: any,
  address: string
): Promise<any> {
  // TODO: replace with ardb
  const res2 = await arweave.api.post('/graphql', {
    query: `
        {
            transactions(first: 50, recipients: ["${address}"],
                tags: [
                    {
                        name: "App-Name",
                        values: ["permamail"]
                    }
                ]
            ) {
                edges {
                    node {
                        id
                    }
                }
            }
        }`,
  });
  return res2.data;
}

export async function getWalletName(
  arweave,
  address,
) {
  // TODO: replace with ardb
  const res2 = await arweave.api.post('/graphql', {
    query: `
        {
            transactions(owners:["${address}"],
            tags: [
                {
                    name: "App-Name",
                    values: ["arweave-id"]
                },
                {
                    name: "Type",
                    values: ["name"]
                }
            ]
        ) {
            edges {
                node {
                    id
                }
            }
        }
    }`,
  });

  const response = res2.data;

  if (response.data.transactions.edges.length === 0) {
    return 'No name';
  }
  const txid = response.data.transactions.edges[0].node.id;
  const tx = await arweave.transactions.get(txid);
  return tx.get('data', { decode: true, string: true });
}

export async function getLatestVersionTxid(
  arweave,
): Promise<string> {
  console.log(`getLatestVersion: ${window.location.pathname}`);
  console.log(window.location);
  const txid: string = window.location.pathname.split('/')[1];
  console.log(`txid: ${txid}`);
  if (!txid) {
    return '';
  }

  let tx = null;
  try {
    tx = await arweave.transactions.get(txid);
  } catch (err) {
    console.log(err);
  }
  console.log(`transaction: ${tx}`);
  if (!tx) {
    return '';
  }
  const { owner } = tx;
  console.log(`owner: ${owner}`);

  const address = await arweave.wallets.ownerToAddress(owner);
  const queryObject = {
    query:
      `{
            transactions(owners:["${address}"],
                tags: [
                    {
                        name: "Type",
                        values: ["manifest"]
                    }
                ]
            ) {
                edges {
                    node {
                        id
                    }
                }
            }
        }`,
  };
  console.log(queryObject);
  const res2 = await arweave.api.post('/graphql', queryObject);

  const response = res2.data;

  if (response.data.transactions.edges.length === 0) {
    return '';
  }
  const newVersionTxid = response.data.transactions.edges[0].node.id;
  console.log(`LatestVersion: ${newVersionTxid}`);
  if (newVersionTxid === txid) {
    return ''; // if we're on the latest
  }
  return newVersionTxid;
}

export async function submitWeavemail(
  arweave,
  toAddress,
  subject,
  body,
  amount: number,
  wallet,
) {
  let tokens: string = '0';
  if (amount > 0) {
    tokens = arweave.ar.arToWinston(amount.toString());
  }

  const publicKey: CryptoKey = await getPublicKey(arweave, toAddress);
  if (publicKey === undefined) {
    alert('Error: Recipient has to send a transaction to the network, first!');
    return;
  }

  const content: string = await encryptMail(arweave, body, subject, publicKey);

  const tx = await arweave.createTransaction({
    target: toAddress,
    data: arweave.utils.concatBuffers([content]),
    quantity: tokens,
  }, wallet);

  tx.addTag('App-Name', 'permamail'); // Add permamail tag
  tx.addTag('App-Version', '0.0.2'); // Add version tag
  tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000)); // Add Unix timestamp
  tx.addTag('Composed-By', 'MyMail');

  await arweave.transactions.sign(tx, wallet);
  console.log(tx.id);
  await arweave.transactions.post(tx);
}
