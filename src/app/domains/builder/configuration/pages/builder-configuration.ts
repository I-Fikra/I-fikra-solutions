import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-builder-configuration',
  standalone: true,
  imports: [ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
  `
})
export class BuilderConfigurationPage {
}