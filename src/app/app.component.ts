import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminSummaryComponent } from './admin-summary.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type Language = 'en' | 'sv';
type RsvpFormGroup = FormGroup<{
  email: FormControl<string>;
  attending: FormControl<'yes' | 'no'>;
  foodPreferences: FormControl<string>;
  transportationNeeded: FormControl<'yes' | 'no'>;
  note: FormControl<string>;
}>;

type RsvpFormEntry = {
  inviteeName: string;
  form: RsvpFormGroup;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitError: string;
  isClosed: boolean;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, AdminSummaryComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly databaseUrl =
    'https://invitations-35792-default-rtdb.europe-west1.firebasedatabase.app';
  readonly invitationKey = this.getInvitationKey();

  readonly language = this.getLanguageFromQuery();
  readonly isAdmin = this.getIsAdminFromQuery();
  names = this.getNamesFromQuery();
  invitationTitle = '';
  invitationMessage = '';
  readonly invitationImage =
    this.language === 'sv' ? 'swedish4.png' : 'english4.png';

  isOpened = false;
  isFolding = false;
  isRsvpFormVisible = false;
  rsvpForms: RsvpFormEntry[] = [];

  get visibleRsvpForms(): RsvpFormEntry[] {
    return this.rsvpForms.filter((rsvpFormEntry) => !rsvpFormEntry.isClosed);
  }

  get allResponsesSent(): boolean {
    return this.rsvpForms.length > 0 && this.visibleRsvpForms.length === 0;
  }

  constructor(private readonly translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use(this.language).subscribe(() => {
      if (this.isAdmin) {
        return;
      }

      this.initializeInvitationContent();
    });

    globalThis.document.documentElement.lang = this.language;
  }

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

  showRsvpForm(): void {
    if (this.allResponsesSent) {
      this.reopenAllRsvpForms();
    }

    this.isRsvpFormVisible = true;
  }

  async submitRsvp(formEntry: RsvpFormEntry): Promise<void> {
    if (formEntry.isSubmitting || formEntry.isSubmitted) {
      return;
    }

    formEntry.submitError = '';
    formEntry.form.markAllAsTouched();

    if (formEntry.form.invalid) {
      return;
    }

    formEntry.isSubmitting = true;

    try {
      const formValue = formEntry.form.getRawValue();

      const payload = {
        invitationNames: this.names,
        inviteeName: formEntry.inviteeName,
        invitationTitle: this.invitationTitle,
        language: this.language,
        contactName: formEntry.inviteeName,
        email: formValue.email.trim(),
        attending: formValue.attending,
        foodPreferences: formValue.foodPreferences.trim(),
        transportationNeeded: formValue.transportationNeeded,
        note: formValue.note.trim(),
        submittedAt: new Date().toISOString(),
        source: globalThis.location.href,
      };

      const response = await fetch(
        `${this.databaseUrl}/rsvpsByInvitation/${encodeURIComponent(this.invitationKey)}/${encodeURIComponent(formEntry.inviteeName)}.json`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }

      const legacyResponse = await fetch(`${this.databaseUrl}/rsvps.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!legacyResponse.ok) {
        throw new Error('Failed to submit RSVP');
      }

      formEntry.isSubmitted = true;
      formEntry.form.disable();
      formEntry.isClosed = true;

      if (this.visibleRsvpForms.length === 0) {
        this.isRsvpFormVisible = false;
      }
    } catch {
      formEntry.submitError = this.translate.instant('messages.error');
    } finally {
      formEntry.isSubmitting = false;
    }
  }

  private initializeInvitationContent(): void {
    if (this.names.length === 0) {
      this.names = [this.translate.instant('invitation.guest')];
    }

    this.invitationTitle = this.formatNames(this.names);
    this.invitationMessage = this.getInvitationMessage();
    this.rsvpForms = this.names.map((inviteeName) => ({
      inviteeName,
      form: this.createRsvpForm(),
      isSubmitting: false,
      isSubmitted: false,
      submitError: '',
      isClosed: false,
    }));

    void this.hydrateSavedRsvps();
  }

  private reopenAllRsvpForms(): void {
    this.rsvpForms = this.rsvpForms.map((rsvpFormEntry) => {
      if (!rsvpFormEntry.isClosed) {
        return rsvpFormEntry;
      }

      rsvpFormEntry.isClosed = false;
      rsvpFormEntry.isSubmitted = false;
      rsvpFormEntry.form.enable();

      return rsvpFormEntry;
    });
  }

  private async hydrateSavedRsvps(): Promise<void> {
    await Promise.all(
      this.rsvpForms.map(async (rsvpFormEntry) => {
        try {
          const response = await fetch(
            `${this.databaseUrl}/rsvpsByInvitation/${encodeURIComponent(this.invitationKey)}/${encodeURIComponent(rsvpFormEntry.inviteeName)}.json`,
          );

          if (!response.ok) {
            return;
          }

          const savedValue = (await response.json()) as {
            contactName?: string;
            email?: string;
            attending?: 'yes' | 'no';
            foodPreferences?: string;
            transportationNeeded?: 'yes' | 'no';
            note?: string;
          } | null;

          if (!savedValue) {
            return;
          }

          rsvpFormEntry.form.patchValue({
            email: savedValue.email ?? '',
            attending: savedValue.attending ?? 'yes',
            foodPreferences: savedValue.foodPreferences ?? '',
            transportationNeeded: savedValue.transportationNeeded ?? 'no',
            note: savedValue.note ?? '',
          });
        } catch {
          rsvpFormEntry.submitError = '';
        }
      }),
    );
  }

  private getInvitationKey(): string {
    const language = this.getLanguageFromQuery();
    const names = this.getNamesFromQuery();
    const path = globalThis.location.pathname;

    return `${language}|${path}|${names.join('|')}`;
  }

  private createRsvpForm(): RsvpFormGroup {
    return new FormGroup({
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.email],
      }),
      attending: new FormControl<'yes' | 'no'>('yes', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      foodPreferences: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(300)],
      }),
      transportationNeeded: new FormControl<'yes' | 'no'>('no', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      note: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(300)],
      }),
    });
  }

  private formatNames(names: string[]): string {
    const translatedJoinWord = this.translate.instant('invitation.joinWord');
    const joinWord =
      translatedJoinWord === 'invitation.joinWord'
        ? this.language === 'sv'
          ? ' och '
          : ' & '
        : translatedJoinWord;

    if (names.length <= 2) {
      return names.join(joinWord);
    }

    return `${names.slice(0, -1).join(', ')}${joinWord}${names.at(-1)}`;
  }

  private getLanguageFromQuery(): Language {
    const params = new URLSearchParams(globalThis.location.search);
    const languageParam = params.get('language') ?? params.get('lang');

    return languageParam?.toLowerCase() === 'sv' ? 'sv' : 'en';
  }

  private getIsAdminFromQuery(): boolean {
    const params = new URLSearchParams(globalThis.location.search);
    const adminParam = params.get('admin') ?? '';

    return adminParam.toLowerCase() === 'true';
  }

  private getInvitationMessage(): string {
    const key =
      this.names.length > 1
        ? 'invitation.youAllAreInvited'
        : 'invitation.youAreInvited';

    return this.translate.instant(key);
  }

  private getNamesFromQuery(): string[] {
    const params = new URLSearchParams(globalThis.location.search);

    const nameParams = params.getAll('name');
    if (nameParams.length > 0) {
      return nameParams.map((name) => name.trim()).filter(Boolean);
    }

    const namesParam = params.get('names');
    if (!namesParam) {
      return [];
    }

    return namesParam
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
}
