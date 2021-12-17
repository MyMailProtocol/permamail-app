<script lang="ts">
	// Copyright (C) 2021, MyMail Labs Inc.  Proprietary and Confidential.
	// All rights reserved.  Unauthorized copying or use of this file, in whole or in part, using any medium is strictly prohibited.

    export let isOpen:boolean = false;

    function closePopup() {
        isOpen = false;
    }
</script>

<style>
    div.modal {
        position: absolute;
        top: -1em;
        left: 0;
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 1;
        z-index: 30;
    }
    div.modal:not(:focus-within) {
        transition: opacity 0.1ms;
        opacity: 0.99;
    }
    div.backdrop {
        background-color: rgba(0, 0, 0, 0.44);
        position: fixed;
        width: 100%;
        height: 100%;
    }
    div.content-wrapper {
        z-index: 10;
        max-width: 70vw;
        overflow: hidden;
        padding: 1rem;
        position: absolute;
        top: 5rem;
        right: 2rem;

        display: flex;
        flex-direction: column;
        list-style-type: none;
        background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
        color: var(--color-txt--reversed);
        padding: 1.25em;
        border-radius: 1.5em;
        max-height: 66vh;
        width: 30rem;
        overflow-y: auto;
        font-size: var(--font-size-small);
        text-align: left;
        z-index: 10;
        opacity: 0.99;
        -webkit-overflow-scrolling: touch;
    }

    .header {
        color: var(--color-primary);
    }

    div.content {
        max-height: 50vh;
        overflow: auto;
    }
</style>

{#if isOpen}
<div class="modal" tabindex="0">
    <div class="backdrop" on:click={closePopup} />
    <div class="content-wrapper">
        <div class="header">
            <slot name="header">
                <!-- fallback -->
                ADMIN@PIXELSAMURAI.COM
            </slot>
        </div>
        
        <div class="content">
            <slot name="content">
                content
            </slot>
        </div>
    </div>
</div>
{/if}
