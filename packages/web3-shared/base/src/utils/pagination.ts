export function createPageable<Item, Indicator = number | number>(
    data: Item[],
    indicator: Indicator,
    nextIndicator?: Indicator,
) {
    if (typeof nextIndicator !== 'undefined') {
        return {
            data,
            indicator,
            nextIndicator,
        }
    }
    return {
        data,
        indicator,
    }
}
