export const PRODUCT_STATUS = {
    'draft': 'draft',
    'public': 'public',
    'deleted': 'deleted',
    'archived': 'archived',
    'private': 'private'
}

export function validateProductStatus(status:string|undefined):string {
    if (!status) return PRODUCT_STATUS.draft
    if (Object.keys(PRODUCT_STATUS).includes(status)) return status
    return PRODUCT_STATUS.draft
}

export function isValidProductStatus(status:string|undefined):boolean {
    if (!status) return false
    if (Object.keys(PRODUCT_STATUS).includes(status)) return true
    return false
}
