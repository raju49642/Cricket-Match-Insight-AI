import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * "Glowing Prediction Core" opening animation.
 *
 * Plays once on initial load, then emits `introComplete` so the parent
 * can swap in the main application. Respects prefers-reduced-motion by
 * skipping straight to a short static reveal.
 */
@Component({
  selector: 'app-intro-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-animation.component.html',
  styleUrls: ['./intro-animation.component.scss']
})
export class IntroAnimationComponent implements OnInit, OnDestroy {
  @Output() introComplete = new EventEmitter<void>();

  // Adds the "exiting" class so CSS can fade the whole overlay out smoothly.
  isExiting = false;
  reducedMotion = false;

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Full sequence takes ~2.4s of animation, then a 0.5s fade-out.
    // Reduced-motion users get a much shorter, static version.
    const animationDuration = this.reducedMotion ? 600 : 2400;
    const fadeOutDuration = this.reducedMotion ? 200 : 500;

    this.timers.push(
      setTimeout(() => {
        this.isExiting = true;
        this.timers.push(
          setTimeout(() => this.introComplete.emit(), fadeOutDuration)
        );
      }, animationDuration)
    );
  }

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
  }
}
