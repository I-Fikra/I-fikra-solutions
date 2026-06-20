import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { AuthCardComponent } from '../../login/components/auth-card/auth-card.component';

@Component({
    selector: 'app-forget-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        InputTextModule,
        ButtonModule,
        RouterModule,
        AuthCardComponent,   // ✅ replaces AppFloatingConfigurator + layout boilerplate
    ],
    templateUrl: './forget-password.html',
    styleUrls: ['./forget-password.scss']
})
export class ForgetPassword {

    resetForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.resetForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    submit() {
        if (this.resetForm.invalid) {
            this.resetForm.markAllAsTouched();
            return;
        }

        console.log('RESET EMAIL:', this.resetForm.value.email);

        // TODO: call API for password reset
    }

    get f() {
        return this.resetForm.controls;
    }
}