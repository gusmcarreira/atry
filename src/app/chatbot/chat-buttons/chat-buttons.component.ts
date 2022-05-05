import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatbotService } from '../chatbot.service';

@Component({
  selector: 'chat-buttons',
  template: `
    <button [title]="this.titleBtn" [disabled]="this.clicked" [class.disabled]='this.clicked === true' [class.enabled]='this.clicked === false' (click)="onClick()">
      {{btnLabel}}
    </button>
  `,
  styleUrls: ['./chat-buttons.component.css']
})

export class ChatButtonsComponent {
  @Input() public btnLabel: string;
  @Input() public titleBtn: string;
  @Input() public btnPayload: string;
  @Input() public disabled: boolean;
  @Input() public id;
  @Output() public send = new EventEmitter()
  public clicked = false;

  constructor(private chatbotService: ChatbotService) {
    this.chatbotService.enableButton.subscribe(() => {
      if (this.id === this.chatbotService.buttonToEnable) {
        this.clicked = false;
      }
    });
    this.chatbotService.disableButton.subscribe(() => {
      if (this.id === this.chatbotService.buttonToDisable) {
        this.clicked = true;
      }
    });
  }

  onClick() {
    const title = this.btnLabel;
    if (this.btnPayload !== undefined) {
      const message = this.btnPayload
      this.send.emit({ message, title })
    }
    else {
      this.clicked = true;
      this.chatbotService.chooseConcept(this.id, title);
    }
  }
}