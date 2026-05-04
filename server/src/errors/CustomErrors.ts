export class AnkiConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnkiConnectionError';
  }
}

export class MediaGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaGenerationError';
  }
}

export class CardCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardCreationError';
  }
}
