import { defineStore } from 'pinia'

export enum FbModeT {
    unset,
    default,
    share,
    external,
    stats,
    search,
}

const useLocationStore = defineStore('location', () => {
    const shareId = ''

    return { shareId }
})

export default useLocationStore
