import { Component } from "@angular/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MenubarComponent } from "../menubar/menubar.component";

@Component({
  selector: "app-titlebar",
  imports: [MenubarComponent],
  templateUrl: "./titlebar.component.html",
  styleUrl: "./titlebar.component.css",
})
export class TitlebarComponent {
  private window = getCurrentWindow();

  async minimize() {
    await this.window.minimize();
  }

  async toggleMaximize() {
    const isMaximized = await this.window.isMaximized();
    if (isMaximized) {
      await this.window.unmaximize();
    } else {
      await this.window.maximize();
    }
  }

  async close() {
    await this.window.close();
  }
}
