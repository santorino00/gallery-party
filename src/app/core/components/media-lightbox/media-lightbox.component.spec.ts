import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaLightboxComponent } from './media-lightbox.component';


describe('MediaLightbox', () => {
  let component: MediaLightboxComponent;
  let fixture: ComponentFixture<MediaLightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaLightboxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaLightboxComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
