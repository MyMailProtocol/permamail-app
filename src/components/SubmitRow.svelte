<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  const submit = () => {
    dispatch('submit');
  };

  export let isSubmitting: boolean = false;
  export let isMessageReady: boolean = false;
  export let isEmail: boolean = false;
  export let amount: number;
</script>

<div class="submitRow">
  <div class="footer">
  {#if isEmail}
    <!-- TODO: support valid/invalid message states for email -->
    <input class="submitButton" type="submit" value="Send email">
  {:else}
    {#if isMessageReady}
      {#if isSubmitting}
        <div class="submitButton disabled">Sending...</div>
      {:else}
        <input class="submitButton myMail" on:click={submit} type="submit" value="Send Weavemail">
      {/if}
    {:else}
      <div class="submitButton disabled">Send Weavemail</div>
    {/if}
    <div class="amount"><input id="aramount" bind:value={amount} placeholder="0 AR" /></div>
  {/if}
  </div>
</div>

<style>
  .submitRow {
    color: var(--color-txt--reversed);
  }

  input {
    max-width: 100%;
    background-color: transparent;
    border-color: transparent;
    border-radius: 0.6rem;
    line-height: inherit;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    color: inherit;
    -webkit-appearance: none;
    -moz-appearance: none;
    box-sizing: border-box;
  }

  .submitButton {
    cursor:pointer;
    border: 0;
    line-height: 2rem;
    font-family: inherit;
    margin: 0;
    margin-left: 0.5em;
    padding: 0.3em 0.8em;
    font-weight: 500;
    text-decoration: none;
    background: var(--color-secondary);
    border-color: var(--color-secondary);
    color: var(--color-txt--reversed);
    border-radius: 3rem;
    right: 2em;
    flex-direction: row-reverse;
  }

  .myMail {
    background: var(--color-tertiary);
    border-color: var(--color-tertiary);
  }

  .disabled {
    background:var(--color-border);
    cursor:default;
  }

  .footer {
    display: flex;
    flex-direction: row-reverse;
    height: 1.9em;
    align-items:flex-end;
    width:100%;
  }

  .amount {
    position: relative;
    z-index: 0;
    background-color: var(--rgb-background);
    color: var(--color-text);
    margin: 0;
    font-weight: 500;
    text-decoration: none;
    border-radius: 3rem;
    white-space: nowrap;
    line-height: 1.8rem;
    font-family: inherit;
    padding: 0.3em 0.8em;
    padding-left: 2.2em;
  }

  .amount::before {
    content: "";
    width: 2em;
    height: 2em;
    position: absolute;
    left: 0.3em;
    top: 50%;
    margin-top: -1em;
    background: center / 1em no-repeat;
    background-image: url("/static/ar_coin.svg");
    filter: invert(99%) sepia(70%) saturate(310%) hue-rotate(180deg)
      brightness(103%) contrast(85%);
  }

  .amount input {
    width: 5em;
    line-height: 0rem;
    height: 1.2em;
    text-align: right;
  }
</style>
