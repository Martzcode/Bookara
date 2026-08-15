import {
  Component,
  ElementRef,
  HostListener,
  inject,
} from "@angular/core";

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  dividerAfter?: boolean;
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

  menus: Menu[] = [
    {
      id: "file",
      label: "Fichier",
      items: [
        { id: "new", label: "Nouveau", shortcut: "Ctrl+N" },
        { id: "open", label: "Ouvrir…", shortcut: "Ctrl+O" },
        { id: "save", label: "Enregistrer", shortcut: "Ctrl+S" },
        { id: "save-as", label: "Enregistrer sous…" },
        { id: "exit", label: "Quitter", shortcut: "Alt+F4", dividerAfter: true },
      ],
    },
    {
      id: "edit",
      label: "Édition",
      items: [
        { id: "undo", label: "Annuler", shortcut: "Ctrl+Z" },
        { id: "redo", label: "Rétablir", shortcut: "Ctrl+Y", dividerAfter: true },
        { id: "cut", label: "Couper", shortcut: "Ctrl+X" },
        { id: "copy", label: "Copier", shortcut: "Ctrl+C" },
        { id: "paste", label: "Coller", shortcut: "Ctrl+V", dividerAfter: true },
        { id: "select-all", label: "Tout sélectionner", shortcut: "Ctrl+A" },
      ],
    },
    {
      id: "view",
      label: "Affichage",
      items: [
        { id: "fullscreen", label: "Plein écran", shortcut: "F11" },
        { id: "zoom-in", label: "Zoom avant", shortcut: "Ctrl++" },
        { id: "zoom-out", label: "Zoom arrière", shortcut: "Ctrl+-" },
        { id: "zoom-reset", label: "Réinitialiser le zoom", shortcut: "Ctrl+0" },
      ],
    },
    {
      id: "help",
      label: "Aide",
      items: [
        { id: "docs", label: "Documentation" },
        { id: "report", label: "Signaler un problème" },
        { id: "about", label: "À propos de Bookara", dividerAfter: true },
      ],
    },
  ];

  openMenu: string | null = null;
  focusedIndex: number | null = null;

  get currentItems(): MenuItem[] {
    const menu = this.menus.find((m) => m.id === this.openMenu);
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
