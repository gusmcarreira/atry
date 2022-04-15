import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ChatAvatarComponent } from './chat-avatar/chat-avatar.component'
import { ChatWidgetComponent } from './chat-widget/chat-widget.component'
import { ChatInputComponent } from './chat-input/chat-input.component'
import { ChatConfigComponent } from './chat-config/chat-config.component'
import { ChatbotService } from './chatbot.service';
import { ChatButtonsComponent } from './chat-buttons/chat-buttons.component';
import { ChatTypingComponent } from './chat-typing/chat-typing.component';
import { ChatErrorImageComponent } from './chat-error-image/chat-error-image.component';


@NgModule({
  imports: [CommonModule, BrowserAnimationsModule],
  declarations: [ChatAvatarComponent, ChatWidgetComponent, ChatInputComponent, ChatConfigComponent, ChatButtonsComponent, ChatTypingComponent, ChatErrorImageComponent],
  exports: [ChatWidgetComponent, ChatConfigComponent],
  entryComponents: [ChatWidgetComponent, ChatConfigComponent],
  providers: [ChatbotService]
})
export class ChatbotModule { }
