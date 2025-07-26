import { defineStore } from 'pinia'
import { SubToFolder, UnsubFromFolder } from '~/api/FileBrowserApi'
import WeblensFile from '~/types/weblensFile'
import useLocationStore from './location'
import { onWatcherCleanup } from 'vue'
import type { FileInfo, FolderInfo } from '~/api/swag'
import type { AxiosResponse } from 'axios'
import WeblensShare from '~/types/weblensShare'
import WeblensMedia from '~/types/weblensMedia'
import { useWeblensApi } from '~/api/AllApi'
import { useStorage } from '@vueuse/core'

type sorterFunc = (f1: WeblensFile, f2: WeblensFile) => number

type folderSettings = {
    sortCondition: 'date' | 'filename' | 'size'
    sortDirection: 1 | -1
}

function getSortFunc(sortCondition: string, sortDirection: 1 | -1): sorterFunc {
    console.debug('Sorting files by', sortCondition, 'in direction', sortDirection)

    switch (sortCondition) {
        case 'filename': {
            return (f1, f2) => {
                return f1.GetFilename().localeCompare(f2.GetFilename(), undefined, { numeric: true }) * sortDirection
            }
        }
        case 'date': {
            return (f1, f2) => {
                return (f1.GetModified().getTime() - f2.GetModified().getTime()) * sortDirection
            }
        }
    }

    return (_, __) => 0
}

