<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { getFormattedTime, getExpireLabel } from "$lib/formattedTime";
  import { sentMessage } from "$lib/routedEventStore";
  import { keyStore } from "$lib/keyStore";
  import WalletPicker from "/src/components/WalletPicker.svelte";
  import Arweave from "arweave";
  import webWallet from "$lib/webWallet";
  import {
    getWeavemailTransactions,
    decryptMail,
    getPrivateKey,
    getWalletName,
    getThreadId,
    InboxThread,
  } from "$lib/myMail";
  import type { InboxItem } from "$lib/myMail";
  import { bufferTob64 } from "$lib/myMail";
  import config from "$lib/arweaveConfig";
import { debug } from "svelte/internal";

  // Used for testing a cold start
  // $keyStore.keys = null;
  // $keyStore.gatewayUrl = '';
  // $keyStore.weaveMailInboxItems = [];
  // $keyStore.emailInboxItems = [];
  // $keyStore.inboxItems = [];
  // $keyStore.isLoggedIn = false;

  let promise = Promise.resolve($keyStore.inboxThreads);
  let isLoadingMessages: boolean = false;
  let gatewayUrl: string = '';

  let wallet: any = null;
  const arweave: any = Arweave.init(config);

  let { keys, isLoggedIn } = $keyStore;
  let _inboxThreads: InboxThread[] = [];
  let welcomeMessage: InboxItem;

  /**
   * index.svelte
   * -------------------------------------------------------------------------
   * The MyMail inbox view is composed of InboxThreads. Every item in the view
   * is an InboxThread regardless of how many messages may be in it. Each
   * individual message is called an InboxItem. Every InboxThread has at least
   * one or more InboxItems.
   *
   * Clicking an InboxThread takes us to viewThread.svelte where the
   * InboxItem(s) contained by the InboxThread are displayed.
   *
   */

  const unsubscribe = keyStore.subscribe((store: any) => {
    console.log(`subscribe changed ${isLoggedIn} ${store.isLoggedIn}`);
    if (isLoggedIn !== store.isLoggedIn) {
      isLoggedIn = store.isLoggedIn;
      if ($keyStore.weaveMailInboxThreads.length === 0 && !isLoadingMessages) {
        pageStartupLogic();
        //getLatestVersionTxid(arweave);
      }
    } else if (keys !== store.keys) {
      keys = store.keys;
      if (keys === null) {
        $keyStore.inboxThreads = [];
      } else {
        isLoggedIn = true;
        $keyStore.isLoggedIn = true;
        console.log(`isLoadingMessages: ${isLoadingMessages}`);
        if ($keyStore.weaveMailInboxThreads.length === 0 && !isLoadingMessages) {
          pageStartupLogic();
        }
      }
    }
  });

  /**
   * Triggers the "Sent Message" capsuel to fade out at the top of the inbox.
   */
  function fadeOutFlash(): void {
    $sentMessage = false;
  }

  /**
   * OnMount gets called every time we return to the index
   */
  onMount(async () => {
    if ($sentMessage) {
      fadeOutFlash();
    }
    pageStartupLogic();
  });

  onDestroy(unsubscribe);

  /**
   * Takes a list of InboxItems loaded from arweave and merges them into the
   * inbox. This is a bit of a misnomer however because in re-writing this
   * several times, the merging behavior was lost. Now it just replaces the
   * existing inbox threads.
   * @param newItems An array of inbox items to bundle into threads
   */
  async function mergeInboxItems(
    newItems: InboxItem[],
  ) {
    // Get the most recent timestamp from existing threads
    let mostRecentTimestamp: number = localStorage.mostRecentTimestamp
      ? parseInt(localStorage.mostRecentTimestamp, 10)
      : 0;

    const unreadThreads: Record<string, boolean> = {};
    for (let i: number = 0; i < _inboxThreads.length; i += 1) {
      const thread: InboxThread = _inboxThreads[i];
      if (thread.timestamp > mostRecentTimestamp && thread.isSeen) {
        mostRecentTimestamp = thread.timestamp;
      }

      unreadThreads[thread.id] = !thread.isSeen;
    }

    const inboxThreads: Record<string, InboxItem[]> = {};
    const threadOwners: Record<string, string> = {};
    for (let j: number = 0; j < newItems.length; j += 1) {
      const newItem: InboxItem = newItems[j];
      if (!inboxThreads[newItem.threadId]) {
        // Create a new thread for the item if there isn't one already
        inboxThreads[newItem.threadId] = [newItem];
        threadOwners[newItem.fromAddress] = newItem.threadId;
      } else {
        // Insert the item chronologically into a the existing thread
        const items: InboxItem[] = inboxThreads[newItem.threadId];
        let insertIndex: number = 0;
        if (newItem.timestamp > items[0].timestamp) {
          insertIndex = items.length - 1;
          // Naieve loop, change if it becomes a performance bottleneck
          for (let k: number = 0; k < items.length - 1; k += 1) {
            const item: InboxItem = items[k];
            const nextItem: InboxItem = items[k + 1];
            if (item.timestamp < newItem.timestamp
              && nextItem.timestamp > newItem.timestamp) {
              insertIndex = k;
            }
          }
        }
        items.splice(insertIndex, 0, newItem);
      }
    }

    const threads: InboxThread[] = [];

    // Create InboxThread instances from the collection of InboxItem arrays
    await Promise.all(
      Object.keys(inboxThreads).map(async (threadId: string, index: number) => {
        const items: InboxItem[] = inboxThreads[threadId];
        const newThread: InboxThread = new InboxThread();
        await newThread.init(items[0]);
        for (let i: number = 1; i < items.length; i += 1) {
          newThread.addItem(items[i]);
        }
        // Override the last items recent flag so it expands its message body in the thread view
        newThread.items[newThread.items.length - 1].isRecent = true;
        threads.push(newThread);

        if (newThread.timestamp > mostRecentTimestamp
            && mostRecentTimestamp > 0
        ) {
          newThread.isSeen = false;
        }

        if (unreadThreads[newThread.id]) {
          newThread.isSeen = false;
        }

        // Brute force logic for controlling the isSeen flag on the welcome item
        if (welcomeMessage
            && newThread.items[0].threadId === welcomeMessage.threadId
            && newThread.items.length === 1) {
          if (localStorage.getItem('welcomeMessageSeen') !== null) {
            newThread.isSeen = true;
          } else {
            newThread.isSeen = false;
          }
        }
      })
    ).then(() => {
      threads.sort((a, b) => {
        if (a.isSeen !== b.isSeen) {
          if (a.isSeen === false) {
            return -1;
          }
          return 1;
        }
        return b.timestamp - a.timestamp;
      });
      _inboxThreads = threads;
      $keyStore.inboxThreads = _inboxThreads;
      let isInboxZero: boolean = true;

      // Only set the mostRecentTimestamp if all the messages are read
      for (let i: number = 0; i < _inboxThreads.length; i += 1) {
        if (_inboxThreads[i].isSeen === false) {
          isInboxZero = false;
          break;
        }
      }
      if (isInboxZero) {
        localStorage.mostRecentTimestamp = mostRecentTimestamp.toString();
      }
    });
  }

  /**
   * Takes the threadId that's derived from the subject line and combines it
   * with the sender address, then SHA-256 hashs it again to generate a unique
   * but still deterministic thread id. NOTE-This will all have to change when
   * sending a message to multiple contacts is possible.
   * @param inboxItem The item/message for which a unique threadId is desired
   */
  async function getUniqueThreadId(
    inboxItem: InboxItem,
  ) {
    const threadId: string = await getThreadId(inboxItem);

    // create a sha-256 hash of the threadId + the sender wallet address
    const encoder: TextEncoder = new TextEncoder();
    const data: Uint8Array = encoder.encode(threadId + inboxItem.fromAddress);
    const hashBuffer: ArrayBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray: Uint8Array = new Uint8Array(hashBuffer); // convert buffer to byte array
    const b64UrlHash: string = bufferTob64(hashArray);
    return b64UrlHash;
  }

  /**
   * Retrieves the wallet address active for the the app. Handles getting the
   * address from jwk or ArConnect.
   * @param wallet jwk object if used
   */
  async function getActiveAddress(
    wallet?: any,
  ): Promise<string> {
    if (wallet !== null) {
      return await arweave.wallets.jwkToAddress(wallet);
    }
    if ($keyStore.isLoggedIn) {
      if (webWallet.connected) {
        return webWallet.address;
      } else {
        return await window.arweaveWallet.getActiveAddress();
      }
    }
    return null;
  }

  /**
   * Decrypts the message assocaited with a specific txid, uses the jwk wallet
   * or ArConnect to accomplish the decryption task
   * @param txid
   * @param wallet
   */
   async function getMessageJSON(txid: string, wallet?): Promise<any> {
    let data = await arweave.transactions.getData(txid);
    if (wallet != null) {
      let key = await getPrivateKey(wallet);
      console.log(txid);
      let decryptString = await arweave.utils.bufferToString(
        await decryptMail(arweave, arweave.utils.b64UrlToBuffer(data), key)
      );
      let mailParse = JSON.parse(decryptString);
      return mailParse;
    } else if (webWallet.connected) {
      let encryptedData = arweave.utils.b64UrlToBuffer(data);
      // Split up the transaction data into the correct parts
      const symmetricKeyBytes = new Uint8Array(encryptedData.slice(0, 512));
      const mailBytes = new Uint8Array(encryptedData.slice(512));

      // Decrypt the symmetric key from the first part
      const symmetricKey = await webWallet.decrypt(symmetricKeyBytes, { name: 'RSA-OAEP' } );

      // Use the symmetric key to decrypt the mail from the last part
      let decryptString = arweave.utils.bufferToString(
        await arweave.crypto.decrypt(mailBytes, symmetricKey)
      );
      let mailParse = JSON.parse(decryptString);
      return mailParse;
    } else {
      let decryptString = await window.arweaveWallet.decrypt(
        arweave.utils.b64UrlToBuffer(data),
        { algorithm: "RSA-OAEP", hash: "SHA-256" }
      );
      let mailParse = JSON.parse(decryptString);
      return mailParse;
    }
  }

  /**
   * Hander for any time an InboxThread is clicked in the inbox
   * @param inboxThread The clicked thread
   */
  function handleInboxThreadClick(
    inboxThread: InboxThread,
  ): void {
    // If we're selecting some text on the page, give the user the chance to copy it before opening the item
    // until we have contact managment, this ends up being the best way to copy a sender address
    const selection = window.getSelection();
    if (selection.toString()) {
      return;
    }

    inboxThread.isSeen = true;
    _inboxThreads.sort((a: InboxThread, b: InboxThread) => {
      if (a.isSeen !== b.isSeen) {
        if (a.isSeen === false) {
          return -1;
        }
        return 1;
      }
      return b.timestamp - a.timestamp;
    });

    // More brute force client side welcome message logic, sorry!
    // All this goes away with inbox nodes
    if (welcomeMessage
        && inboxThread.items.length === 1
        && inboxThread.items[0].threadId === welcomeMessage.threadId) {
      localStorage.welcomeMessageSeen = true;
    }

    localStorage.inboxThread = JSON.stringify(inboxThread);
    goto('message/viewThread');
  }

    /**
   * Gets a list of weavemail transactions from arweave based on the active
   * wallet address. Then converts them into an array of InboxItems. These get
   * fed into `mergeInboxItems()` where InboxTheads get created for each item
   * and items that belong to the same conversation are merged into a  single
   * thread. Also this message inserts a welcome message for new users if needed.
   */
  async function getWeavemailItems(): Promise<InboxItem[]> {
    const address: string = await getActiveAddress(wallet);
    const json: any = await getWeavemailTransactions(arweave, address);
    console.log(`${json.data.transactions.edges.length} to resolve`);

    const weaveMailInboxItems: InboxItem[] = await Promise.all<InboxItem>(
      json.data.transactions.edges.map(async (edge: any, i: number) => {
        const txid = edge.node.id;
        const transaction = await arweave.transactions.get(txid).catch((err) => {
          console.log(`No Transaction found ${txid} - ${err}`);
        });

        if (!transaction) {
          console.log('RETURNING NULL');
          return null;
        }

        let timestamp: number = 0;
        let appVersion: string = '';

        // Parse timestamp info from the transaction
        transaction.get('tags').forEach((tag) => {
          const key = tag.get('name', { decode: true, string: true });
          const value = tag.get('value', {
            decode: true,
            string: true,
          });
          if (key === 'Unix-Time') {
            timestamp = parseInt(value, 10) * 1000;
          }
          if (key === 'App-Version') {
            appVersion = value;
          }
        });

        const fromAddress = await arweave.wallets.ownerToAddress(
          transaction.owner,
        );
        const fromName: any = await getWalletName(arweave, fromAddress);
        const fee: any = arweave.ar.winstonToAr(transaction.reward);
        const amount: any = arweave.ar.winstonToAr(transaction.quantity);

        console.log(`requesting decryption ${txid}`);
        const mailParse: any = await getMessageJSON(txid, wallet);
        const subject: string = mailParse.subject || '';

        const inboxItem: InboxItem = {
          toAddress: '',
          toName: 'You',
          fromName: `${fromName}`,
          fromAddress: `${fromAddress}`,
          date: '',
          subject,
          threadId: '',
          id: 0,
          isFlagged: false,
          isRecent: false,
          isSeen: true,
          fee: 0,
          amount: 0,
          contentType: 'weavemail',
          timestamp,
          body: mailParse.body,
          txid,
          appVersion: '',
        };

        inboxItem.threadId = await getUniqueThreadId(inboxItem);

        // console.log(inboxItem);

        return inboxItem;
      })
    );

    const result: InboxItem[] = [];
    weaveMailInboxItems.forEach((item: InboxItem) => {
      if (item) {
        result.push(item);
      }
    });

    if (result.length === 0) {
      // Welcome message
      const welcomeItem: InboxItem = {
        toAddress: '',
        toName: 'You',
        fromName: 'DMac',
        fromAddress: '89tR0-C1m3_sCWCoVCChg4gFYKdiH5_ZDyZpdJ2DDRw',
        date: '',
        subject: 'Welcome to the Permaweb🐘!',
        threadId: '',
        id: 0,
        isFlagged: false,
        isRecent: false,
        isSeen: true,
        fee: 0,
        amount: 0,
        contentType: 'weavemail',
        timestamp: Math.round(new Date().getTime() / 1000),
        body: `
We're glad you're here 🎉
</br></br>
The app you're using now can never be removed, taken down, it's deployed forever on the permaweb🐘.
</br></br>
It's very early and we have big plans to develop this project to have full email funciontality and alongside encrypted onchain messages.
</br></br>
While we can't change this version of the app we can publish new versions with new features⚡️. If you like the new features you can choose to use that version instead.
This is the power of apps on the permaweb🐘, you are in control💪.
</br></br>
If you like what you see and are curious to learn more, <u>reply to this message</u> and const us know how you found us. We'll send you links to our community where you can learn more about our roadmap and share your on ideas for features you'd like to see.
</br></br>
Thanks for checking out our project 💌
</br>
&nbsp;&nbsp;-DMac
`,
        txid: 'txid',
        appVersion: '',
      };

      welcomeItem.threadId = await getUniqueThreadId(welcomeItem);
      welcomeMessage = welcomeItem;
      result.push(welcomeItem);
    }

    // console.log(result);
    return result;
  }

  /**
   * Button click hander for "New Message" button
   */
  function handleNewMessageClick(): void {
    goto('message/write');
  }

  /**
   * Detects logout and logen status and performs inbox item loading. If it's
   * the first time and there are no cached inbox threads, it uses a promise
   * to trigger the "Waiting..." text. Otherwise it performs a background
   * loading operation.
   */
  function pageStartupLogic(): void {
    if ($keyStore.keys !== null) {
      wallet = JSON.parse($keyStore.keys);
      console.log(`wallet is ${wallet}`);
    } else if ($keyStore.isLoggedIn) {
      wallet = null;
    } else {
      console.log('logged out');
      _inboxThreads = [];
      return;
    }

    console.log(`webWaller:`);
    console.log(webWallet);

    // Make sure we have a wallet initialized
    console.log('Wallet loaded');

    if (!$keyStore.inboxThreads || $keyStore.inboxThreads.length === 0) {
      isLoadingMessages = true;
      console.log('start loading messages');
      // We don't have any mailItems, use the loading promise to show "Waiting..."
      promise = getWeavemailItems().then(async (weaveMailItems) => {
        await mergeInboxItems(weaveMailItems);
        console.log('weavemail items loaded async at STARTUP');
        isLoadingMessages = false;
        $keyStore.weaveMailInboxThreads = _inboxThreads;
        return _inboxThreads;
      });
    } else {
      _inboxThreads = $keyStore.inboxThreads;
      promise = Promise.resolve(_inboxThreads);
      // Don't use the loading promise here, we want to load these in the background.
      getWeavemailItems().then(async (weaveMailItems) => {
        await mergeInboxItems(<InboxItem[]>weaveMailItems);
        if ($keyStore.isLoggedIn) {
          $keyStore.weaveMailInboxThreads = _inboxThreads;
          console.log('weavemail items BACKGROUND loaded async');
        }
      });
    }
  }

  /**
   * Once the KeyDropper signals that we are logged in, kick off the pages
   * startup logic.
   */
  function onLogin(): void {
    _inboxThreads = [];
    promise = null;
    $keyStore.isLoggedIn = true;
    pageStartupLogic();
  }
