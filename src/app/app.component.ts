import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

type Language = 'en' | 'sv';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly databaseUrl =
    'https://invitations-35792-default-rtdb.europe-west1.firebasedatabase.app';

  readonly language = this.getLanguageFromQuery();
  readonly names = this.getNamesFromQuery();
  readonly invitationTitle = this.formatNames(this.names);
  readonly invitationMessage = this.getInvitationMessage();
  readonly invitationImage =
    this.language === 'sv' ? 'swedish4.png' : 'english4.png';
  readonly invitationAlt = this.language === 'sv' ? 'Inbjudan' : 'Invitation';
  readonly rsvpHeading = this.language === 'sv' ? 'OSA' : 'RSVP';
  readonly contactNameLabel = this.language === 'sv' ? 'Namn' : 'Name';
  readonly emailLabel = this.language === 'sv' ? 'E-post' : 'Email';
  readonly attendingLabel =
    this.language === 'sv' ? 'Kommer du?' : 'Will you attend?';
  readonly attendingYesLabel = this.language === 'sv' ? 'Ja' : 'Yes';
  readonly attendingNoLabel = this.language === 'sv' ? 'Nej' : 'No';
  readonly guestsLabel =
    this.language === 'sv' ? 'Antal gäster' : 'Number of guests';
  readonly noteLabel = this.language === 'sv' ? 'Meddelande' : 'Message';
  readonly submitLabel = this.language === 'sv' ? 'Skicka svar' : 'Send RSVP';
  readonly submittingLabel =
    this.language === 'sv' ? 'Skickar...' : 'Sending...';
  readonly successMessage =
    this.language === 'sv'
      ? 'Tack! Ditt svar är registrerat.'
      : 'Thank you! Your RSVP has been recorded.';
  readonly errorMessage =
    this.language === 'sv'
      ? 'Något gick fel. Försök igen.'
      : 'Something went wrong. Please try again.';
  readonly requiredMessage =
    this.language === 'sv'
      ? 'Detta fält är obligatoriskt.'
      : 'This field is required.';
  readonly invalidEmailMessage =
    this.language === 'sv'
      ? 'Ange en giltig e-postadress.'
      : 'Enter a valid email address.';

  isOpened = false;
  isFolding = false;
  isSubmitting = false;
  isSubmitted = false;
  submitError = '';

  readonly rsvpForm = new FormGroup({
    contactName: new FormControl(this.invitationTitle, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    attending: new FormControl<'yes' | 'no'>('yes', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    guests: new FormControl(Math.max(this.names.length, 1), {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(10)],
    }),
    note: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
  });

  openInvitation(): void {
    if (this.isOpened || this.isFolding) {
      return;
    }

    this.isFolding = true;
  }

  completeFoldAway(): void {
    if (!this.isFolding) {
      return;
    }

    this.isFolding = false;
    this.isOpened = true;
  }

  async submitRsvp(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.submitError = '';
    this.rsvpForm.markAllAsTouched();

    if (this.rsvpForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.rsvpForm.getRawValue();

      const payload = {
        invitationNames: this.names,
        invitationTitle: this.invitationTitle,
        language: this.language,
        contactName: formValue.contactName.trim(),
        email: formValue.email.trim(),
        attending: formValue.attending,
        guests: formValue.guests,
        note: formValue.note.trim(),
        submittedAt: new Date().toISOString(),
        source: globalThis.location.href,
      };

      const response = await fetch(`${this.databaseUrl}/rsvps.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }

      this.isSubmitted = true;
      this.rsvpForm.disable();
    } catch {
      this.submitError = this.errorMessage;
    } finally {
      this.isSubmitting = false;
    }
  }

  private formatNames(names: string[]): string {
    if (names.length <= 2) {
      return names.join(' & ');
    }

    return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
  }

  private getLanguageFromQuery(): Language {
    const params = new URLSearchParams(globalThis.location.search);
    const languageParam = params.get('language') ?? params.get('lang');

    return languageParam?.toLowerCase() === 'sv' ? 'sv' : 'en';
  }

  private getInvitationMessage(): string {
    if (this.language === 'sv') {
      return this.names.length > 1 ? 'Ni är inbjudna' : 'Du är inbjuden';
    }

    return 'You are invited';
  }

  private getNamesFromQuery(): string[] {
    const params = new URLSearchParams(globalThis.location.search);

    const nameParams = params.getAll('name');
    if (nameParams.length > 0) {
      return nameParams.map((name) => name.trim()).filter(Boolean);
    }

    const namesParam = params.get('names');
    if (!namesParam) {
      return [this.language === 'sv' ? 'Gäst' : 'Guest'];
    }

    return namesParam
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
}
