import { defineStore } from 'pinia'
import { useWeblensApi } from '~/api/AllApi'

export const useTowerStore = defineStore('tower', () => {
    const { data: towerInfo } = useAsyncData(
        'tower',
        async () => {
            const towerRes = await useWeblensApi().TowersApi.getServerInfo()
            return towerRes.data
        },
        { immediate: true, lazy: false },
    )

    return { towerInfo }
})
