import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventLayout } from './event-layout';

describe('EventLayout', () => {
  let component: EventLayout;
  let fixture: ComponentFixture<EventLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
