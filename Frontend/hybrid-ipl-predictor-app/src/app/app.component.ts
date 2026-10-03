import {
  ChangeDetectorRef,
  Component
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntroAnimationComponent } from './components/intro-animation/intro-animation.component';
import { PredictionFormComponent } from './components/prediction-form/prediction-form.component';
import { AnalysisAnimationComponent } from './components/analysis-animation/analysis-animation.component';
import { PredictionResultComponent } from './components/prediction-result/prediction-result.component';
import { PredictionService } from './services/prediction.service';
import { PredictionRequest, PredictionResponse } from './models/prediction.model';

type AppView = 'intro' | 'form' | 'analyzing' | 'result';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    IntroAnimationComponent,
    PredictionFormComponent,
    AnalysisAnimationComponent,
    PredictionResultComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  view: AppView = 'intro';

  result: PredictionResponse | null = null;
  errorMessage: string | null = null;
  apiComplete = false;
  private analysisComplete = false;
 selectedTeam1 = '';
selectedTeam2 = '';

  // Guards against duplicate requests while one is already running.
  private isPredicting = false;

  constructor(
  private predictionService: PredictionService,
  private cdr: ChangeDetectorRef
) {}

  onIntroComplete(): void {
    this.view = 'form';
  }
onFormSubmit(request: PredictionRequest): void {
  if (this.isPredicting) {
    return;
  }

  this.selectedTeam1 = request.team1;
  this.selectedTeam2 = request.team2;

  this.isPredicting = true;

  this.apiComplete = false;
  this.analysisComplete = false;

  this.result = null;
  this.errorMessage = null;

  this.view = 'analyzing';

  this.cdr.detectChanges();

  console.log('[App] Sending prediction request:', request);

  this.predictionService.predictMatch(request).subscribe({
    next: (response) => {
      console.log('[App] Flask response received:', response);

      this.result = response;
      this.apiComplete = true;

      console.log('[App] API complete.');

      this.cdr.detectChanges();

      this.tryShowResult();
    },

    error: (err: Error) => {
      console.error('[App] Prediction error:', err);

      this.errorMessage =
        err.message || 'Prediction server unavailable.';

      this.apiComplete = true;

      this.cdr.detectChanges();

      this.tryShowResult();
    }
  });
}

 onAnalysisComplete(): void {
  console.log('[App] Animation complete.');

  this.analysisComplete = true;

  this.tryShowResult();
}
private tryShowResult(): void {
  console.log('[App] Completion check:', {
    apiComplete: this.apiComplete,
    analysisComplete: this.analysisComplete
  });

  if (this.apiComplete && this.analysisComplete) {
    console.log('[App] API + animation complete → showing result.');

    this.isPredicting = false;
    this.view = 'result';

    this.cdr.detectChanges();
  }
}

  onReset(): void {
    this.result = null;
    this.errorMessage = null;
    this.apiComplete = false;
    this.view = 'form';
  }
}