const useFilesStore = defineStore('files', () => {
    // Global //
    const route = useRoute()

    // External //
    const userStore = useUserStore()
    const locationStore = useLocationStore()
    const mediaStore = useMediaStore()
    const user = computed(() => userStore.user)

    // Local State //
    const selectedFiles = ref<Set<string>>(new Set())
    const movedFiles = ref<Set<string>>(new Set())
    const children = shallowRef<WeblensFile[]>()
    const lastSelected = ref<string | null>(null)
    const sortDirection = ref<1 | -1>(1)
    const sortCondition = ref<'date' | 'filename' | 'size'>('filename')
    const dragging = ref<boolean>(false)

    const foldersSettings = useStorage('wl-folders-settings', {} as Record<string, folderSettings>)

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
        return route.params.shareId as string | undefined
    })

    const isInShare = computed(() => {
        return (route.name as string | undefined)?.startsWith('files-share') ?? false
    })

    const timeline = computed(() => {
        return route.query['timeline'] === 'true'
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

    function getSortedChildren(newChildren?: WeblensFile[]): WeblensFile[] | undefined {
        if (!children.value && !newChildren) {
            console.error('Get sorted children no children to sort')
            return
        }

        if (!newChildren) {
            newChildren = [...children.value!]
        }

        newChildren.sort(getSortFunc(sortCondition.value, sortDirection.value))

        return newChildren
    }

    const { data, error, status } = useAsyncData(
        'files-' + activeFolderId.value,
        async () => {
            if (!user.value.isLoggedIn.isSet() || !activeFolderId.value) {
                return {}
            }

            let res: AxiosResponse<FolderInfo, FolderInfo>
            if (isInShare.value && !activeShareId.value) {
                res = await useWeblensApi().FilesApi.getSharedFiles()
            } else {
                res = await useWeblensApi().FoldersApi.getFolder(activeFolderId.value, activeShareId.value)
            }

            if (!res.data.self || !res.data.children) {
                return {}
            }

            const newChildren = res.data.children
                ?.map((fInfo) => {
                    const f = new WeblensFile(fInfo)
                    f.displayable =
                        (f.contentId !== '' &&
                            res.data.medias?.findIndex((mediaInfo) => mediaInfo.contentId === f.contentId) !== -1) ??
                        false
                    return f
                })
                .filter((file) => !file.IsTrash())

            const mediaMap = new Map<string, WeblensMedia>()
            res.data.medias?.forEach((mInfo) => {
                const m = new WeblensMedia(mInfo)
                mediaMap.set(m.contentId, m)
            })

            mediaStore.addMedia(...(res.data.medias ?? []))

            newChildren.forEach((f) => {
                const m = mediaMap.get(f.contentId)
                if (!m) {
                    return
                }

                f.contentCreationDate = new Date(m.createDate)
            })

            children.value = getSortedChildren(newChildren)!

            const parents = res.data.parents?.map((fInfo) => new WeblensFile(fInfo))
            const activeFile = new WeblensFile(res.data.self)
            return { activeFile: activeFile, children: newChildren, parents }
        },
        { watch: [user, activeFolderId], lazy: true },
    )

    // Funcs //
    function setSelected(fileId: string, selected: boolean) {
        console.log('Setting selected file', fileId, 'to', selected)
        if (selected) {
            selectedFiles.value.add(fileId)
            lastSelected.value = fileId
        } else {
            selectedFiles.value.delete(fileId)
        }

        selectedFiles.value = new Set(selectedFiles.value)
    }

    function selectAll() {
        if (!children.value) {
            return
        }

        selectedFiles.value = new Set(children.value.map((file) => file.Id()))
    }

    function clearSelected() {
        selectedFiles.value = new Set()
    }

    function getFileById(id: string): WeblensFile | undefined {
        if (!children.value) {
            return undefined
        }

        if (id === activeFolderId.value) {
            return activeFile.value
        }

        return children.value.find((file) => file.Id() === id)
    }

    function addFile(file: FileInfo) {
        if (!children.value) {
            return
        }

        if (file.parentId !== activeFolderId.value) {
            return
        }

        const newFile = new WeblensFile(file)

        const index = children.value.findIndex((file) => file.Id() === newFile.Id())
        if (index !== -1) {
            children.value.splice(index, 1)
        }

        children.value.push(newFile)

        children.value = getSortedChildren()
    }

    function removeFiles(...fileIds: string[]) {
        if (!children.value) {
            return
        }

        const newChildren = children.value

        for (const fileId of fileIds) {
            if (fileId === activeFolderId.value) {
                console.warn('Cannot remove the active folder')
                continue
            }

            const index = newChildren.findIndex((file) => file.Id() === fileId)
            if (index !== -1) {
                newChildren.splice(index, 1)
            } else {
                console.warn(`File with ID ${fileId} not found in children`)
            }
        }

        setMovedFile(fileIds, false)
        children.value = [...newChildren] // Trigger reactivity
    }

    function setMovedFile(fileIds: string[], moved: boolean) {
        for (const fileId of fileIds) {
            if (moved) {
                movedFiles.value.add(fileId)
            } else {
                movedFiles.value.delete(fileId)
            }
        }

        movedFiles.value = new Set(movedFiles.value)
    }

    function initFolderSettings() {
        if (foldersSettings.value[activeFolderId.value]) {
            return
        }

        foldersSettings.value[activeFolderId.value] = {
            sortCondition: 'date',
            sortDirection: 1,
        }
    }

    function toggleSortDirection() {
        sortDirection.value *= -1

        initFolderSettings()
        foldersSettings.value[activeFolderId.value].sortDirection = sortDirection.value as 1 | -1
    }

    function setSortCondition(newSortCondition: 'date' | 'filename' | 'size') {
        sortCondition.value = newSortCondition

        initFolderSettings()
        foldersSettings.value[activeFolderId.value].sortCondition = sortCondition.value
    }

    function setTimeline(timeline: boolean) {
        navigateTo({
            query: {
                ...route.query,
                timeline: String(timeline),
            },
        })
    }

    function setDragging(newDragging: boolean) {
        dragging.value = newDragging
    }

    // Computed Properties //
    const activeFile = computed(() => {
        return data.value?.activeFile
    })

    const parents = computed(() => {
        return data.value?.parents
    })

    // Watchers //
    watchEffect(() => {
        if (children.value) {
            children.value = getSortedChildren()
        }
    })

    // When the active folder changes, clear selected files and reinitialize folder settings
    watch(
        activeFolderId,
        () => {
            selectedFiles.value = new Set()

            initFolderSettings()
            console.log('Active folder changed, initializing settings', foldersSettings.value[activeFolderId.value])
            sortCondition.value = foldersSettings.value[activeFolderId.value]?.sortCondition ?? 'date'
            sortDirection.value = foldersSettings.value[activeFolderId.value]?.sortDirection ?? 1
        },
        { immediate: true },
    )

    watchEffect(() => {
        const _activeFolderId = activeFolderId.value
        SubToFolder(_activeFolderId, locationStore.shareId)

        onWatcherCleanup(() => {
            UnsubFromFolder(_activeFolderId)
        })
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

        if (isInShare.value && activeShare.value && !route.params.fileId) {
            return navigateTo({
                path: `/files/share/${activeShareId.value}/${activeShare.value?.fileId}`,
                query: route.query,
            })
        }
    })

    return {
        activeFolderId,
        activeFile,

        dragging,

        activeShareId,
        activeShare,
        isInShare,

        timeline,
        setTimeline,

        children,
        parents,
        status,
        error,

        movedFiles,
        selectedFiles,

        lastSelected,

        addFile,
        removeFiles,
        getFileById,
        setMovedFile,

        setSelected,
        selectAll,
        clearSelected,

        sortDirection,
        sortCondition,
        toggleSortDirection,
        setSortCondition,

        setDragging,
    }
})

export default useFilesStore
