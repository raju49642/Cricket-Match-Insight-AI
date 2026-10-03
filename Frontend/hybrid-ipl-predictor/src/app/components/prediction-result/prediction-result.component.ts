import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionResponse } from '../../models/prediction.model';

interface ProbabilityBar {
  team: string;
  value: number; // animated, starts at 0
  target: number; // real value from the API, as a percentage
}

@Component({
  selector: 'app-prediction-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-result.component.html',
  styleUrls: ['./prediction-result.component.scss']
})
export class PredictionResultComponent implements OnChanges {
  @Input() result: PredictionResponse | null = null;
  @Input() errorMessage: string | null = null;
  @Output() reset = new EventEmitter<void>();

  bars: ProbabilityBar[] = [];
  insightsOpen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['result'] && this.result) {
      this.setupBars(this.result);
    }
  }

  private setupBars(result: PredictionResponse): void {
    // The API returns fractions (e.g. 0.724). Convert to a percentage for display.
    // Bars start at 0 so the width transition animates in on the next tick.
    this.bars = Object.entries(result.probabilities).map(([team, probability]) => ({
      team,
      value: 0,
      target: Math.round(probability * 1000) / 10
    }));

    setTimeout(() => {
      this.bars = this.bars.map((bar) => ({ ...bar, value: bar.target }));
    }, 50);
  }

  toggleInsights(): void {
    this.insightsOpen = !this.insightsOpen;
  }

  onReset(): void {
    this.reset.emit();
  }
}
