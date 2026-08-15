import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
} from "@angular/core";
import { LanguageService } from "../i18n/language.service";
import { languageNames, supportedLangs, type Lang } from "../i18n/translations";

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  dividerAfter?: boolean;
  checked?: boolean;
  action?: () => void;
}

interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

@Component({
  selector: "app-menubar",
  imports: [],
  templateUrl: "./menubar.component.html",
  styleUrl: "./menubar.component.css",
})
export class MenubarComponent {
  private elementRef = inject(ElementRef);
  private languageService = inject(LanguageService);

  menus = computed<Menu[]>(() => {
    const t = (key: string) => this.languageService.translate(key);
    const lang = this.languageService.currentLang();

    return [
      {
        id: "file",
        label: t("menu.file"),
        items: [
          { id: "new", label: t("file.new"), shortcut: "Ctrl+N" },
          { id: "open", label: t("file.open"), shortcut: "Ctrl+O" },
          { id: "save", label: t("file.save"), shortcut: "Ctrl+S" },
          { id: "save-as", label: t("file.saveAs") },
          {
            id: "exit",
            label: t("file.exit"),
            shortcut: "Alt+F4",
            dividerAfter: true,
          },
        ],
      },
      {
        id: "edit",
        label: t("menu.edit"),
        items: [
          { id: "undo", label: t("edit.undo"), shortcut: "Ctrl+Z" },
          {
            id: "redo",
            label: t("edit.redo"),
            shortcut: "Ctrl+Y",
            dividerAfter: true,
          },
          { id: "cut", label: t("edit.cut"), shortcut: "Ctrl+X" },
          { id: "copy", label: t("edit.copy"), shortcut: "Ctrl+C" },
          { id: "paste", label: t("edit.paste"), shortcut: "Ctrl+V", dividerAfter: true },
          { id: "select-all", label: t("edit.selectAll"), shortcut: "Ctrl+A" },
        ],
      },
      {
        id: "view",
        label: t("menu.view"),
        items: [
          { id: "fullscreen", label: t("view.fullscreen"), shortcut: "F11" },
          { id: "zoom-in", label: t("view.zoomIn"), shortcut: "Ctrl++" },
          { id: "zoom-out", label: t("view.zoomOut"), shortcut: "Ctrl+-" },
          { id: "zoom-reset", label: t("view.zoomReset"), shortcut: "Ctrl+0" },
        ],
      },
      {
        id: "language",
        label: t("menu.language"),
        items: supportedLangs.map((code: Lang) => ({
          id: `lang-${code}`,
          label: languageNames[code],
          checked: lang === code,
          action: () => this.languageService.setLang(code),
        })),
      },
      {
        id: "help",
        label: t("menu.help"),
        items: [
          { id: "docs", label: t("help.docs") },
          { id: "report", label: t("help.report") },
          {
            id: "about",
            label: t("help.about"),
            dividerAfter: true,
          },
        ],
      },
    ];
  });

  openMenu: string | null = null;
  focusedIndex: number | null = null;

  get currentItems(): MenuItem[] {
    const menu = this.menus().find((m) => m.id === this.openMenu);
    return menu ? menu.items : [];
  }

  toggleMenu(id: string): void {
    this.openMenu = this.openMenu === id ? null : id;
    this.focusedIndex = null;
  }

  onMenuEnter(id: string): void {
    if (this.openMenu !== null && this.openMenu !== id) {
      this.openMenu = id;
      this.focusedIndex = null;
    }
  }

  onItemClick(item: MenuItem, index: number): void {
    void index;
    if (item.action) {
      item.action();
    }
    this.close();
  }

  onItemEnter(index: number): void {
    this.focusedIndex = index;
  }

  close(): void {
    this.openMenu = null;
    this.focusedIndex = null;
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const items = this.currentItems;
    if (items.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.focusedIndex =
          this.focusedIndex === null
            ? 0
            : (this.focusedIndex + 1) % items.length;
        break;
      case "ArrowUp":
        event.preventDefault();
        this.focusedIndex =
          this.focusedIndex === null || this.focusedIndex === 0
            ? items.length - 1
            : this.focusedIndex - 1;
        break;
      case "Enter":
        event.preventDefault();
        if (this.focusedIndex !== null) {
          this.onItemClick(items[this.focusedIndex], this.focusedIndex);
        }
        break;
      case "Escape":
        event.preventDefault();
        this.close();
        break;
    }
  }

  @HostListener("document:keydown.escape")
  onDocumentEscape(): void {
    this.close();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
