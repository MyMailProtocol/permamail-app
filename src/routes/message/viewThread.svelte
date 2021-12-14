<script context="module" lang="ts">
    export const prerender = true;
    import type { Message } from "$lib/types";
    import type { InboxItem } from "$lib/myMail";
    import ThreadMessage from "/src/components/ThreadMessage.svelte";

    export async function load() {
        let inboxThread = JSON.parse(localStorage.inboxThread);
        console.log(inboxThread);
        const inboxItem = inboxThread.items[inboxThread.items.length-1];
        const message = await getMessage(inboxItem);
        
        return { props: { message, inboxItem, inboxThread } };
    }

    async function markMessageAsSeen(inboxItem: InboxItem) {
        if (inboxItem.contentType == "weaveMail") {
        } else if (inboxItem.isSeen == false) {
            var flags = {
                isSeen: true,
                isRecent: inboxItem.isRecent,
                isFlagged: inboxItem.isFlagged,
            };

            // var url = `http://localhost:5000/Mail/message/${inboxItem.id}/flags`;
            // const res = await fetch(url, {
            //     method: "POST", // *GET, POST, PUT, DELETE, etc.
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify(flags),
            // });
            // // const res = await fetch('inbox.json');
            // const result = await res.text();
            //console.log(`marked as seen ${result}`);
        }
    }

    async function getMessage(inboxItem: InboxItem): Promise<Message> {
        if (inboxItem.contentType == "weavemail") {
            let msg: Message = {
                id: inboxItem.id,
                body: inboxItem.body,
                fromAddress: inboxItem.fromAddress,
                fromName: inboxItem.fromName,
                subject: inboxItem.subject,
                toAddress: "",
                toName: "",
                fee: 0,
                amount: 0,
                txid: "",
                timestamp: inboxItem.timestamp,
                appVersion: "",
            };
            return msg;
        } else {
            const res = await fetch(
                `http://localhost:5000/Mail/message/${inboxItem.id}`,
                { mode: "cors" }
            );
            const text = await res.text();
            let msg: Message = JSON.parse(text);
            markMessageAsSeen(inboxItem);
            return msg;
        }
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import { submitWeavemail, getThreadId, InboxThread } from "$lib/myMail";
    import { getFormattedTime, getFormattedDate } from "$lib/formattedTime";
    import { scrollToBottom } from '$lib/scrollTo/svelteScrollTo.js';
    import { sineInOut } from "svelte/easing";
    import SubmitRow from '/src/components/SubmitRow.svelte';
    import ComposeRow from '/src/components/ComposeRow.svelte';
    import { sentMessage } from '$lib/routedEventStore';
    import { goto } from '$app/navigation';
    import Arweave from "arweave";
	import config from "$lib/arweaveConfig";
    import { keyStore } from "$lib/keyStore";
    var arweave: any = Arweave.init(config);

    export let message: Message;
    export let inboxItem: InboxItem;
    export let inboxThread: InboxThread;


    let isCollapsed = true;
    let isSubmitting = false;
    let isPermanent = false;
    let promise = Promise.resolve();
    let isReplying = false;
    const focus = node => node.focus();
    let innerHeight;
    $: options = {
        easing: sineInOut,
		offset: innerHeight,
		duration: 400,
        delay: 200
    }

    $: toAddress = message.fromAddress;
    $: replaySubject =  message.subject ? makeReplySubject(message.subject) : "";
    $: isValid = toAddress ? isAddressValid(toAddress) : false;
    let arAmount = null;

    function makeReplySubject(subject: string): string {
        var upper = subject.toUpperCase();
        if (upper.startsWith("RE:"))
            return subject;
        else 
            return `Re: ${subject}`;
    }

    async function onSubmit() {
        console.log("submit requested");
        isSubmitting = true;

        // Tidy up the response message of client side styles
        // so it's suitable for sending
        const bodyElement = document.querySelector("#replyBody");
        var doc = document.implementation.createHTMLDocument("");
        var imported = document.importNode(bodyElement, true);
        doc.body.append(imported);
        var replyText = doc.querySelector("#replyText");
        replyText.removeAttribute("contenteditable");
        replyText.removeAttribute("style");
        replyText.removeAttribute("id");
        const messageBody = doc.querySelector("#replyBody").innerHTML;
        console.log(messageBody);
        console.log(`toAddress:${toAddress} replySubject:${replaySubject} arAmount:${parseFloat(arAmount)}`);
    
        let address = "";
		let wallet = null;
		if ($keyStore.keys != null) {
			wallet = JSON.parse($keyStore.keys);
			address = await arweave.wallets.jwkToAddress(wallet);
		} else {
			address = await window.arweaveWallet.getActiveAddress();
		}

		if (address == message.toAddress) {
			alert('"Error: Cannot send mail to yourself"');
			return;
		}

		await submitWeavemail(arweave, toAddress, replaySubject, messageBody, parseInt(arAmount), wallet)
		.then(() => {
			$sentMessage = true;
			goto("../");
		})
    }

    onMount(async () => {
        console.log(`contentType:${inboxItem.contentType}`);
        markMessageAsSeen(inboxItem);
    });

    async function startReplying() {
        isReplying = true;
        console.log(message);
        var replyElement = document.getElementById("replyBody");
        replyElement.innerHTML = `<div id="replyText" style="outline: none;" contenteditable >
    <br/>
    <br/>
</div>
On ${getFormattedDate(message.timestamp)}, ${ !message.fromName ? "" : `"${message.fromName}"`} &lt;${message.fromAddress}&gt; wrote:
<blockquote style="padding-inline-start: 1.5rem;
margin: 0;
padding-inline-end: 0;
border-inline-start: 1px solid rgba( 27, 39, 51, 0.15);">${message.body}</blockquote>`;

        const div = <HTMLElement>replyElement.querySelector("#replyText");
        setTimeout(function() {
            div.focus();
            var container = document.getElementById("replyContainer");
            console.log(`container: ${container.clientHeight}`);
            options.offset = -innerHeight - (container.clientHeight - 440)
            scrollToBottom(options);
        }, 0);
    }

    function isAddressValid(address:string):boolean {
		let re = /^[a-zA-Z0-9_\-]{43}$/;
		return re.test(address);
	}

    function onItemHeaderClicked(itemIndex: number) {
        if (inboxThread.items.length == 1) return;
        isCollapsed = !isCollapsed;
        // var temp = inboxThread.items;
        // inboxThread.items = [];
        // setTimeout(() => { inboxThread.items = temp; }, 0);
    }
</script>
<svelte:window bind:innerHeight />
<section>
    <div class="title">{inboxItem.subject}</div>
    {#each inboxThread.items as item, i}
        <ThreadMessage bind:isCollapsed={isCollapsed} inboxItem={item} index={i} on:headerClicked={event => {onItemHeaderClicked(event.detail.index)}} />
    {/each}
    {#if !isReplying}
        <div class="page-toolbar">
            <div class="content1">
                <span class="item">
                    <div class="action" on:click={startReplying}>
                        Reply Now
                    </div>
                </span>
            </div>
        </div>
    {/if}
    <div id="replyContainer" class="container hiding" class:visible={isReplying}>
        <article>
            <div class="inputRow">
                <ComposeRow bind:toAddress={toAddress} bind:subject={replaySubject} />
            </div>
            <div id="replyBody" class="content reply">
                <!-- message reply body is injected to make sure it's not picking up svelt markup -->
            </div>
            <br/>
            <div class="inputRow"><SubmitRow on:submit={onSubmit} bind:isMessageReady={isValid} bind:amount={arAmount} bind:isSubmitting={isSubmitting} /></div>
        </article>
    </div>
</section>

<style>
    section {
        border: 0;
        padding: 0;
        min-height: calc(100vh);
        padding-bottom: 10rem;
        margin-bottom: 280px;
    }

    article {
		display: block;
		width: 100%;
        font-size: var(--font-size-small);
	}

    .title {
        font-weight: bolder;
        font-size: var(--font-size-xx-large);
        color: var(--color-text);
        word-wrap: break-word;
        text-align: center;
    }

    .container {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        background: var(--color-bg--sheet);
        box-shadow: 0 0 3rem 0.2rem var(--color-almost-black);
        min-height: 35rem;
        margin-top: 1.2em;
        margin-bottom: 0;
        border-radius: 1.5em;
        color: var(--color-text);
        padding:0.5rem;
        padding-bottom: 5em;
    }

    .hiding {
        display: none;
    }
    .visible { 
        display: flex;
    }

    .content {
        --color-bg--message-content: #fff;
        --color-txt--on-message-content: rgb(var(--rgb-almost-black));
        background: var(--color-bg--message-content);
        color: var(--color-txt--on-message-content);
        border-radius: 0 1.5em 1.5em 1.5em;
        padding: 2rem;
        margin: 0.2em 2em 0 3em;
        font-size: var(--font-size-medium);
        line-height: 1.4em;
    }

    .inputRow {
        margin: 0em 2em 0 3.5em;
    }

    .page-toolbar {
        position: sticky;
        max-width: 12rem;
        margin-left: auto;
        margin-right: auto;
        bottom: 0;
        padding: 1rem 0;
        z-index: 8;
        border-radius: 3rem 3rem 0 0;
    }

    .content1 {
        padding: 0.5rem;
        background: linear-gradient(135deg, var(--color-bg--secondary-glint) 0%, var(--color-bg--secondary-glint) 80%) var(--color-bg--main-thick);
        border-radius: 1.6rem;
        display: flex;
        justify-content: space-around;
    }

    .page-toolbar .item {
        height:5rem;
        width:8rem;
        font-size: var(--font-size-x-small);
        color: var(--color-text);
    }

    .item .action {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
        background: none;
        border: 0;
        padding: 0.5rem;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        position: relative;
        font-size: var(--font-size-x-small);
        font-weight: 500;
        border-radius: 1.2rem;
    }

    .item .action::before {
        content: "";
        filter: invert(99%) sepia(70%) saturate(310%) hue-rotate(294deg) brightness(103%) contrast(85%);
        background: center / 2.2rem no-repeat;
        background-image: url("/static/reply.svg");
        width: 4rem;
        height: 2.5rem;
    }
</style>
