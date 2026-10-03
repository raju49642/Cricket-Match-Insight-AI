import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamSelectorComponent } from '../team-selector/team-selector.component';
import { IPL_TEAMS, IPL_VENUES, PredictionRequest } from '../../models/prediction.model';

@Component({
  selector: 'app-prediction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TeamSelectorComponent],
  templateUrl: './prediction-form.component.html',
  styleUrls: ['./prediction-form.component.scss']
})
export class PredictionFormComponent {
  @Output() formSubmit = new EventEmitter<PredictionRequest>();

  teams = IPL_TEAMS;
  venues = IPL_VENUES;

  team1 = '';
  team2 = '';
  venue = '';
  tossWinner = '';
  tossDecision = '';

  // Existing functionality being preserved: Team 1 and Team 2 cannot be the same.
  get sameTeamError(): boolean {
    return !!this.team1 && !!this.team2 && this.team1 === this.team2;
  }

  // Toss winner can only be one of the two currently selected teams.
  get availableTossWinners(): string[] {
    return [this.team1, this.team2].filter((t) => !!t);
  }

  // Toss details are optional - only team1, team2 and venue are required.
  get isFormValid(): boolean {
    return !!this.team1 && !!this.team2 && !!this.venue && this.team1 !== this.team2;
  }

  onTeam1Change(team: string): void {
    this.team1 = team;
    this.clearStaleTossWinner();
  }

  onTeam2Change(team: string): void {
    this.team2 = team;
    this.clearStaleTossWinner();
  }

  private clearStaleTossWinner(): void {
    if (this.tossWinner && !this.availableTossWinners.includes(this.tossWinner)) {
      this.tossWinner = '';
    }
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      return;
    }

    const request: PredictionRequest = {
      team1: this.team1,
      team2: this.team2,
      venue: this.venue,
      toss_winner: this.tossWinner,
      toss_decision: this.tossDecision
    };

    this.formSubmit.emit(request);
  }
}
