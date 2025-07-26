<template>
    <div
        ref="timelineContainer"
        :class="{
            'timelineContainer page-root relative flex max-w-full flex-col flex-nowrap overflow-x-hidden overflow-y-auto pt-2': true,
        }"
    >
        <ErrorCard
            v-if="error"
            :error="error"
        />

        <div
            v-else-if="rows.length === 0 && !loading && !canLoadMore"
            :class="{ 'm-auto flex flex-col items-center': true }"
        >
            <h3 :class="{ 'border-b': true }">No media found</h3>
            <h4>Adjust filters</h4>
            <span>Or</span>
            <WeblensButton
                label="Return to Files"
                @click="useFilesStore().setTimeline(false)"
            />
        </div>

        <div
            v-for="(row, rowIndex) of rows"
            v-else
            :key="String(rowIndex) + row.items.length"
            :class="{
                'mx-2 flex flex-row': true,
            }"
            :style="{
                marginTop: MARGIN_SIZE / 2 + 'px',
                marginBottom: MARGIN_SIZE / 2 + 'px',
                height: row.rowHeight + 'px',
                maxHeight: row.rowHeight + 'px',
                width: row.rowWidth + 'px',
                flexShrink: 0,
            }"
        >
            <UseElementVisibility
                v-slot="{ isVisible }"
                :class="{ 'flex h-full w-full': true }"
            >
                <div
                    v-for="(media, colIndex) of row.items"
                    :id="media.m.contentId"
                    :key="media.m.contentId + rowIndex + isVisible"
                    :class="{ 'flex items-center justify-center': true }"
                    :style="{
                        marginLeft: MARGIN_SIZE / 2 + 'px',
                        marginRight: MARGIN_SIZE / 2 + 'px',
                        width: media.w + 'px',
                        height: row.rowHeight + 'px',
                    }"
                    @click.stop="startPresenting(rowIndex, colIndex)"
                >
                    <MediaImage
                        :media="media.m"
                        :should-load="isVisible"
                        placeholder
                        :class="{
                            'hover:border-text-primary/100 border-text-primary/0 h-full max-h-full w-full max-w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-[scale,border,shadow] hover:shadow': true,
                        }"
                    />
                </div>
            </UseElementVisibility>
        </div>
        <Loader
            v-if="canLoadMore"
            :class="{ 'mx-auto my-10': true }"
        />
    </div>
</template>

<script setup lang="ts">
import { onKeyPressed, useDebounce, useElementSize, useInfiniteScroll } from '@vueuse/core'
import { UseElementVisibility } from '@vueuse/components'

import type WeblensMedia from '~/types/weblensMedia'
import type { WLError } from '~/types/wlError'
import MediaImage from '../atom/MediaImage.vue'
import { GetMediaRows } from '~/types/weblensMedia'
import ErrorCard from '../molecule/ErrorCard.vue'
import Loader from '../atom/Loader.vue'
import WeblensButton from '../atom/WeblensButton.vue'
import useFilesStore from '~/stores/files'

const mediaStore = useMediaStore()

const timelineContainer = ref<HTMLDivElement>()
const timelineSize = useElementSize(timelineContainer)
const presentationStore = usePresentationStore()
const presentationIndex = ref<number>(-1)

const timelineWidthBounced = useDebounce(timelineSize.width, 100)

const medias = shallowRef<WeblensMedia[]>([])
const page = ref<number>(0)
const canLoadMore = ref<boolean>(true)
const error = ref<WLError>()

const MARGIN_SIZE = 4

const rows = computed(() => {
    if (timelineWidthBounced.value <= 0) {
        return []
    }

    return GetMediaRows(medias.value, mediaStore.timelineImageSize, timelineWidthBounced.value - 16, MARGIN_SIZE)
})

async function fetchMore() {
    if (!canLoadMore.value || (timelineContainer.value?.scrollHeight ?? 0) <= 0) {
        return
    }

    const { medias: newMedias, canLoadMore: _canLoadMore } = await mediaStore
        .fetchMoreMedia(page.value)
        .catch((fetchError) => {
            error.value = { status: fetchError.status } as WLError
            console.error('Error fetching more media:', fetchError)

            return { medias: [], canLoadMore: false }
        })
    canLoadMore.value = _canLoadMore

    medias.value = [...medias.value, ...newMedias]
}

const loading = ref(false)

const { reset } = useInfiniteScroll(
    timelineContainer,
    async () => {
        if (loading.value) {
            return
        }

        loading.value = true

        await fetchMore()

        page.value++
        loading.value = false
    },
    { distance: 1000, interval: 1000, canLoadMore: () => canLoadMore.value },
)

function startPresenting(rowIndex: number, colIndex: number) {
    const absIndex = rows.value.slice(0, rowIndex).reduce((acc, row) => acc + row.items.length, 0) + colIndex
    presentationIndex.value = absIndex
    presentationStore.setPresentationMediaId(medias.value[absIndex].contentId)
}

onKeyPressed(['=', '-'], (e) => {
    mediaStore.updateImageSize(e.key === '=' ? 'increase' : 'decrease')
})

watch([() => mediaStore.timelineSortDirection, () => mediaStore.showRaw], () => {
    loading.value = true
    medias.value = []
    page.value = 0
    canLoadMore.value = true

    reset()

    loading.value = false
})

onMounted(() => {
    presentationStore.setOnMovePresentation((direction: number) => {
        if (direction === 1 && presentationIndex.value < medias.value.length - 1) {
            presentationIndex.value++
        } else if (direction === -1 && presentationIndex.value > 0) {
            presentationIndex.value--
        }

        if (!medias.value[presentationIndex.value]) {
            console.warn('No media found at index', presentationIndex.value)
            return
        }

        const newContentId = medias.value[presentationIndex.value].contentId
        presentationStore.setPresentationMediaId(newContentId)

        if (medias.value.length - presentationIndex.value < 10 && !loading.value) {
            // If we are near the end, fetch more media
            loading.value = true
            fetchMore().finally(() => {
                page.value++
                loading.value = false
            })
        }
    })
})
</script>
