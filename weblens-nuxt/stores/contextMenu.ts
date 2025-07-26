import { defineStore } from 'pinia'
import type { coordinates } from '~/types/style'

export const useContextMenuStore = defineStore('contextMenu', () => {
    const isOpen = ref<boolean>(false)
    const isSharing = ref<boolean>(false)

    const menuPosition = ref<coordinates>({ x: -1, y: -1 })

    const directTargetId = ref<string>('')

    function setMenuOpen(open: boolean) {
        isOpen.value = open
    }

    function setSharing(sharing: boolean) {
        isOpen.value = false
        isSharing.value = sharing
    }

    function setMenuPosition(pos: coordinates) {
        menuPosition.value = pos
    }

    function setTarget(id: string) {
        directTargetId.value = id
    }

    return {
        isOpen,
        isSharing,
        menuPosition,
        directTargetId,

        setMenuOpen,
        setSharing,
        setMenuPosition,
        setTarget,
    }
})
