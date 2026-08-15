import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { getName, getVersion } from "@tauri-apps/api/app";
import { LanguageService } from "../i18n/language.service";

@Component({
  selector: "app-about-dialog",
  imports: [],
  templateUrl: "./about-dialog.component.html",
  styleUrl: "./about-dialog.component.css",
})
export class AboutDialogComponent implements OnInit {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private languageService = inject(LanguageService);

  appName = "Bookara";
  appVersion = "";

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    void getName().then((name) => {
      if (name) this.appName = name;
    });
    void getVersion().then((version) => (this.appVersion = version));
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.open) {
      this.onClose();
    }
  }
}
