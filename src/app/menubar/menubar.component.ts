import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
} from "@angular/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BookService } from "../services/book.service";
import { LanguageService } from "../i18n/language.service";
import { languageNames, supportedLangs, type Lang } from "../i18n/translations";

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  dividerAfter?: boolean;
  checked?: boolean;
  header?: boolean;
  submenu?: MenuItem[];
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
  private bookService = inject(BookService);
  private window = getCurrentWindow();

  menus = computed<Menu[]>(() => {
    const t = (key: string) => this.languageService.translate(key);
    const lang = this.languageService.currentLang();

    return [
      {
        id: "file",
        label: t("menu.file"),
        items: [
          {
            id: "open",
            label: t("file.open"),
            shortcut: "Ctrl+O",
            action: () => void this.bookService.openBook(),
          },
          {
            id: "close",
            label: t("file.close"),
            shortcut: "Ctrl+W",
            action: () => this.bookService.closeBook(),
          },
          { id: "save", label: t("file.save"), shortcut: "Ctrl+S" },
          { id: "save-as", label: t("file.saveAs") },
          {
            id: "exit",
            label: t("file.exit"),
            shortcut: "Alt+F4",
            dividerAfter: true,
            action: () => void this.window.close(),
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
        id: "settings",
        label: t("menu.settings"),
        items: [
          {
            id: "settings-language",
            label: t("settings.language"),
            submenu: supportedLangs.map((code: Lang): MenuItem => ({
              id: `lang-${code}`,
              label: languageNames[code],
              checked: lang === code,
              action: () => this.languageService.setLang(code),
            })),
          },
        ],
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
  openSubmenu: string | null = null;
  submenuIndex: number | null = null;

  get currentItems(): MenuItem[] {
    const menu = this.menus().find((m) => m.id === this.openMenu);
    return menu ? menu.items : [];
  }

  toggleMenu(id: string): void {
    this.openMenu = this.openMenu === id ? null : id;
    this.focusedIndex = null;
    this.openSubmenu = null;
    this.submenuIndex = null;
  }

  onMenuEnter(id: string): void {
    if (this.openMenu !== null && this.openMenu !== id) {
      this.openMenu = id;
      this.focusedIndex = null;
      this.openSubmenu = null;
      this.submenuIndex = null;
    }
  }

  onItemClick(item: MenuItem, index: number): void {
    void index;
    if (item.submenu) {
      this.openSubmenu = this.openSubmenu === item.id ? null : item.id;
      this.submenuIndex = this.openSubmenu ? 0 : null;
      return;
    }
    if (item.action) {
      item.action();
    }
    this.close();
  }

  onItemEnter(index: number, item: MenuItem): void {
    this.focusedIndex = index;
    if (item.submenu) {
      if (this.openSubmenu !== item.id) {
        this.openSubmenu = item.id;
        this.submenuIndex = null;
      }
    } else if (this.openSubmenu) {
      this.openSubmenu = null;
      this.submenuIndex = null;
    }
  }

  onSubmenuEnter(index: number): void {
    this.submenuIndex = index;
  }

  onSubmenuClick(item: MenuItem): void {
    if (item.action) {
      item.action();
    }
    this.close();
  }

  close(): void {
    this.openMenu = null;
    this.focusedIndex = null;
    this.openSubmenu = null;
    this.submenuIndex = null;
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const items = this.currentItems;
    if (items.length === 0) return;

    const submenu =
      this.openSubmenu !== null
        ? items.find((i) => i.id === this.openSubmenu)?.submenu ?? null
        : null;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (submenu) {
          this.submenuIndex =
            this.submenuIndex === null
              ? 0
              : (this.submenuIndex + 1) % submenu.length;
        } else {
          this.focusedIndex =
            this.focusedIndex === null
              ? 0
              : (this.focusedIndex + 1) % items.length;
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (submenu) {
          this.submenuIndex =
            this.submenuIndex === null || this.submenuIndex === 0
              ? submenu.length - 1
              : this.submenuIndex - 1;
        } else {
          this.focusedIndex =
            this.focusedIndex === null || this.focusedIndex === 0
              ? items.length - 1
              : this.focusedIndex - 1;
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (!submenu && this.focusedIndex !== null && items[this.focusedIndex].submenu) {
          this.openSubmenu = items[this.focusedIndex].id;
          this.submenuIndex = 0;
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (this.openSubmenu) {
          this.openSubmenu = null;
          this.submenuIndex = null;
        }
        break;
      case "Enter":
        event.preventDefault();
        if (submenu && this.submenuIndex !== null) {
          this.onSubmenuClick(submenu[this.submenuIndex]);
        } else if (this.focusedIndex !== null && !items[this.focusedIndex].header) {
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

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
      event.preventDefault();
      void this.bookService.openBook();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "w"
    ) {
      event.preventDefault();
      this.bookService.closeBook();
    }
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
