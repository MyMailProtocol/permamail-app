<script>
	// Copyright (C) 2021, MyMail Labs Inc.  Proprietary and Confidential.
	// All rights reserved.  Unauthorized copying or use of this file, in whole or in part, using any medium is strictly prohibited.

    export let imageUrl = "/src/lib/header/plus.svg";
    export let onClick = () => { console.log("Clicked")};
</script>

<div class="item" on:click={onClick} >
    <div class="icon" style="background-image: url('{imageUrl}');"/>
    <span>
        <slot>content</slot>
    </span>
</div>

<style>
    .item span {
        color: var(--color-txt--reversed);
        text-decoration: none;
        cursor:default;
    }
    .item:hover {
        background: var(--color-modal-item-hovered) !important;
    }
    .item {
        margin: 1px auto;
        padding: 0.6em 0.6em 0.6em 1.5em;
        color: var(--color-txt--reversed);
        border-radius: 0.8rem;
        position: relative;
    }
    .icon {
        content: " ";
		width: 1em;
		height: 1em;
		position: absolute;
		left: 0.2em;
		top: 50%;
		color: var(--color-tertiary);
		z-index: 10;
		margin-top: -0.5em;
		background: center / 1em no-repeat;
        filter: invert(11%) sepia(9%) saturate(2411%) hue-rotate(171deg) brightness(89%) contrast(85%);
    }
</style>
    
