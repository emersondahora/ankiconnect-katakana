export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface WordItem {
    word: string;
    meaning: string;
    sentences: string[];
    imageTerms: string[];
}

export function getSearchTerms(item: WordItem): string[] {
    return item.imageTerms?.length > 0 && item.imageTerms[0] !== ''
        ? item.imageTerms
        : [item.meaning];
}
