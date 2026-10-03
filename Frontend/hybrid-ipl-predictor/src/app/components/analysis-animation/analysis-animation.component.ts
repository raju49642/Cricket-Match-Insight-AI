import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stage {
  label: string;
}

/**
 * Cinematic "analyzing" sequence shown while the real API request is
 * in flight. The stages are purely visual labels for the backend
 * pipeline - no fake numbers are ever shown here.
 *
 * Timing: steps through one stage roughly every STAGE_DURATION_MS.
 * If the real API response (`apiComplete`) arrives before we reach the
 * last stage, we simply keep playing until the last stage is reached
 * and then finish immediately. If the API is still pending once we
 * reach the last stage, we hold there (the dot keeps pulsing) until
 * `apiComplete` flips to true.
 */
@Component({
  selector: 'app-analysis-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-animation.component.html',
  styleUrls: ['./analysis-animation.component.scss']
})
export class AnalysisAnimationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() apiComplete = false;
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

  private readonly STAGE_DURATION_MS = 450;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private reachedLastStage = false;
  private finished = false;

  ngOnInit(): void {
    this.scheduleNextStage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If the API finishes after we've already reached "PREDICTION READY",
    // move on to the result screen right away.
    if (changes['apiComplete'] && this.apiComplete && this.reachedLastStage) {
      this.finish();
    }
  }

  private scheduleNextStage(): void {
    this.timerId = setTimeout(() => {
      const isLastStage = this.currentIndex === this.stages.length - 1;

      if (!isLastStage) {
        this.currentIndex++;
        this.scheduleNextStage();
        return;
      }

      this.reachedLastStage = true;

      if (this.apiComplete) {
        this.finish();
      }
      // else: wait here for ngOnChanges to tell us the API has resolved.
    }, this.STAGE_DURATION_MS);
  }

  private finish(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    // Brief pause so the user can actually read "PREDICTION READY".
    setTimeout(() => this.analysisComplete.emit(), 350);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  }
}
