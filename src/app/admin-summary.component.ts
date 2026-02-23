import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type StoredRsvpValue = {
  inviteeName?: string;
  email?: string;
  attending?: 'yes' | 'no';
  foodPreferences?: string;
  transportationNeeded?: 'yes' | 'no';
  note?: string;
  submittedAt?: string;
};

type AdminSummaryRow = {
  inviteeName: string;
  email: string;
  attending: 'yes' | 'no';
  foodPreferences: string;
  transportationNeeded: 'yes' | 'no';
  note: string;
  submittedAt: string;
};

@Component({
  selector: 'app-admin-summary',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './admin-summary.component.html',
  styleUrl: './admin-summary.component.scss',
})
export class AdminSummaryComponent implements OnInit, OnChanges {
  @Input({ required: true }) databaseUrl!: string;

  rows: AdminSummaryRow[] = [];
  isLoading = false;
  error = '';

  constructor(private readonly translate: TranslateService) {}

  ngOnInit(): void {
    void this.loadAnswers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['databaseUrl'] && !changes['databaseUrl'].firstChange) {
      void this.loadAnswers();
    }
  }

  async refresh(): Promise<void> {
    await this.loadAnswers();
  }

  private async loadAnswers(): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      const response = await fetch(`${this.databaseUrl}/rsvps.json`);

      if (!response.ok) {
        throw new Error('Failed to load summary');
      }

      const result = (await response.json()) as Record<
        string,
        StoredRsvpValue
      > | null;
      this.rows = Object.entries(result ?? {})
        .map(
          ([inviteeName, value]): AdminSummaryRow => ({
            inviteeName: value.inviteeName || inviteeName,
            email: value.email ?? '',
            attending: value.attending ?? 'no',
            foodPreferences: value.foodPreferences ?? '',
            transportationNeeded: value.transportationNeeded ?? 'no',
            note: value.note ?? '',
            submittedAt: value.submittedAt ?? '',
          }),
        )
        .sort((first, second) =>
          first.inviteeName.localeCompare(second.inviteeName),
        );
    } catch {
      this.rows = [];
      this.error = this.translate.instant('summary.error');
    } finally {
      this.isLoading = false;
    }
  }
}
