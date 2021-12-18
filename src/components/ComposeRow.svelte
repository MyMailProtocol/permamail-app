<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  const onAddressReady = () => dispatch('onAddressReady');

  // export let isEditable = true;
  export let isAddressReady: boolean = false;
  export let isEmail: boolean = false;
  export let toAddress: string;
  export let subject: string;
  export let isSubjectUnderlined: boolean = false;

  function parseToAddress() {
    // TODO: supprt email addresses
    isEmail = false;
    const re: RegExp = /^[a-zA-Z0-9_\-]{43}$/;
    const isValid: boolean = re.test(toAddress);
    if (isValid !== isAddressReady) {
      isAddressReady = re.test(toAddress);
      onAddressReady();
    } else {
      isAddressReady = re.test(toAddress);
    }
  }
</script>

<div class="inputRow borderBottom">
    <div class="label">To</div>
    <div class="inputField"><input bind:value={toAddress} on:input={parseToAddress}/></div>
</div>
<div class="inputRow" class:borderBottom={isSubjectUnderlined}>
    <div class="label">Subject</div>
    <div class="inputField"><input bind:value={subject}/></div>
</div>

<style>
  .inputRow {
    display: flex;
    padding: 0.2rem 0 0 0;
  }

  .borderBottom {
    border-bottom: 1px solid var(--color-border);
  }

  .label {
    line-height: 3rem;
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

  .inputField {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    border-radius: 0.6rem;
    padding: 0 0 0 0.5em;
    border: 2px solid transparent;
    flex: 1;
  }

  .inputField input{
    width: 100%;
  }
</style>
