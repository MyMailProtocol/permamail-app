<script lang="ts">
	// Copyright (C) 2021, MyMail Labs Inc.  Proprietary and Confidential.
	// All rights reserved.  Unauthorized copying or use of this file, in whole or in part, using any medium is strictly prohibited.

	import Header from '/src/lib/header/header.svelte';
	import '../app.css';
</script>

<Header />

<main>
	<slot />
</main>

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1.6rem 1.6rem 0rem 1.6rem;
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
