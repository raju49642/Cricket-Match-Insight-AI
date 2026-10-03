import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { PredictionResponse } from '../../models/prediction.model';

interface ProbabilityBar {
  team: string;
  value: number;
  target: number;
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

  // The two teams selected by the user
  @Input() team1: string = '';
  @Input() team2: string = '';

  @Output() reset = new EventEmitter<void>();

  bars: ProbabilityBar[] = [];
  insightsOpen = false;

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['result'] ||
      changes['team1'] ||
      changes['team2']
    ) {
      if (this.result) {
        this.setupBars(this.result);
      }
    }
  }

  private setupBars(result: PredictionResponse): void {

    const selectedTeams = [
      this.team1,
      this.team2
    ];

    this.bars = selectedTeams
      .filter(team => team && result.probabilities[team] !== undefined)
      .map(team => ({
        team,
        value: 0,
        target: Math.round(
          result.probabilities[team] * 1000
        ) / 10
      }));

    // Start the animation from 0%
    // and then animate to the real probability.
    setTimeout(() => {

      this.bars = this.bars.map(bar => ({
        ...bar,
        value: bar.target
      }));

    }, 50);
  }

  toggleInsights(): void {
    this.insightsOpen = !this.insightsOpen;
  }

  onReset(): void {
    this.reset.emit();
  }
}