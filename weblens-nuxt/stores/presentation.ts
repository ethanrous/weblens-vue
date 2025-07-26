import { defineStore } from 'pinia'

export const usePresentationStore = defineStore('presentation', () => {
    const presentationFileId = ref('')
    const presentationMediaId = ref('')

    const onMovePresentation = ref<((direction: number) => void) | null>(null)

    function setPresentationFileId(newId: string) {
        presentationFileId.value = newId
    }

    function setPresentationMediaId(newId: string) {
        presentationMediaId.value = newId
    }

    function setOnMovePresentation(cb: (direction: number) => void) {
        onMovePresentation.value = cb
    }

    function clearPresentation() {
        presentationFileId.value = ''
        presentationMediaId.value = ''
    }

    return {
        presentationFileId,
        presentationMediaId,
        onMovePresentation,
        setPresentationFileId,
        setPresentationMediaId,
        setOnMovePresentation,
        clearPresentation,
    }
})
