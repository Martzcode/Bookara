import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { Book, BookService } from "../services/book.service";
import { LanguageService } from "../i18n/language.service";

@Component({
  selector: "app-book-viewer",
  imports: [],
  templateUrl: "./book-viewer.component.html",
  styleUrl: "./book-viewer.component.css",
})
export class BookViewerComponent {
  @Input({ required: true }) book!: Book;

  private bookService = inject(BookService);
  private languageService = inject(LanguageService);
  private host = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(0);
  canPrev = signal(false);
  canNext = signal(false);

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  private pdfDoc: any = null;
  private epubRendition: any = null;
  private epubBook: any = null;
  private epubSections: any[] = [];
  private epubIframe: HTMLIFrameElement | null = null;
  private currentSectionIndex = 0;
  private resizeObserver: ResizeObserver | null = null;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    const book = changes["book"];
    if (book && !book.firstChange && book.currentValue.path !== book.previousValue.path) {
      this.cleanup();
      this.loading.set(true);
      this.error.set(null);
      this.currentPage.set(1);
      this.totalPages.set(0);
      this.canPrev.set(false);
      this.canNext.set(false);
      this.cdr.detectChanges();
      await this.load();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    this.pdfDoc?.destroy?.();
    this.pdfDoc = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.epubRendition?.destroy?.();
    this.epubRendition = null;
    this.epubBook?.destroy?.();
    this.epubBook = null;
    this.epubIframe = null;
    this.epubSections = [];
  }

  private async load(): Promise<void> {
    try {
      const data = await this.bookService.readBookData(this.book);
      this.loading.set(false);
      this.cdr.detectChanges();
      await this.render(data);
    } catch (err) {
      this.error.set(String(err));
      this.loading.set(false);
    }
  }

  private async render(data: ArrayBuffer): Promise<void> {
    if (this.book.format === "pdf") {
      await this.renderPdf(data);
    } else {
      await this.renderEpub(data);
    }
  }

  private async renderPdf(data: ArrayBuffer): Promise<void> {
    const pdfjsLib = await import("pdfjs-dist");
    const canvas = this.host.nativeElement.querySelector("canvas.pdf-canvas");
    if (!canvas) return;

    pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/pdf.worker.min.mjs";

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
    this.pdfDoc = await loadingTask.promise;
    this.totalPages.set(this.pdfDoc.numPages);
    this.canNext.set(this.totalPages() > 1);
    await this.renderPdfPage(1);
  }

  private async renderPdfPage(n: number): Promise<void> {
    if (!this.pdfDoc) return;
    const canvas = this.host.nativeElement.querySelector("canvas.pdf-canvas");
    if (!canvas) return;
    const page = await this.pdfDoc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const container = canvas.parentElement as HTMLElement;
    const maxWidth = container ? container.clientWidth - 32 : 600;
    const scale = Math.max(0.5, Math.min(maxWidth / base.width, 2));
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    this.currentPage.set(n);
    this.canPrev.set(n > 1);
    this.canNext.set(n < this.pdfDoc.numPages);
  }

