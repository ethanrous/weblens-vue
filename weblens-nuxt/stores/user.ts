import type { UserInfo } from '@/api/swag'
import { defineStore } from 'pinia'
import { useWeblensApi } from '~/api/AllApi'
import User from '~/types/user'

export const useUserStore = defineStore('user', () => {
    const user = shallowRef(new User())

    function setUser(info: UserInfo, isLoggedIn: boolean = false) {
        user.value = new User(info, isLoggedIn)
    }

    async function loadUser(): Promise<void> {
        if (user.value.isLoggedIn.isSet()) {
            return
        }

        await useWeblensApi()
            .UsersApi.getUser()
            .then((res) => setUser(res.data, true))
            .catch(() => setUser({} as UserInfo, false))

        console.log('Loading user info...', user.value)
    }

    onMounted(() => {
        loadUser()
    })

    return { user, setUser }
})
