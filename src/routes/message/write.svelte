<script lang="ts">
  import Arweave from 'arweave';
  import { goto } from '$app/navigation';
  import type { Message } from '$lib/types';
  import { sentMessage } from '$lib/routedEventStore';
  import { keyStore } from '$lib/keyStore';
  import ComposeRow from '/src/components/ComposeRow.svelte';
  import SubmitRow from '/src/components/SubmitRow.svelte';
  import config from '$lib/arweaveConfig';
  import { submitWeavemail } from '$lib/myMail';

  const arweave: any = Arweave.init(config);

  const message: Message = {
    toAddress: '',
    toName: '',
    fromAddress: 'admin@pixelsamurai.com',
    fromName: 'Admin',
    subject: '',
    body: '',
    id: 0,
    fee: 0,
    amount: null,
    txid: '',
    appVersion: '',
    timestamp: 0,
  };

  let isEmail: boolean = false;
  let isSendButtonActive: boolean = false;
  let isSubmitting: boolean = false;

  function submitEmail(): void {
    console.log(message);
    fetch(
      'http://localhost:5000/Mail',
      {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      },
    ).then((response) => response.json())
      .then((data) => {
        console.log(data);
      }).then(() => {
        $sentMessage = true;
        goto('../');
      });
  }

  async function submitWeavemail2(): Promise<void> {
    let address: string = '';
    let wallet: any;
    isSubmitting = true;
    if ($keyStore.keys !== null) {
      wallet = JSON.parse($keyStore.keys);
      address = await arweave.wallets.jwkToAddress(wallet);
    } else {
      wallet = null;
      address = await window.arweaveWallet.getActiveAddress();
    }

    if (address === message.toAddress) {
      alert('"Error: Cannot send mail to yourself"');
      return;
    }

    await submitWeavemail(
      arweave,
      message.toAddress,
      message.subject,
      message.body,
      message.amount,
      wallet,
    ).then(() => {
      $sentMessage = true;
      goto('../');
    });
  }

  function handleSubmit(): void {
    if (isEmail) {
      submitEmail();
    } else {
      console.log('Submit');
      submitWeavemail2();
      isSubmitting = true;
    }
  }
</script>
<svelte:head>
  <title>Write</title>
</svelte:head>
<section>
    <div class="container">
    <div class="header">
      New Message
    </div>
    <article>
    <form on:submit|preventDefault={() => handleSubmit()}>
      <ComposeRow isSubjectUnderlined=true bind:isAddressReady={isSendButtonActive} bind:toAddress={message.toAddress} bind:subject={message.subject}/>
            <div class="messageRow">
                <textarea class="message" bind:value={message.body} placeholder="Type your message..."></textarea>
            </div>
      <SubmitRow bind:isMessageReady={isSendButtonActive} bind:isEmail={isEmail} bind:amount={message.amount} bind:isSubmitting={isSubmitting}></SubmitRow>
        </form>
    </article>
    </div>
</section>

<style>
  section {
    border: 0;
    padding:0;
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
    padding: 1.5rem;
  }

  article {
    display: block;
    width: 100%;
  }

  .message {
    word-wrap: break-word;
    word-break: break-word;
    line-height: 1.4;
    font-family: inherit;
    font-size: var(--font-size-medium);
    width: 100%;
    border: 0;
    outline: none;
    resize: none;
    padding: 1rem 0;
    min-height: 13em;
    background-color: transparent;
    color: var(--color-text);
  }
</style>
