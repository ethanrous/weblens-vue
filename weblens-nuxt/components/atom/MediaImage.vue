<template>
    <div
        ref="imageContainer"
        :class="{ 'media-image relative flex h-full w-full items-center justify-center': true }"
    >
        <IconExclamationCircle
            v-if="imgError"
            color="red"
        />
        <img
            v-if="media && quality === PhotoQuality.HighRes"
            :class="{
                'absolute bg-center bg-no-repeat': true,
                'object-contain': contain,
                'object-cover': !contain,
                hidden: !highResLoaded,
            }"
            :src="media.ImgUrl(quality)"
            :style="{
                width: imageSize.width,
                height: imageSize.height,
            }"
            @load="highResLoaded = true"
            @click="
                (e) => {
                    if (noClick) {
                        e.stopPropagation()
                    }
                }
            "
        />
        <div
            v-if="media && !highResLoaded"
            :style="{
                width: imageSize.width,
                height: imageSize.height,
                backgroundImage: `url(${media.ImgUrl()})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: contain ? 'contain' : 'cover',
                backgroundPosition: 'center',
            }"
            @click="
                (e) => {
                    if (noClick) {
                        e.stopPropagation()
                    }
                }
            "
        />
        <!-- <img -->
        <!--     v-else-if="bouncedUrl" -->
        <!--     :src="bouncedUrl" -->
        <!--     draggable="false" -->
        <!--     :class="{ -->
        <!--         'z-2': true, -->
        <!--         'h-full w-full object-cover': !contain, -->
        <!--         'max-h-full object-contain': contain, -->
        <!--     }" -->
        <!-- /> -->
        <!-- <div -->
        <!--     v-if="placeholder" -->
        <!--     :class="{ 'bg-card-background-secondary absolute z-1 h-full w-[99%] rounded': true }" -->
        <!-- /> -->

        <Loader
            v-if="quality === PhotoQuality.HighRes && !highResLoaded && shouldLoad"
            :class="{ 'absolute bottom-0 left-0': true }"
        />
    </div>
</template>

<script setup lang="ts">
import { IconExclamationCircle } from '@tabler/icons-vue'
import type WeblensMedia from '~/types/weblensMedia'
import { PhotoQuality } from '~/types/weblensMedia'
import Loader from './Loader.vue'
import { useElementSize } from '@vueuse/core'

const imgError = ref<boolean>(false)
const imageContainer = ref<HTMLDivElement>()
const imageContainerSize = useElementSize(imageContainer)
const highResLoaded = ref<boolean>(false)

const {
    media = undefined,
    quality = PhotoQuality.LowRes,
    shouldLoad = true,
    contain = false,
    placeholder = false,
} = defineProps<{
    media?: WeblensMedia
    quality?: PhotoQuality
    shouldLoad?: boolean
    contain?: boolean
    placeholder?: boolean
    noClick?: boolean
}>()

const imageSize = computed(() => {
    if (!media || !imageContainerSize.width || !imageContainerSize.height) {
        return {
            width: '',
            height: '',
        }
    }

    if (!contain) {
        return {
            width: '100%',
            height: '100%',
        }
    }

    if (media.height / media.width > imageContainerSize.height.value / imageContainerSize.width.value) {
        const scaledWidth = (imageContainerSize.height.value / media.height) * media.width
        return {
            width: scaledWidth + 'px',
            height: imageContainerSize.height.value + 'px',
        }
    } else {
        const scaledHeight = (imageContainerSize.width.value / media.width) * media.height
        return {
            width: imageContainerSize.width.value + 'px',
            height: scaledHeight + 'px',
        }
    }
})

const emit = defineEmits<{ (e: 'error'): void }>()

const imgFetchKey = computed(() => {
    return 'mediaImage-' + media?.contentId + quality + shouldLoad
})

// const { data: imgUrl } = useAsyncData(
//     imgFetchKey,
//     async () => {
//         // controller?.abort?.()
//         if (!shouldLoad || !media) {
//             return ''
//         }
//
//         if (media.IsVideo() && quality === PhotoQuality.HighRes) {
//             return ''
//         }
//
//         try {
//             return await media.LoadBytes(quality, 0)
//         } catch (err) {
//             console.warn('Error loading image for media', media.contentId, err)
//             imgError.value = true
//             emit('error')
//             return ''
//         }
//     },
//     { lazy: true },
// )

const bouncedUrl = ref<string>('')

// watch(imgUrl, (newUrl) => {
//     if (newUrl) {
//         bouncedUrl.value = newUrl
//         imgError.value = false
//     }
// })

watch(
    () => media,
    (newMedia, oldMedia) => {
        imgError.value = false
        highResLoaded.value = false
        //
        // if (oldMedia && oldMedia.contentId !== newMedia?.contentId) {
        //     oldMedia.CancelLoad()
        // }
    },
)
</script>
