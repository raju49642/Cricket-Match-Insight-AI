import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * A single reusable team dropdown. Used twice in the prediction form
 * (Team 1 and Team 2). `disabledTeam` lets the parent grey out whichever
 * team is already selected in the *other* dropdown, so the same team
 * can never be picked twice.
 */
@Component({
  selector: 'app-team-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.scss']
})
export class TeamSelectorComponent {
  @Input() label = 'Team';
  @Input() teams: string[] = [];
  @Input() selectedTeam = '';
  @Input() disabledTeam: string | null = null;
  @Output() teamChange = new EventEmitter<string>();

  onChange(value: string): void {
    this.teamChange.emit(value);
  }
}