</script>

<svelte:head>
  <title>Inbox</title>
</svelte:head>
<section>
  {#if $keyStore.isLoggedIn == false}
    <WalletPicker on:login={onLogin} />
  {:else}
    {#if $sentMessage}
      <div out:fade={{ delay: 1300, duration: 400 }} class="flashRow">
        <span class="flash">Message Sent</span>
      </div>
    {/if}
    {#await promise}
      <p>...waiting</p>
    {:then number}
      <div class="container">
        <div class="header">
          <h1>Inbox</h1>
          <div class="actions">
            <div on:click={handleNewMessageClick}>New Message</div>
          </div>
        </div>
        {#each _inboxThreads as item, i}
          {#if i === 0 && !item.isSeen}
            <article>
              <div class="unseen"><span>NEW FOR YOU</span></div>
            </article>
          {/if}
          {#if gatewayUrl !== undefined && item.isSeen && (i === 0 || !_inboxThreads[i - 1].isSeen)}
            <article><div class="previous">PREVIOUSLY SEEN</div></article>
          {/if}
          <article>
            <div
              class="inboxItem"
              on:click={() => handleInboxThreadClick(item)}
              class:seen={item.isSeen}
            >
              <div class="itemContainer">
                <div class="left">
                  <span class:status={item.isSeen === false} />
                  <img src="img_avatar.png" alt="ProfileImage" class="avatar" />
                </div>
                <div class="center">
                  <span class="subject">
                    {#if item.subject}{item.subject}{:else}No subject{/if}
                  </span>
                  <div
                    class="byline"
                    class:myMail={item.contentType === 'weavemail'}
                  >
                    {item.items[0].fromName} &lt;{item.items[0].fromAddress}&gt;
                  </div>
                </div>
                <div class="right">
                  {getFormattedTime(item.timestamp)}
                  <div class="expires">
                    {#if item.contentType === 'weavemail'}
                      <img
                        class="infinity"
                        alt="infinity"
                        src="infinity3.svg"
                      />
                    {:else}
                      expires in {getExpireLabel(item.timestamp, 90)}
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </article>
        {/each}
      </div>
    {:catch error}
      <p style="color: red">{error.message}</p>
    {/await}
  {/if}
</section>

<style>
  section {
    border: 0;
    padding: 0;
    position: relative;
  }
  .flashRow {
    width: 100%;
    text-align: center;
    align-content: center;
    font-size: var(--font-size-medium);
    position: absolute;
    top: -1rem;
    z-index: 25;
  }
  .flash {
    background: rgba(var(--rgb-almost-white), 0.5);
    border-radius: 3rem;
    padding: 0.5rem 1rem;
  }
  .container {
    display: flex;
    font-size: var(--font-size-medium);
    flex-direction: column;
    align-items: center;
    background: var(--color-bg--sheet);
    box-shadow: 0 0 3rem var(--color-almost-black);
    min-height: calc(100vh);
    margin-bottom: 0;
    border-radius: 1.5em;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    color: var(--color-text);
    margin-left: 3rem;
    margin-right: 3rem;
  }

  article {
    width: 100%;
    /* --sheet-padding: 2em;
		padding-left: var(--sheet-padding);
		padding-right: var(--sheet-padding);
		margin-left: calc(var(--sheet-padding) * -1);
		margin-right: calc(var(--sheet-padding) * -1); */
    display: block;
    position: relative;
    box-sizing: border-box;
    order: 1;
  }

  .previous {
    background-color: var(--color-bg--main-thin);
    font-weight: bold;
    font-size: var(--font-size-x-small);
    line-height: 1.3em;
    padding: 1.5rem 1rem 1rem 4rem;
  }

  .unseen {
    position: relative;
    z-index: 2;
    margin-right: 4rem;
    margin-bottom: 1rem;
  }

  .unseen:before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    z-index: -1;
    background: linear-gradient(
      135deg,
      var(--color-secondary) 0%,
      var(--color-tertiary) 100%
    );
  }

  .unseen span {
    background: var(--color-bg--sheet);
    font-weight: bold;
    font-size: var(--font-size-x-small);
    line-height: 1.3em;
    padding: 0rem 1rem 0rem 4rem;
  }

  .header {
    position: relative;
    color: var(--color-text);
    width: 100%;
    height: 3em;
    line-height: 5em;
    text-align: center;
    margin-top: 2rem;
  }

  .header h1 {
    font-weight: bolder;
    margin: 0;
    font-size: var(--font-size-xx-large);
    line-height: 1;
    box-sizing: border-box;
  }

  .header .actions {
    font-weight: normal;
    position: absolute;
    display: flex;
    font-size: var(--font-size-small);
    line-height: 1.4;
    cursor: pointer;
    top: -1rem !important;
    right: 1rem !important;
  }

  .actions div {
    border: 1px solid;
    margin: 0;
    padding: 0.3em 0.8em;
    font-weight: 500;
    text-decoration: none;
    border-radius: 3rem;
    white-space: nowrap;
    background-color: transparent;
    border-color: var(--color-tertiary);
    color: var(--color-tertiary);
    padding-left: 2.2em;
    position: relative;
  }

  .actions div::before {
    content: " ";
    width: 1em;
    height: 1em;
    position: absolute;
    left: 0.75em;
    top: 50%;
    color: var(--color-tertiary);
    z-index: 10;
    margin-top: -0.5em;
    background: center / 1em no-repeat;
    background-image: url("/src/lib/header/plus.svg");
    filter: invert(46%) sepia(49%) saturate(835%) hue-rotate(204deg)
      brightness(100%) contrast(114%);
  }

  .avatar {
    width: 2.25em;
    height: 2.25em;
    border-radius: 100%;
    z-index: 1;
    display: block;
    position: relative;
    color: transparent;
    background-color: var(--color-bg--surface-glint-opaque);
    margin-top: 0.5rem;
  }

  .inboxItem {
    display: flex;
    /* justify-content: flex-start; */
    max-width: 1200px;
    height: 3.25em;
    vertical-align: middle;
    cursor: pointer;
    padding-left: 2em;
    padding-right: 2em;
  }

  .seen {
    background-color: var(--color-bg--main-thin);
  }

  .itemContainer {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    max-width: 1200px;
    height: 3.25em;
    vertical-align: middle;
    cursor: pointer;
    /* margin-left: 2em; */
  }

  .itemContainer:hover {
    --color-bg--secondary-glint: rgba(var(--rgb-blue), 0.05);
    background: var(--color-bg--secondary-glint) !important;
  }

  .inboxItem .left {
    flex: 0 auto;
    padding: 0 0.5rem 0 1rem;
  }

  .status {
    position: relative;
    height: 1px;
    width: 1px;
    clip: rect(1px, 1px, 1px, 1px);
    overflow: hidden;
    text-transform: none;
    white-space: nowrap;
    --sheet-padding: 2em;
  }

  .status:before {
    display: block;
    filter: invert(59%) sepia(94%) saturate(2285%) hue-rotate(358deg)
      brightness(100%) contrast(103%);
    content: " ";
    position: absolute;
    top: 1.3em;
    left: -0.7em;
    width: 0.5em;
    height: 0.5em;
    background: url("/static/unread.svg") center/100% no-repeat;
    /* background-image: url("/src/lib/header/back-icon.svg"); */
  }

  .inboxItem .center {
    justify-content: flex-start;
    width: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    display: block;
    padding: 0.9rem 1em 0.3rem 0;
    max-width: calc(100% - 7rem);
  }

  .inboxItem .right {
    padding-top: 1.5rem;
    padding-right: 1rem;
    color: var(--color-text--subtle);
    font-size: var(--font-size-x-small);
    white-space: nowrap;
    text-align: right;
  }

  .inboxItem .expires {
    color: rgb(var(--rgb-dark-gray));
    font-size: var(--font-size-xx-small);
  }

  .subject {
    font-weight: normal;
    font-size: var(--font-size-medium);
    line-height: 1.3em;
  }

  .byline {
    color: var(--color-text--subtle);
    font-size: var(--font-size-x-small);
    margin: 0 !important;
    text-overflow: ellipsis;
    overflow: hidden;
    padding-left: 1.2em;
  }

  .byline:before {
    content: " ";
    width: 1em;
    height: 1em;
    position: absolute;
    color: var(--color-tertiary);
    top: 2.55em;
    left: 7em;
    z-index: 10;
    background: center / 1em no-repeat;
    background-image: url("/static/email.svg");
    /* filter: invert(39%) sepia(91%) saturate(809%) hue-rotate(190deg) brightness(101%) contrast(105%); */
    filter: invert(99%) sepia(70%) saturate(310%) hue-rotate(294deg)
      brightness(65%) contrast(85%);
  }

  .myMail:before {
    content: " ";
    width: 1em;
    height: 1em;
    position: absolute;
    color: var(--color-tertiary);
    top: 35px;
    left: 90px;
    z-index: 10;
    background: center / 1em no-repeat;
    background-image: url("/static/identity2.svg");
    filter: invert(46%) sepia(49%) saturate(835%) hue-rotate(204deg)
      brightness(100%) contrast(114%);
    /* filter: invert(99%) sepia(70%) saturate(310%) hue-rotate(294deg)
			brightness(75%) contrast(85%); */
  }

  .infinity {
    margin-top: 0.3em;
    filter: invert(31%) sepia(2%) saturate(3162%) hue-rotate(197deg)
      brightness(88%) contrast(83%);
    height: 0.7em;
  }
</style>
