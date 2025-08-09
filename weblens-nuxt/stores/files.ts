import { defineStore } from 'pinia'
import { SubToFolder, UnsubFromFolder } from '~/api/FileBrowserApi'
import WeblensFile from '~/types/weblensFile'
import useLocationStore from './location'
import { onWatcherCleanup } from 'vue'
import type { AxiosResponse } from 'axios'
import WeblensMedia from '~/types/weblensMedia'
import { useWeblensApi } from '~/api/AllApi'
import { useStorage } from '@vueuse/core'
import type { FileInfo, FolderInfo } from '@ethanrous/weblens-api'

type sorterFunc = (f1: WeblensFile, f2: WeblensFile) => number

export type FileShape = 'square' | 'row' | 'column'
export type SortCondition = 'date' | 'filename' | 'size'
type SortDirection = 1 | -1

type FolderSettings = {
    sortCondition: SortCondition
    sortDirection: SortDirection
    fileShape: FileShape
}

const folderSettingsDefault: FolderSettings = {
    sortCondition: 'date',
    sortDirection: 1,
    fileShape: 'square',
}

function getSortFunc(sortCondition: SortCondition, sortDirection: 1 | -1): sorterFunc {
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
        case 'size': {
            return (f1, f2) => {
                return (f1.GetSize() - f2.GetSize()) * sortDirection
            }
        }
    }
}

const useFilesStore = defineStore('files', () => {
    // External //
    const userStore = useUserStore()
    const locationStore = useLocationStore()
    const mediaStore = useMediaStore()
    const user = computed(() => userStore.user)

    // Local State //
    const children = shallowRef<WeblensFile[]>()

    const selectedFiles = ref<Set<string>>(new Set())
    const movedFiles = ref<Set<string>>(new Set())

    const lastSelected = ref<string | null>(null)
    const nextSelectedIndex = ref<number | null>(null) // This is used to track the next file to be selected when using shift-click

    const sortDirection = ref<SortDirection>(1)
    const sortCondition = ref<SortCondition>('filename')

    const fileShape = ref<FileShape>('square')

    const dragging = ref<boolean>(false)

    const foldersSettings = useStorage('wl-folders-settings', {} as Record<string, FolderSettings>)

    const fileSearch = ref<string>('')
    const searchRecurively = ref<boolean>(false)

    const searchUpToDate = ref<boolean>(true)

    const loading = ref<boolean>(false)

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
        'files-' + locationStore.activeFolderId,
        async () => {
            if (!user.value.isLoggedIn.isSet() || !locationStore.activeFolderId) {
                return {}
            }

            let res: AxiosResponse<FolderInfo, FolderInfo>
            if (locationStore.isInShare && !locationStore.activeShareId) {
                res = await useWeblensApi().FilesApi.getSharedFiles()
            } else {
                res = await useWeblensApi().FoldersApi.getFolder(
                    locationStore.activeFolderId,
                    locationStore.activeShareId,
                )
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
        { watch: [user, () => locationStore.activeFolderId], lazy: true },
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

    function setNextSelectedIndex(index: number) {
        nextSelectedIndex.value = index
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

        if (id === locationStore.activeFolderId) {
            return activeFile.value
        }

        return children.value.find((file) => file.Id() === id)
    }

    function addFile(file: FileInfo) {
        if (!children.value) {
            return
        }

        if (file.parentId !== locationStore.activeFolderId) {
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
            if (fileId === locationStore.activeFolderId) {
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
        if (foldersSettings.value[locationStore.activeFolderId]) {
            return
        }

        foldersSettings.value[locationStore.activeFolderId] = { ...folderSettingsDefault }
    }

    function saveFoldersSettings() {
        initFolderSettings()

        foldersSettings.value[locationStore.activeFolderId] = {
            sortCondition: sortCondition.value,
            sortDirection: sortDirection.value,
            fileShape: fileShape.value,
        }

        console.log('Saving folders settings', foldersSettings.value[locationStore.activeFolderId])
    }

    function toggleSortDirection() {
        sortDirection.value *= -1

        saveFoldersSettings()
    }

    function setFileShape(newFileShape: FileShape) {
        console.log('Setting file shape to', newFileShape)
        fileShape.value = newFileShape

        saveFoldersSettings()
    }

    function setSortCondition(newSortCondition: 'date' | 'filename' | 'size') {
        sortCondition.value = newSortCondition

        saveFoldersSettings()
    }

    function setDragging(newDragging: boolean) {
        dragging.value = newDragging
    }

    function setFileSearch(search: string) {
        fileSearch.value = search
        searchUpToDate.value = false
    }

    function setSearchRecurively(recursive: boolean) {
        searchRecurively.value = recursive
    }

    function setLoading(load: boolean) {
        loading.value = load
    }

    const searchResults = shallowRef<WeblensFile[] | undefined>()

    async function doSearch() {
        if (!fileSearch.value || fileSearch.value.trim() === '') {
            searchResults.value = undefined
            return
        }

        loading.value = true

        const res = await useWeblensApi().FilesApi.searchByFilename(fileSearch.value, locationStore.activeFolderId)
        const results = res.data.map((f) => {
            return new WeblensFile(f)
        })

        searchResults.value = getSortedChildren(results) ?? []

        searchUpToDate.value = true
        loading.value = false
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
        () => locationStore.activeFolderId,
        () => {
            selectedFiles.value = new Set()
            fileSearch.value = ''
            searchResults.value = undefined
            searchUpToDate.value = false

            initFolderSettings()
            console.log(
                'Active folder changed, initializing settings',
                foldersSettings.value[locationStore.activeFolderId],
            )
            sortCondition.value = foldersSettings.value[locationStore.activeFolderId]?.sortCondition ?? 'date'
            sortDirection.value = foldersSettings.value[locationStore.activeFolderId]?.sortDirection ?? 1
            fileShape.value = foldersSettings.value[locationStore.activeFolderId]?.fileShape ?? 'square'
        },
        { immediate: true },
    )

    watchEffect(() => {
        const _activeFolderId = locationStore.activeFolderId
        SubToFolder(_activeFolderId, locationStore.activeShareId)

        onWatcherCleanup(() => {
            UnsubFromFolder(_activeFolderId)
        })
    })

    const files = computed(() => {
        if (searchResults.value !== undefined) {
            return searchResults.value
        }

        if (!children.value) {
            return []
        }

        let files = children.value
        if (fileSearch.value !== '' && !searchRecurively.value) {
            const search = fileSearch.value.toLowerCase()

            files = files.filter((f) => {
                return f.GetFilename().toLowerCase().includes(search)
            })
        }

        return files
    })

    return {
        files,

        activeFile,

        dragging,

        children,
        parents,
        status,
        error,

        loading,
        setLoading,

        movedFiles,
        selectedFiles,

        lastSelected,
        nextSelectedIndex,
        setNextSelectedIndex,

        addFile,
        removeFiles,
        getFileById,
        setMovedFile,

        setSelected,
        selectAll,
        clearSelected,

        fileShape,
        setFileShape,

        sortDirection,
        sortCondition,
        toggleSortDirection,
        setSortCondition,

        setDragging,

        fileSearch,
        setFileSearch,
        searchRecurively,
        setSearchRecurively,
        searchResults,
        searchUpToDate,
        doSearch,
    }
})

export default useFilesStore
