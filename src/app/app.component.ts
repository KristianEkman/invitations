import { Component } from '@angular/core';

type Language = 'en' | 'sv';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly language = this.getLanguageFromQuery();
  readonly names = this.getNamesFromQuery();
  readonly invitationTitle = this.formatNames(this.names);
  readonly invitationMessage = this.getInvitationMessage();
  readonly invitationImage =
    this.language === 'sv' ? 'swedish4.png' : 'english4.png';
  readonly invitationAlt = this.language === 'sv' ? 'Inbjudan' : 'Invitation';

  isOpened = false;
  isFolding = false;

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
