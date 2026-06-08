import { BaseCardService } from './cards/BaseCardService.js';
import { KatakanaCardService } from './cards/KatakanaCardService.js';
import { KanjiCardService } from './cards/KanjiCardService.js';
import { VocabularyCardService } from './cards/VocabularyCardService.js';
import { GrammarCardService } from './cards/GrammarCardService.js';

export class CardCreationService {
    static getService(modelName: string): BaseCardService {
        switch (modelName) {
            case 'JP::Kanji':
                return new KanjiCardService();
            case 'JP::Vocabulary':
                return new VocabularyCardService();
            case 'JP::Grammar':
                return new GrammarCardService();
            case 'JP::Katakana':
            default:
                return new KatakanaCardService();
        }
    }

    static async process(item: Record<string, any>, noteId: string, deckName: string, modelName: string, isUpdate = false, ankiNoteId?: number): Promise<Record<string, string>> {
        const service = this.getService(modelName);
        return await service.process(item, noteId, deckName, isUpdate, ankiNoteId);
    }
}

