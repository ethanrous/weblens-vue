<template>
    <button
        ref="buttonRef"
        :class="{
            'justify-center': centerContent || !label || justIcon,
            'aspect-square': !label || justIcon,
            'rounded-none first:rounded-l last:rounded-r': merge === 'row',
        }"
        :data-flavor="flavor"
        :data-type="type"
        :data-selected="selected ?? false"
        :data-fill-width="fillWidth"
        :disabled="disabled || doingClick || disabled"
        @click="handleClick"
    >
        <slot />
        <span
            v-if="label && !justIcon"
            :class="{
                'mx-1 text-nowrap transition-[width]': true,
            }"
            :style="{
                width: textWidth,
            }"
        >
            {{ label }}
        </span>

        <!-- Fake text box just to measure the width -->
        <span
            v-if="label && !justIcon"
            ref="fakeText"
            :class="{ 'gone absolute mx-1 text-nowrap': true }"
        >
            {{ label }}
        </span>

        <slot name="rightIcon" />
    </button>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'

const slots = useSlots()

const doingClick = ref<boolean>(false)

const buttonRef = ref<HTMLButtonElement>()
const buttonSize = useElementSize(buttonRef)

const fakeText = ref<HTMLSpanElement>()
const fakeTextSize = useElementSize(fakeText)

const textWidth = computed(() => {
    if (fakeText.value) {
        return fakeTextSize.width.value + 'px'
    }
    return '0px'
})

const props = defineProps<{
    label?: string
    type?: 'default' | 'outline' | 'light'
    flavor?: 'primary' | 'danger' | 'secondary'
    selected?: boolean
    danger?: boolean
    squareSize?: number
    fillWidth?: boolean
    centerContent?: boolean
    allowCollapse?: boolean
    disabled?: boolean
    merge?: 'row' | 'column'
    onClick?: ((e: MouseEvent) => Promise<void>) | ((e: MouseEvent) => void)
}>()

const justIcon = computed(() => {
    if (props.allowCollapse && slots.default && buttonSize.width.value < 60) {
        return true
    }

    return false
})

async function handleClick(e: MouseEvent) {
    if (!props.onClick) {
        return
    }

    const maybePromise = props.onClick(e)
    if (maybePromise instanceof Promise) {
        console.log('ITs a promise!')
        doingClick.value = true
        await maybePromise
        doingClick.value = false
    } else {
        console.log('Not a promise')
    }
}
</script>
