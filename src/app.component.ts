import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageTitleService } from './app/foundation/core/services/page-title.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor() {
    inject(PageTitleService).init();
  }
}
