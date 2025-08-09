import type { Icon } from '@tabler/icons-vue'
import type { ButtonProps } from './button'

export type TableColumns = Record<string, TableColumn>[]

export type TableColumn =
    | string
    | ({
          tableType: 'button'
          onclick?: (e: Event) => void
          icon?: Icon
      } & ButtonProps)
    | {
          tableType: 'checkbox'
          label?: string
          checked: boolean
          onchanged: (value: boolean) => void
      }
