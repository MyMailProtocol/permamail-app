<script lang="ts">
  import { keyStore } from '$lib/keyStore';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const onLoggedIn = () => { dispatch('login'); };

  function onChangedHandler(event: Event) {
    const jwk: File = (<HTMLInputElement>event.target).files[0];
    const reader: FileReader = new FileReader();
    reader.readAsText(jwk);
    reader.onload = () => {
      $keyStore.keys = reader.result.toString();
      onLoggedIn();
    };
  }

  async function onARConnectLogin() {
    await window.arweaveWallet.connect([
      'DECRYPT',
      'ENCRYPT',
      'ACCESS_ADDRESS',
      'SIGN_TRANSACTION',
      'ACCESS_PUBLIC_KEY',
    ]);
    onLoggedIn();
  }
</script>

<section>
  <div class="file-input">
    <input
      type="file"
      id="file"
      on:change={(e) => onChangedHandler(e)}
    />
    <div id="desc">Drop a keyfile to login.</div>
  </div>
  <div class="or-block">
    or use
  </div>
  <button on:click={onARConnectLogin} class="arconnect">
    ArConnect to login
  </button>
</section>

<style>
  section {
    font-size: var(--font-size-small);
    color: var(--color-text);
  }

  .file-input {
    height: 200px;
    border: 2px dashed #62666f;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: auto;
    max-width: 300px;
    font-size: var(--font-size-medium);
    color: var(--color-text);
  }

  .file-input input[type="file"] {
    opacity: 0;
    position: absolute;
    background: none;
    width: 100%;
    height: 100%;
  }

  .file-input:hover {
    background-color: var(--color-bg--sheet);
  }

  .or-block {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: auto;
    max-width: 300px;
    height:50px;
  }

  .arconnect {
    background-color: transparent;
    height: 50px;
    border-radius: 5px;
    border: 2px solid #62666f;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: auto;
    width: 300px;
    max-width: 300px;
    font-size: var(--font-size-medium);
    color: var(--color-text);
  }

  .arconnect:hover {
    background-color: var(--color-bg--sheet);
    cursor: pointer;
  }
</style>
