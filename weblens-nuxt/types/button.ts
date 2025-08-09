export type ButtonProps = {
    label?: string
    type?: 'default' | 'outline' | 'light'
    flavor?: 'primary' | 'danger' | 'secondary'
    selected?: boolean
    danger?: boolean
    squareSize?: number
    fillWidth?: boolean
    centerContent?: boolean
    allowCollapse?: boolean
    disabled?: boolean
    merge?: 'row' | 'column'
    onClick?: ((e: MouseEvent) => Promise<void>) | ((e: MouseEvent) => void)
}
