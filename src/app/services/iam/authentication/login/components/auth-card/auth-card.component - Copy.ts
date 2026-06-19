import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppFloatingConfigurator } from '@/app/foundation/core/layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [AppFloatingConfigurator],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss']
})
export class AuthCardComponent {
  /** Main heading shown at the top of the card  */
  @Input() heading: string = '';

  /** Optional subtitle shown below the heading */
  @Input() subtitle: string = '';
}
