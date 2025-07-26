<template>
    <div class="relative flex shrink-0 overflow-hidden rounded transition-[height,width]">
        <div
            :class="{
                'gradient-progress-box': true,
                '!bg-danger': failed,
            }"
            :style="{ width }"
        />
        <div
            :class="{
                'gradient-outline-box': true,
                '!bg-danger/50': failed,
            }"
        />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    progress?: number
    failed?: boolean
}>()

const width = computed(() => {
    let prog = props.progress
    if (!prog || prog < 0) {
        prog = 0
    } else if (prog > 100) {
        prog = 100
    }

    return prog + '%'
})
</script>

<style scoped>
.gradient-outline-box {
    display: flex;
    align-items: center;
    margin: auto;
    height: 100%;
    width: 100%;

    position: relative;
    box-sizing: border-box;

    background: var(--color-card-background-primary);
    background-clip: padding-box; /* !importanté */
    border: solid 1px transparent; /* !importanté */
    border-radius: 0.25em;

    &:before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: -1;
        margin: -1px; /* !importanté */
        border-radius: inherit; /* !importanté */
        background: linear-gradient(130deg, var(--color-theme-primary), var(--color-bluenova-500));
    }
}

.gradient-progress-box {
    position: absolute;
    height: 100%;
    background: linear-gradient(130deg, var(--color-theme-primary), var(--color-bluenova-500));
    z-index: 2;
}
</style>
