import { defineStore } from 'pinia'
import { useWeblensApi } from '~/api/AllApi'
import WeblensShare from '~/types/weblensShare'

export enum FbModeT {
    unset,
    default,
    share,
    external,
    stats,
    search,
}

const useLocationStore = defineStore('location', () => {
    const route = useRoute()
    const userStore = useUserStore()

    const user = computed(() => userStore.user)

    const activeFolderId = computed(() => {
        let fileId = route.params.fileId
        if (fileId === 'home') {
            fileId = user.value.homeId
        }

        if (fileId === 'trash') {
            fileId = user.value.trashId
        }

        return fileId as string
    })

    const activeShareId = computed(() => {
        return (route.params.shareId as string | undefined) ?? ''
    })

    const isInShare = computed(() => {
        return (route.name as string | undefined)?.startsWith('files-share') ?? false
    })

    const { data: activeShare } = useAsyncData('share-' + route.params.shareId, async () => {
        if (!route.params.shareId) {
            return
        }

        if (Array.isArray(route.params.shareId)) {
            console.warn('ShareId param is array')
            return
        }

        const shareInfo = (await useWeblensApi().SharesApi.getFileShare(route.params.shareId)).data

        return new WeblensShare(shareInfo)
    })

    const inShareRoot = computed(() => {
        return isInShare.value && !activeShare.value
    })

    const isInFiles = computed(() => {
        return (route.name as string | undefined)?.startsWith('files') ?? false
    })

    watchEffect(() => {
        if (!isInFiles.value) return

        const loggedIn = userStore.user.isLoggedIn
        if ((!isInShare.value || !activeShareId.value) && loggedIn.isSet() && !loggedIn.get()) {
            console.warn('User is not logged in and not in share, redirecting to login page')

            return navigateTo({ path: '/login' })
        }

        if (isInShare && activeShare.value && !route.params.fileId) {
            console.log('No fileId in route, redirecting to share root', activeShare)
            return navigateTo({
                path: `/files/share/${activeShareId.value}/${activeShare.value?.fileId}`,
                query: route.query,
            })
        }
    })

    const isInTimeline = computed(() => {
        return route.query['timeline'] === 'true'
    })

    function setTimeline(timeline: boolean) {
        navigateTo({
            query: {
                ...route.query,
                timeline: String(timeline),
            },
        })
    }

    return {
        activeShareId,
        isInShare,
        activeShare,
        inShareRoot,

        activeFolderId,
        isInTimeline,

        setTimeline,
    }
})

export default useLocationStore
