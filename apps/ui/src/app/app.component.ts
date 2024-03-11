import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { QuestionComponent } from './components/question/question.component';
import { AnswerComponent } from './components/answer/answer.component';
import { LoadingComponent } from './components/loading/loading.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

type Chat = {
  text: string,
  type: 'question' | 'answer'
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    RouterModule,
    QuestionComponent,
    AnswerComponent,
    LoadingComponent,
    HttpClientModule
  ],
  selector: 'angel-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit{
  @ViewChild('chat', {static:true}) chat: ElementRef | undefined;

  title = 'Ask Me';
  chats: Array<Chat> = JSON.parse(localStorage.getItem("chats") || "[]");
  isLoading = false;

  addAnswer($event: any): void {
    this.chats.push($event);
    localStorage.setItem("chats", JSON.stringify(this.chats));
    if (this.chat?.nativeElement) {
      this.chat.nativeElement.scrollTop = this.chat?.nativeElement.scrollHeight + 250;
    }
  }

  loadingCheck($event: boolean): void {
    this.isLoading = $event;
    if (this.chat?.nativeElement) {
      this.chat.nativeElement.scrollTop = this.chat?.nativeElement.scrollHeight + 250;
    }
  }

  ngAfterViewInit(): void {
    if (this.chat?.nativeElement) {
      this.chat.nativeElement.scrollTop = this.chat?.nativeElement.scrollHeight + 60;
    }
  }
}
