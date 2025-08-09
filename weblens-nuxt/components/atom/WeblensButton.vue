<template>
    <button
        ref="buttonRef"
        :class="{
            'justify-center': centerContent || !label || justIcon,
            'aspect-square': !label || justIcon,
            'rounded-none first-of-type:rounded-l last-of-type:rounded-r': merge === 'row',
            'rounded-none first-of-type:rounded-t last-of-type:rounded-b': merge === 'column',
            '!p-0': !label,
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
            v-if="label"
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
import type { ButtonProps } from '~/types/button'

const props = defineProps<ButtonProps>()

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

const justIcon = computed(() => {
    if (
        props.allowCollapse &&
        slots.default &&
        buttonSize.width.value < fakeTextSize.width.value + 24 /* Icon size without padding */
    ) {
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
        doingClick.value = true
        await maybePromise
        doingClick.value = false
    }
}
</script>
