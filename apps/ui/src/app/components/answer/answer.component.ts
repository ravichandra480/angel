import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'angel-answer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIcon],
  templateUrl: './answer.component.html',
  styleUrl: './answer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerComponent {
  @Input() answer = '';
  @Input() type: 'question' | 'answer' | 'loading' = 'question';
}
