import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfigComponent } from '@/app/services/sol/configuration/presentation/domains/config';

@Component({
  selector: 'app-builder-generator',
  standalone: true,
  imports: [ToastModule, ConfigComponent],
  providers: [MessageService],
  template: `
    <p-toast />
    <app-config />
  `
})
export class BuilderGeneratorPage {}
