import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserDetailsComponent } from '@/app/domains/iam/authorization/users/presentation/components/user-details/user-details';
import { PopupShell } from '@/app/foundation/shared/components/popup-shell/popup-shell';
import { GetLoggedInUserUseCase } from '@/app/domains/iam/authorization/users/application/use-cases/queries/get-logged-in-user';
import { UserRecord } from '@/app/domains/iam/authorization/users/domain/entities/user.entity';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, UserDetailsComponent, PopupShell],
  template: `
    <app-popup-shell>
      <div class="app-popup-menu app-popup-menu__inner">
        <!-- Header -->
        <div class="app-popup-menu__header">
          <div class="app-popup-avatar">
            <i class="pi pi-user"></i>
          </div>
          <div class="app-popup-menu__title">
            {{ loggedInUser()?.['name'] ?? '...' }}
          </div>
          <div class="app-popup-menu__subtitle">
            {{ loggedInUser()?.['role'] ?? '' }}
          </div>
        </div>

        <!-- Divider -->
        <div class="app-popup-menu__divider"></div>

        <!-- Actions -->
        <div class="app-popup-menu__list">
          <button class="app-popup-menu__item" (click)="openUserProfile()">
            <i class="pi pi-id-card app-popup-menu__item-icon"></i>
            <span>My Profile</span>
          </button>

          <button class="app-popup-menu__item" (click)="goToSettings()">
            <i class="pi pi-cog app-popup-menu__item-icon"></i>
            <span>Settings</span>
          </button>

          <button
            class="app-popup-menu__item app-popup-menu__item--danger"
            (click)="logout()"
          >
            <i class="pi pi-sign-out app-popup-menu__item-icon"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </app-popup-shell>

    <app-user-details
      [(visible)]="showUserDetails"
      [apiUser]="loggedInUser()"
    ></app-user-details>
  `,
  host: {
    class: 'hidden absolute top-14 end-0 origin-top z-50'
  },
  styles: [
    `
      :host {
        display: block;
        width: 300px;
        isolation: isolate;
      }
      :host.hidden {
        display: none !important;
      }
    `
  ]
})
export class ProfileMenu implements OnInit {
  showUserDetails = false;
  loggedInUser = signal<UserRecord | null>(null);

  private readonly router = inject(Router);
  private readonly getLoggedInUser = inject(GetLoggedInUserUseCase);

  ngOnInit(): void {
    this.getLoggedInUser.execute().subscribe({
      next: (user: UserRecord) => this.loggedInUser.set(user),
      error: (err: unknown) =>
        console.error('Failed to load logged-in user', err)
    });
  }

  openUserProfile(): void {
    this.showUserDetails = true;
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/auth/login']);
  }
}
