import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { SOLUTION_CONFIG } from '@/app/foundation/core/tokens/solution-config.token';
import { SolutionMenuItem } from '@/app/foundation/core/models/solution-config.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    @for (item of model; track item.label) {
      @if (!item.separator) {
        <li app-menuitem [item]="item" [root]="true"></li>
      } @else {
        <li class="menu-separator"></li>
      }
    }
  </ul>`
})
export class AppMenu implements OnInit {
  private readonly solution = inject(SOLUTION_CONFIG);
  model: MenuItem[] = [];

  ngOnInit(): void {
    this.model = this.solution.menuItems.map((item) => this.toMenuItem(item));
  }

  /** Maps a SolutionMenuItem recursively to a PrimeNG MenuItem. */
  private toMenuItem(item: SolutionMenuItem): MenuItem {
    return {
      label: item.label,
      icon: item.icon,
      routerLink: item.routerLink,
      items: item.items?.map((child) => this.toMenuItem(child))
    };
  }
}
