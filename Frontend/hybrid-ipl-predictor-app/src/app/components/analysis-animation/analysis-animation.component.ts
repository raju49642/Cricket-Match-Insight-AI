import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stage {
  label: string;
}

@Component({
  selector: 'app-analysis-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-animation.component.html',
  styleUrls: ['./analysis-animation.component.scss']
})
export class AnalysisAnimationComponent implements OnInit, OnDestroy {

  constructor(private cdr: ChangeDetectorRef) {}

  

 

  @Output() analysisComplete = new EventEmitter<void>();

  stages: Stage[] = [
    { label: 'INITIALIZING PREDICTION ENGINE' },
    { label: 'ANALYZING MATCH DATA' },
    { label: 'ANALYZING VENUE' },
    { label: 'FETCHING LIVE WEATHER' },
    { label: 'ANALYZING TEAM NEWS' },
    { label: 'RUNNING AI INTELLIGENCE' },
    { label: 'CALCULATING FINAL PROBABILITY' },
    { label: 'PREDICTION READY' }
  ];

  currentIndex = 0;

  private readonly STAGE_DURATION_MS = 600;

  private timerId: ReturnType<typeof setTimeout> | null = null;

  private reachedLastStage = false;
  private finished = false;

  ngOnInit(): void {
    console.log('[Analysis] Animation started.');
    this.scheduleNextStage();
  }

  private scheduleNextStage(): void {

    this.timerId = setTimeout(() => {

      const isLastStage =
        this.currentIndex === this.stages.length - 1;

      if (!isLastStage) {

        this.currentIndex++;

       this.cdr.detectChanges();

        console.log(
          '[Analysis] Stage:',
          this.stages[this.currentIndex].label
        );

        this.scheduleNextStage();
        return;
      }

      // We reached the final visual stage.
      this.reachedLastStage = true;

console.log('[Analysis] Reached final stage.');

this.finish();

      // If API isn't complete yet, simply wait.
      // The @Input setter will call finish()
      // when the real API response arrives.

    }, this.STAGE_DURATION_MS);
  }

  private finish(): void {

  if (this.finished) {
    return;
  }

  this.finished = true;

  console.log('[Analysis] FINISHING → showing result.');

  this.cdr.detectChanges();

  setTimeout(() => {

    console.log('[Analysis] Emitting analysisComplete.');

    this.analysisComplete.emit();

  }, 500);
}

  ngOnDestroy(): void {

    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    console.log('[Analysis] Component destroyed.');
  }
}