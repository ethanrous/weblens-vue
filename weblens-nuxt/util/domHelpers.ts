export function isParent(parent: Element, child: Element): boolean {
    if (!parent || !child) return false
    let currentElement = child.parentElement
    while (currentElement) {
        if (currentElement === parent) {
            return true
        }
        currentElement = currentElement.parentElement
    }
    return false
}
