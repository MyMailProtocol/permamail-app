<script lang="ts">
    import type { InboxItem,  } from "$lib/myMail";
    import { getFormattedTime } from "$lib/formattedTime";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let isCollapsed:boolean = true;
    export let inboxItem: InboxItem;
    export let index: number;

    function getMessagePreview(): string {  
        if (inboxItem.body && typeof inboxItem.body === `string`) {
            var stripedHtml = inboxItem.body.split("<br")[0].replace(/<[^>]+>/g, '');
            return stripedHtml;
        }
        return "";
    }

    function processHyperlinks(body:string): string {
        const links = /(https?|ftp|file):\/\/[-\w+&@#\/%?=~_|!:,.;]*[-\w+&@#\/%=~_|]/gm

        body = body.replace(links, `<a href="$&" target="_blank">$&</a>`);
        return body;
    }

    function saveToArweave() {
        isPermanent = true;
        let milliseconds = 2000;
        promise = new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    let isPermanent = false;
    let promise = Promise.resolve();
</script>

<div class="container" class:collapsed={isCollapsed && !inboxItem.isRecent}  class:threadItem={!inboxItem.isRecent}>
    <!-- <div class="optionsContainer">
        <div class="optionsBar">
            {#if isPermanent == false}
                <span class="optionButton interactive" on:click={saveToArweave}>Not Saved Permanently</span>
            {:else}
                {#await promise}
                    <span class="savingButton active"><div class="loader"></div>Saving Permanently...</span>
                {:then}
                    <span class="optionButton active">Saved Permanently</span>
                {/await}

            {/if}
        </div>
    </div> -->
   
    <div class="header" on:click={() => dispatch('headerClicked', {index})}>
        <div class="left">
            <img src="../img_avatar.png" alt="ProfileImage" class="avatar"/>
        </div>
        <div class="center">
            <span class="from"> {inboxItem.fromName == inboxItem.fromAddress ? 'No name' : inboxItem.fromName}
                <span class="to"> &lt;{inboxItem.fromAddress}&gt; </span>
            </span>
            {#if !isCollapsed || inboxItem.isRecent}
                <div class="to">To {inboxItem.toName}</div>
            {:else}
                <div class="preview">{getMessagePreview()}</div>
            {/if}
        </div>
        <div class="right">
            {getFormattedTime(inboxItem.timestamp)}
        </div>
    </div>
    {#if !isCollapsed || inboxItem.isRecent}
    <div class="content">
        <div class="body">
            {#if inboxItem.contentType == "multipart/alternative"}
                {@html processHyperlinks(decodeURI(inboxItem.body))}
            {:else if inboxItem.contentType == "weavemail"}
                {@html processHyperlinks(inboxItem.body)}
            {:else}
                <pre>{processHyperlinks(decodeURI(inboxItem.body))}</pre>
            {/if}
        </div>
    </div>
    {/if}
</div>

<style>
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

    .threadItem {
       min-height: 1rem;
       cursor: pointer;
    }

    .collapsed {
        padding: 0.5em;
        padding-bottom: 3.75em;
        min-height: 0rem;
        margin-bottom: -3.75em;
    }

    .header {
        display: flex;
        box-sizing: border-box;
        text-align: left;
        margin-top: 0.2rem;
    }

    .header .left {
        flex: 0 auto;
        width: 3.625em;
        height: 3.625em;
        margin-block-end: 1em;
        margin-inline-start: 10px;
        margin-inline-end: 0.5em;
    }

    .header .center {
        justify-content: flex-start;
        width: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        display: block;
        padding: 0.9rem 1em 0.3rem 0;
        max-width: calc(100% - 7rem);
    }

    .header .right {
        padding-top: 1.8rem;
        padding-right: 3.5rem;
        color: var(--color-text--subtle);
        font-size: var(--font-size-small);
        white-space: nowrap;
    }

    .from {
        font-weight: 600;
        font-size: var(--font-size-medium);
        line-height: 1.3em;
    }

    .to {
        color: var(--color-text--subtle);
        font-size: var(--font-size-small);
        margin: 0 !important;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .preview {
        color: var(--color-text--subtle);
        font-size: var(--font-size-medium);
        margin: 0 !important;
        text-overflow: ellipsis;
        overflow: hidden;
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

    .content div {
        outline: none;
    }

    .avatar {
        width: 3.625em;
        height: 3.625em;
        border-radius: 100%;
        z-index: 1;
        display: block;
        position: relative;
        color: transparent;
        background-color: var(--color-bg--surface-glint-opaque);
        margin-top: 0.5rem;
    }

    /* Options bar stuff -----------------------------------------------------*/

    /* .loader,
    .loader:after {
        border-radius: 50%;
        width: 1.2em;
        height: 1.2em;
    }
    .loader {
        display: inline-block;
        margin: 0px 0px;
        font-size: 10px;
        position: absolute;
        left: 0.5em;
        text-indent: -9999em;
        border-top: .2em solid rgba(0, 0, 0, 0.2);
        border-right: .2em solid rgba(0, 0, 0, 0.2);
        border-bottom: .2em solid rgba(0, 0, 0, 0.2);
        border-left: .2em solid #000000;
        -webkit-transform: translateZ(0);
        -ms-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-animation: load8 1.1s infinite linear;
        animation: load8 1.1s infinite linear;
        filter: invert(46%) sepia(49%) saturate(835%) hue-rotate(204deg)
            brightness(100%) contrast(114%);
    }
  
    .optionsContainer {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        margin: 0.5em 4em 1em 4em;
        color: var(--color-text);
    }
    .optionsBar {
        display: inline-flex;
        flex-flow: wrap;
        align-items: center;
        text-align: center;
        justify-content: center;
        border-radius: 3rem;
        margin: 0;
        font-size: var(--font-size-x-small);
        margin-top: var(--half-space) !important;
        padding: 0.4em;
        background: var(--color-bg--surface);
    }

    .optionButton {
        position: relative;
        display: inline-block;
        box-sizing: border-box;
        margin: 0;
        padding: 0.3em 0.8em;
        padding-left: 2em;
        font-weight: 500;
        text-decoration: none;
        border-radius: 3rem;
        white-space: nowrap;
        background-color: transparent;
        color: var(--color-txt);
    }

    .savingButton {
        position: relative;
        display: inline-block;
        box-sizing: border-box;
        margin: 0;
        padding: 0.3em 0.8em;
        padding-left: 2em;
        font-weight: 500;
        text-decoration: none;
        border-radius: 3rem;
        white-space: nowrap;
        background-color: transparent;
        color: var(--color-txt);
    }

    .interactive {
        cursor:pointer;
    }

    .optionButton::before {
        content: "";
        width: 1em;
        height: 1em;
        position: absolute;
        left: 0.75em;
        top: 50%;
        margin-top: -0.5em;
        background: center / 1em no-repeat;
        background-image: url("/static/clock.svg");
        filter: invert(99%) sepia(70%) saturate(310%) hue-rotate(294deg)
            brightness(103%) contrast(85%);
    }

    .active {
        background: var(--color-almost-black);
        color: var(--color-tertiary);
    }

    .active::before {
        background-image: url("/static/infinity3.svg");
        filter: invert(46%) sepia(49%) saturate(835%) hue-rotate(204deg)
            brightness(100%) contrast(114%);
    }

    @-webkit-keyframes load8 {
        0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    }
    @keyframes load8 {
        0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    } */

</style>