  private async renderEpub(data: ArrayBuffer): Promise<void> {
    const { default: ePub } = await import("epubjs");
    const container = this.host.nativeElement.querySelector(".epub-container");
    if (!container) return;

    await this.waitForSize(container);

    const book = ePub(data, {
      requestMethod: (url: string, type?: string) =>
        book.archive.request(url, type),
    });
    this.epubBook = book;
    book.on("openFailed", (err) => {
      this.error.set(String(err));
      this.cdr.detectChanges();
    });
    await book.ready;

    this.epubSections = book.spine.spineItems ?? [];
    this.totalPages.set(this.epubSections.length);

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.background = "#ffffff";
    container.innerHTML = "";
    container.appendChild(iframe);
    this.epubIframe = iframe;

    await this.renderEpubSection(0);

    this.resizeObserver = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && this.epubIframe) {
        this.epubIframe.style.width = r.width + "px";
        this.epubIframe.style.height = r.height + "px";
      }
    });
    this.resizeObserver.observe(container);
  }

  private async renderEpubSection(i: number): Promise<void> {
    const section = this.epubSections[i];
    if (!section || !this.epubIframe) return;
    this.currentSectionIndex = i;
    this.currentPage.set(i + 1);
    this.canPrev.set(i > 0);
    this.canNext.set(i < this.epubSections.length - 1);
    this.cdr.detectChanges();

    try {
      const request = this.epubBook.request.bind(this.epubBook);
      const html = await section.render(request);
      const doc = await this.buildEpubDocument(html);
      const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      this.epubIframe.src = url;
      await this.waitForIframeLoad(this.epubIframe);
    } catch (err) {
      console.error("[epub] section render failed", err);
      this.error.set(`Section ${i + 1} : ${String(err)}`);
      this.cdr.detectChanges();
    }
  }

  private async buildEpubDocument(html: string): Promise<string> {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, "text/html");
    parsed.querySelectorAll("base").forEach((b) => b.remove());
    parsed.querySelectorAll("script").forEach((s) => s.remove());

    const styles = await this.collectEpubStyles(parsed);
    await this.rewriteEpubMedia(parsed);

    const body = parsed.body;
    const content = body ? body.innerHTML : "";
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body { margin: 0; padding: 16px; }
  body { color: #1f2328; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.6; }
  img { max-width: 100%; height: auto; }
  ${styles}
</style>
</head>
<body>${content}</body>
</html>`;
  }

  private async collectEpubStyles(doc: Document): Promise<string> {
    let css = "";
    const links = Array.from(doc.querySelectorAll('link[rel~="stylesheet"]'));
    for (const link of links) {
      const href = link.getAttribute("href");
      link.remove();
      if (!href) continue;
      try {
        const resolved = this.epubBook.resolve(href);
        const text = await this.epubBook.request(resolved);
        css += `\n${text}`;
      } catch (err) {
        console.warn("[epub] stylesheet load failed", href, err);
      }
    }
    return css;
  }

  private async rewriteEpubMedia(doc: Document): Promise<void> {
    const rewrite = async (el: HTMLElement, attr: string) => {
      const src = el.getAttribute(attr);
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const resolved = this.epubBook.resolve(src);
        const url = await this.epubBook.archive.createUrl(resolved);
        el.setAttribute(attr, url);
      } catch (err) {
        console.warn("[epub] media load failed", src, err);
      }
    };
    const jobs: Promise<void>[] = [];
    doc.querySelectorAll("img").forEach((el) => jobs.push(rewrite(el as HTMLElement, "src")));
    doc.querySelectorAll("image").forEach((el) =>
      jobs.push(rewrite(el as unknown as HTMLElement, "href")),
    );
    doc.querySelectorAll("source").forEach((el) =>
      jobs.push(rewrite(el as HTMLElement, "src")),
    );
    await Promise.allSettled(jobs);
  }

  private async waitForSize(el: HTMLElement): Promise<void> {
    const start = performance.now();
    while (performance.now() - start < 2000) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }
  }

  private waitForIframeLoad(frame: HTMLIFrameElement): Promise<void> {
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 5000);
      const onload = () => {
        clearTimeout(timeout);
        frame.removeEventListener("load", onload);
        resolve();
      };
      frame.addEventListener("load", onload);
    });
  }

  async next(): Promise<void> {
    if (this.book.format === "pdf") {
      await this.renderPdfPage(this.currentPage() + 1);
    } else if (this.epubSections.length) {
      await this.renderEpubSection(this.currentSectionIndex + 1);
    }
  }

  async prev(): Promise<void> {
    if (this.book.format === "pdf") {
      await this.renderPdfPage(this.currentPage() - 1);
    } else if (this.epubSections.length) {
      await this.renderEpubSection(this.currentSectionIndex - 1);
    }
  }
}
