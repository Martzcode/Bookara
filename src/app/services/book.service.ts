import { Injectable, inject, signal } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { LanguageService } from "../i18n/language.service";

export type BookFormat = "pdf" | "epub";

export interface Book {
  path: string;
  name: string;
  format: BookFormat;
}

@Injectable({ providedIn: "root" })
export class BookService {
  readonly book = signal<Book | null>(null);

  private languageService = inject(LanguageService);

  async openBook(): Promise<boolean> {
    const result = await open({
      multiple: false,
      directory: false,
      title: this.languageService.translate("book.openTitle"),
      filters: [
        { name: "Livres", extensions: ["pdf", "epub"] },
        { name: "PDF", extensions: ["pdf"] },
        { name: "EPUB", extensions: ["epub"] },
      ],
    });

    if (typeof result !== "string") {
      return false;
    }

    const format: BookFormat = result.toLowerCase().endsWith(".epub")
      ? "epub"
      : "pdf";
    const name = result.split(/[\\/]/).pop() ?? result;

    this.book.set({ path: result, name, format });
    return true;
  }

  closeBook(): void {
    this.book.set(null);
  }

  async readBookData(book: Book): Promise<ArrayBuffer> {
    const data = await invoke<ArrayBuffer | Uint8Array | number[]>(
      "read_book_file",
      { path: book.path },
    );
    if (data instanceof ArrayBuffer) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength,
      );
    }
    if (Array.isArray(data)) {
      return new Uint8Array(data).buffer;
    }
    throw new Error("Réponse binaire invalide du backend");
  }
}
