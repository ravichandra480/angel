import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'angel-question',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    ReactiveFormsModule, MatIcon, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionComponent {
  @Output() newAnswerEvent = new EventEmitter<any>();
  @Output() isLoading = new EventEmitter<boolean>();

  @ViewChild('fileUpload', {static:true}) fileUpload: ElementRef | undefined;

  loading = false;
  uploadingFile = false;

  checkoutForm = this.formBuilder.group({
    emailFormControl: new FormControl('', [Validators.required]),
  });

  constructor(
    private readonly http: HttpClient,
    private readonly formBuilder: FormBuilder
  ) {
  }
  onSubmit(): void{
    this.isLoading.emit(true);
    this.loading = true;
    this.checkoutForm.controls.emailFormControl.disable();
    this.newAnswerEvent.emit({
      text: this.checkoutForm.value.emailFormControl,
      type: 'question'
    });
    this.http.get(`api/ask?q=${this.checkoutForm.value.emailFormControl}`)
        .subscribe({
          next: (value: any) => {
            this.newAnswerEvent.emit({
              text: value?.message,
              type: 'answer'
            });
            this.checkoutForm.controls.emailFormControl.reset();
            this.checkoutForm.controls.emailFormControl.enable();
            this.isLoading.emit(false);
            this.loading = false;
          },
          error: (error) => {
            this.newAnswerEvent.emit(error);
            this.checkoutForm.controls.emailFormControl.enable();
            this.isLoading.emit(false);
            this.loading = false;
          }
        });
  }

  onClick(event: any): void {
    event.value = null;
    if (this.fileUpload)
      this.fileUpload?.nativeElement.click()
  }

  onFileSelected(event: any): void {
    this.uploadingFile = true;
    this.checkoutForm.controls.emailFormControl.disable();
    const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
    console.log('event::::::', files[0])
    const formData: FormData = new FormData();
    formData.append('file', files[0], files[0].name);
    this.http.post(`api/datasets`, formData)
      .subscribe({
        next: () => {
          this.checkoutForm.controls.emailFormControl.reset();
          this.checkoutForm.controls.emailFormControl.enable();
          this.uploadingFile = false;
        },
        error: () => {
          this.checkoutForm.controls.emailFormControl.enable();
          this.uploadingFile = false;
        },
        complete: () => {
          this.checkoutForm.controls.emailFormControl.reset();
          this.checkoutForm.controls.emailFormControl.enable();
          event.target.value = null
          this.uploadingFile = false;
        },
      });
  }
}
