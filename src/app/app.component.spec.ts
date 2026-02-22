import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render default invitation name', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Guest');
    expect(compiled.querySelector('.intro')?.textContent).toContain(
      'You are invited',
    );
  });

  it('should use query param names when provided', () => {
    window.history.pushState({}, '', '/?name=Emma&name=Lucas');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Emma & Lucas');
    expect(compiled.querySelector('.intro')?.textContent).toContain(
      'You are invited',
    );
  });

  it('should use Swedish singular invitation text for one name', () => {
    window.history.pushState({}, '', '/?language=sv&name=Emma');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.intro')?.textContent).toContain(
      'Ni är inbjuden',
    );
    expect(compiled.querySelector('h1')?.textContent).toContain('Emma');
  });

  it('should use Swedish plural invitation text for multiple names', () => {
    window.history.pushState({}, '', '/?language=sv&name=Emma&name=Lucas');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.intro')?.textContent).toContain(
      'Ni är inbjudna',
    );
    expect(compiled.querySelector('h1')?.textContent).toContain('Emma & Lucas');
  });

  it('should format three names with commas and ampersand', () => {
    window.history.pushState({}, '', '/?name=Emma&name=Lucas&name=Noah');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Emma, Lucas & Noah',
    );
  });
});
