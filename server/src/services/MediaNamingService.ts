export class MediaNamingService {
    /**
     * Generate a standardized filename for Anki media.
     * Format: [modelName]_[baseTerm]_[field]_[index]_[timestamp].[ext]
     * 
     * @param modelName - e.g. "JP::Vocabulary", "JP::Katakana"
     * @param baseTerm - e.g. "食べる", "cat", "dog"
     * @param field - e.g. "audio", "sentence", "illustration", "word"
     * @param extension - e.g. "mp3", "webp"
     * @param index - Optional index if there are multiple items for the same field (e.g., multiple sentences)
     * @returns A string representing the formatted filename
     */
    static generateFilename(
        modelName: string,
        baseTerm: string,
        field: string,
        extension: string,
        index?: number | string
    ): string {
        // Sanitize inputs to prevent invalid characters in filenames
        const safeModel = modelName.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-'); // JP::Vocabulary -> JP-Vocabulary
        const safeBaseTerm = baseTerm.replace(/[\/\\?%*:|"<>]/g, '_'); // Replace invalid file path chars
        const safeField = field.replace(/[^a-zA-Z0-9-]/g, '_');
        
        const timestamp = Date.now();
        const ext = extension.startsWith('.') ? extension : `.${extension}`;
        
        let filename = `${safeModel}_${safeBaseTerm}_${safeField}`;
        
        if (index !== undefined && index !== null && index !== '') {
            filename += `_${index}`;
        }
        
        filename += `_${timestamp}${ext}`;
        
        return filename;
    }
}
