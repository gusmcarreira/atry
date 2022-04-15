import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ExperimentalModule } from './experimental/experimental.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ChatbotModule,
    HttpClientModule,
    ExperimentalModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
