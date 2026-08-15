import { Component, inject } from "@angular/core";
import { TitlebarComponent } from "./titlebar/titlebar.component";
import { BookViewerComponent } from "./book-viewer/book-viewer.component";
import { BookService } from "./services/book.service";
import { LanguageService } from "./i18n/language.service";

@Component({
  selector: "app-root",
  imports: [TitlebarComponent, BookViewerComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  private bookService = inject(BookService);
  private languageService = inject(LanguageService);

  readonly book = this.bookService.book;

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}
