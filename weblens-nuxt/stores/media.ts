import { defineStore } from 'pinia'
import WeblensMedia from '~/types/weblensMedia'
import type { ShallowRef } from 'vue'
import { useWeblensApi } from '~/api/AllApi'
import type { MediaInfo, MediaTypeInfo } from '@ethanrous/weblens-api'
import useLocationStore from './location'

export const TIMELINE_PAGE_SIZE = 200
export const TIMELINE_IMAGE_MIN_SIZE = 150
export const TIMELINE_IMAGE_MAX_SIZE = 450

export const useMediaStore = defineStore('media', () => {
    const route = useRoute()

    const media: ShallowRef<Map<string, WeblensMedia>> = shallowRef(new Map())
    const mediaTypeMap: Record<string, MediaTypeInfo> = {}

    const timelineSort = ref<'createDate'>('createDate')
    const timelineSortDirection = ref<1 | -1>(1) // 1 for ascending, -1 for descending
    const timelineImageSize = ref<number>(200)

    const locationStore = useLocationStore()

    const imageSearch = ref<string>('')

    const showRaw = computed(() => {
        return route.query['raw'] !== 'false'
    })

    async function fetchMoreMedia(
        pageNum: number,
    ): Promise<{ medias: WeblensMedia[]; totalMedias: number; canLoadMore: boolean }> {
        if (!locationStore.isInTimeline) {
            return Promise.reject('not in timeline')
        }

        return useWeblensApi()
            .MediaApi.getMedia(
                {
                    raw: showRaw.value,
                    hidden: false,
                    sort: timelineSort.value,
                    sortDirection: timelineSortDirection.value,
                    page: pageNum,
                    limit: TIMELINE_PAGE_SIZE,
                    folderIds: [locationStore.activeFolderId],
                    search: imageSearch.value,
                },
                locationStore.activeShareId,
            )
            .then((res) => {
                const medias = res.data.Media?.map((m) => new WeblensMedia(m)) ?? []
                medias.forEach((m) => media.value.set(m.contentId, m))
                return {
                    medias,
                    totalMedias: res.data.mediaCount ?? 0,
                    canLoadMore: medias.length === TIMELINE_PAGE_SIZE,
                }
            })
    }

    function addMedia(...mediaInfo: MediaInfo[]) {
        for (const m of mediaInfo) {
            if (!m.contentId) {
                console.warn('Media item missing contentId, skipping addition')
                continue
            }

            if (media.value.has(m.contentId)) {
                console.warn(`Media with contentId ${m.contentId} already exists, skipping addition`)
                continue
            }

            if (m instanceof WeblensMedia) {
                media.value.set(m.contentId, m)
            } else {
                media.value.set(m.contentId, new WeblensMedia(m))
            }
        }

        media.value = new Map(media.value) // Trigger reactivity
    }

    function toggleSortDirection() {
        timelineSortDirection.value = timelineSortDirection.value === 1 ? -1 : 1
    }

    function updateImageSize(direction: 'increase' | 'decrease' | number) {
        if (typeof direction === 'number') {
            timelineImageSize.value = Math.max(TIMELINE_IMAGE_MIN_SIZE, Math.min(TIMELINE_IMAGE_MAX_SIZE, direction))
            return
        }

        if (direction === 'increase') {
            timelineImageSize.value = Math.min(TIMELINE_IMAGE_MAX_SIZE, timelineImageSize.value + 50)
        } else if (direction === 'decrease') {
            timelineImageSize.value = Math.max(TIMELINE_IMAGE_MIN_SIZE, timelineImageSize.value - 50)
        }
    }

    function setShowRaw(raw: boolean) {
        navigateTo({
            query: {
                ...route.query,
                raw: String(raw),
            },
        })
    }

    function setImageSearch(search: string) {
        imageSearch.value = search
    }

    return {
        media,
        mediaTypeMap,
        timelineImageSize,
        timelineSortDirection,
        showRaw,
        imageSearch,
        addMedia,
        fetchMoreMedia,
        toggleSortDirection,
        updateImageSize,
        setShowRaw,
        setImageSearch,
    }
})
