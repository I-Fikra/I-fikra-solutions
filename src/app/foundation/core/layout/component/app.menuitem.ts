import { TranslocoModule } from '@jsverse/transloco';
import { Component, computed, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/app/foundation/core/layout/service/layout.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: '[app-menuitem]',
  imports: [CommonModule, RouterModule, RippleModule, TranslocoModule],
  template: `
    <!-- Root menu items -->
    @if (root() && isVisible()) {
      <div
        class="layout-menuitem-root-text"
        (click)="toggleMenu()"
        style="cursor: pointer; display: flex; align-items: center; gap: 6px;"
      >
        <span>{{ item().label | transloco }}</span>

        @if (hasChildren()) {
          <i
            class="pi"
            [ngClass]="getChevronIcon()"
            style="font-size: 0.75rem;"
          ></i>
        }
      </div>
    }

    <!-- Non-root parent items with children -->
    @if (!root() && hasChildren() && isVisible()) {
      <a
        class="layout-menuitem-link layout-menuitem-parent-link"
        (click)="toggleMenu($event)"
        [ngClass]="item().class"
        tabindex="0"
        pRipple
        style="cursor: pointer;"
      >
        <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>

        <span class="layout-menuitem-text">
          {{ item().label | transloco }}
        </span>

        <i class="pi layout-submenu-toggler" [ngClass]="getChevronIcon()"></i>
      </a>
    }

    <!-- Leaf items -->
    @if (!root() && !hasChildren() && isVisible()) {
      <a
        class="layout-menuitem-link layout-menuitem-leaf-link"
        (click)="itemClick($event)"
        [ngClass]="item().class"
        [routerLink]="item().routerLink"
        routerLinkActive="active-route"
        [routerLinkActiveOptions]="
          item().routerLinkActiveOptions || {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored'
          }
        "
        [fragment]="item().fragment"
        [queryParamsHandling]="item().queryParamsHandling"
        [preserveFragment]="item().preserveFragment"
        [skipLocationChange]="item().skipLocationChange"
        [replaceUrl]="item().replaceUrl"
        [state]="item().state"
        [queryParams]="item().queryParams"
        [attr.target]="item().target"
        tabindex="0"
        pRipple
      >
        <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>

        <span class="layout-menuitem-text">
          {{ item().label | transloco }}
        </span>
      </a>
    }

    <!-- Submenu children -->
    @if (hasChildren() && isVisible() && isExpanded()) {
      <ul>
        @for (child of item().items; track child?.label) {
          <li
            app-menuitem
            [item]="child"
            [parentPath]="fullPath()"
            [root]="false"
            [class]="child['badgeClass']"
          ></li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .layout-menuitem-link {
        display: flex;
        align-items: center;
        width: 100%;
      }

      .layout-submenu-toggler {
        margin-left: auto;
        font-size: 0.75rem;
      }

      :host-context(html[dir='rtl']) .layout-menuitem-link {
        direction: rtl;
        justify-content: flex-start;
      }

      :host-context(html[dir='rtl'])
        .layout-menuitem-link
        .layout-menuitem-icon {
        order: 1;
        margin-left: 0.5rem;
        margin-right: 0;
      }

      :host-context(html[dir='rtl'])
        .layout-menuitem-link
        .layout-menuitem-text {
        order: 2;
      }

      :host-context(html[dir='rtl'])
        .layout-menuitem-link
        .layout-submenu-toggler {
        order: 3;
        margin-right: auto !important;
        margin-left: 0 !important;
      }

      :host-context(html[dir='rtl']) ul {
        padding-left: 0;
        padding-right: 1rem;
      }
    `
  ],
  host: {
    '[class.active-menuitem]': 'isActive()',
    '[class.layout-root-menuitem]': 'root()'
  }
})
export class AppMenuitem {
  layoutService = inject(LayoutService);
  router = inject(Router);

  item = input<any>(null);
  root = input<boolean>(false);
  parentPath = input<string | null>(null);

  isExpanded = signal<boolean>(false);

  isVisible = computed(() => this.item()?.visible !== false);
  hasChildren = computed(
    () => this.item()?.items && this.item()?.items.length > 0
  );
  hasRouterLink = computed(() => !!this.item()?.routerLink);

  fullPath = computed(() => {
    const itemPath = this.item()?.path;

    if (!itemPath) return this.parentPath();

    const parent = this.parentPath();

    if (parent && !itemPath.startsWith(parent)) {
      return parent + itemPath;
    }

    return itemPath;
  });

  isActive = computed(() => {
    const activePath = this.layoutService.layoutState().activePath;

    if (this.item()?.path) {
      return activePath?.startsWith(this.fullPath() ?? '') ?? false;
    }

    return false;
  });

  isChildActive = computed(() => {
    if (!this.hasChildren()) return false;

    const children = this.item().items;

    if (!children) return false;

    for (const child of children) {
      if (child.routerLink) {
        const isActive = this.router.isActive(child.routerLink[0], {
          paths: 'exact',
          queryParams: 'ignored',
          matrixParams: 'ignored',
          fragment: 'ignored'
        });

        if (isActive) return true;
      }
    }

    return false;
  });

  defaultExpandedMenus = [
    'menu.home',
    'menu.identity'
  ];

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.item()?.routerLink) {
          this.updateActiveStateFromRoute();
        }
      });
  }

  ngOnInit() {
    if (this.item()?.routerLink) {
      this.updateActiveStateFromRoute();
    }

    if (this.root() && this.hasChildren()) {
      const itemLabel = this.item()?.label;

      if (this.defaultExpandedMenus.includes(itemLabel)) {
        this.isExpanded.set(true);
      }
    }

    if (this.hasChildren() && this.isChildActive()) {
      this.isExpanded.set(true);
    }
  }

  getChevronIcon(): string {
    if (this.isExpanded()) {
      return 'pi-chevron-down';
    }

    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

    return isRtl ? 'pi-chevron-left' : 'pi-chevron-right';
  }

  toggleMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.hasChildren()) {
      this.isExpanded.update((v) => !v);
    }
  }

  updateActiveStateFromRoute() {
    const item = this.item();

    if (!item?.routerLink) return;

    const isRouteActive = this.router.isActive(item.routerLink[0], {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored'
    });

    if (isRouteActive) {
      const parentPath = this.parentPath();

      if (parentPath) {
        this.layoutService.layoutState.update((val) => ({
          ...val,
          activePath: parentPath
        }));
      }
    }
  }

  itemClick(event: Event) {
    const item = this.item();

    if (item?.disabled) {
      event.preventDefault();
      return;
    }

    if (item?.command) {
      item.command({ originalEvent: event, item: item });
    }

    this.layoutService.layoutState.update((val) => ({
      ...val,
      overlayMenuActive: false,
      staticMenuMobileActive: false,
      mobileMenuActive: false
    }));
  }
}
