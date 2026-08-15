declare module "epubjs" {
  export interface EpubLocation {
    start?: {
      index?: number;
      cfi?: string;
      displayed?: {
        page: number;
        total: number;
      };
    };
  }

  export class Rendition {
    display(target?: string | number): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    resize(width?: number, height?: number, epubcfi?: string): void;
    on(event: string, callback: (location?: EpubLocation) => void): void;
    destroy(): void;
    manager: {
      _stageSize?: { width: number; height: number };
      container?: HTMLElement;
      isPaginated?: boolean;
    } | null;
  }

  export class Book {
    ready: Promise<boolean>;
    spine: { spineItems: unknown[] };
    archive: {
      request(url: string, type?: string): Promise<unknown>;
      createUrl(url: string, options?: Record<string, unknown>): Promise<string>;
    };
    request(
      url: string,
      type?: string,
      withCredentials?: unknown,
      headers?: Record<string, string>,
    ): Promise<unknown>;
    resolve(path: string, absolute?: boolean): string;
    on(event: string, callback: (error?: unknown) => void): void;
    renderTo(
      element: HTMLElement | string,
      options?: Record<string, unknown>,
    ): Rendition;
    destroy(): void;
  }

  export default function ePub(
    data?: ArrayBuffer | string,
    options?: Record<string, unknown>,
  ): Book;
}
