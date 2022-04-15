import { Component } from '@angular/core';
import { ChatbotService } from '../chatbot/chatbot.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-experimental',
  templateUrl: './experimental.component.html',
  styleUrls: ['./experimental.component.css']
})
export class ExperimentalComponent {

  constructor(private chatbotService: ChatbotService) { }

  ngOnInit(): void {
  }
  public url: string = environment.LOCAL_URL_CHAT



  public sendMessage({ contexto, mensagem }) {
    this.chatbotService
      // Manda mensagem ao RASA --> chatbot.service.ts
      .sendMessage(this.url, this.chatbotService.senderID, { contexto, mensagem })
  }

}
