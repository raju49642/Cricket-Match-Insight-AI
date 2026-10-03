import { Component } from '@angular/core';
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

  // Guards against duplicate requests while one is already running.
  private isPredicting = false;

  constructor(private predictionService: PredictionService) {}

  onIntroComplete(): void {
    this.view = 'form';
  }

  onFormSubmit(request: PredictionRequest): void {
    if (this.isPredicting) {
      return;
    }

    this.isPredicting = true;
    this.apiComplete = false;
    this.result = null;
    this.errorMessage = null;
    this.view = 'analyzing';

    this.predictionService.predictMatch(request).subscribe({
      next: (response) => {
        this.result = response;
        this.apiComplete = true;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Prediction server unavailable.';
        this.apiComplete = true;
      }
    });
  }

  onAnalysisComplete(): void {
    this.isPredicting = false;
    this.view = 'result';
  }

  onReset(): void {
    this.result = null;
    this.errorMessage = null;
    this.apiComplete = false;
    this.view = 'form';
  }
}
