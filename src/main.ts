import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
