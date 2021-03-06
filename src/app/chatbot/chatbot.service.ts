import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class ChatbotService {
  constructor(private http: HttpClient) { }
  // ------------------ VARIÁVEIS ------------------
  // Mandar as mensagens para o widget
  public latestMessageArr:Observable<any[]>;
  public messageUpdate = new EventEmitter();
  // Adicionar conceito à tela do algoritmo (quando se pressiona o botão - chat-buttons)
  public conceptUpdate = new EventEmitter();
  public conceptClicked;
  // Ativar e desativar botões de escolha de conceitos (quando é para ordenar)
  public enableButton = new EventEmitter();
  public buttonToEnable;
  public disableButton = new EventEmitter();
  public buttonToDisable;
  // Informar o chatbot que o aluno já pode pedir ajuda no exercício
  public helpActivate = new EventEmitter();
  public canAskHelp = false;
  // Informações para mandar a mensagem ao RASA
  public senderID = Math.random()
    .toString(36)
    .substr(2);
  // URL para se conectar ao chatbot
  public url: string = environment.URL_CHAT;

  // Usada quando o RASA manda dicas da ordem do algoritmo
  // Desativa os botões das dicas devolvidas
  // De: chat-widget Para: chat-buttons
  public sendDisableButton(id) {
    this.buttonToDisable = id;
    this.disableButton.emit();
  }

  // Usada para reativar os botões quando o aluno quer voltar atrás 
  // Ativada ao clicar no conceito na tela de ordenar os conceitos
  // De: chat-widget Para: chat-buttons
  public sendEnableButton(id) {
    if (Array.isArray(id) === true) {
      id.forEach(element => {
        this.buttonToEnable = element;
        this.enableButton.emit();
      });
    } 
    else {
      this.buttonToEnable = id;
      this.enableButton.emit();
    }
  }

  // Usada para adicionar conceito escolhido pelo aluno à tela de ordenar conceitos
  // De: chat-buttons Para: chat-widget
  public chooseConcept(btnId, concept){
    this.conceptClicked = [btnId, concept];
    this.conceptUpdate.emit();
  }

  // Usada para informar o chatbot que o aluno já pode pedir ajuda sobre o ex (2 min)
  public enableStudentAskExHelp() {
    this.canAskHelp = false;
    this.helpActivate.emit();
    setTimeout(() => {
      this.canAskHelp = true;
      this.helpActivate.emit();
    }, 120000)
  }

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! RASA !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // Faz conecção com o RASA (reinicia a conversa --> /restart)
  public initRasaChat(): Observable<any> {
    const trackerEventsUrl = this.url + `/conversations/${this.senderID}/tracker/events`;
    return this.http
      .post(trackerEventsUrl, {
        event: 'restart'
      })
      .pipe(
        mergeMap(() =>
          this.http.post(trackerEventsUrl, {
            event: 'action',
            name: 'action_listen'
          })
        ),
      );
  }

  // Manda as mensagens ao RASA
  // url: para se conectar ao rasa
  // user: id do user (necessário para o rasa) (estou a fazer de forma aleatória aqui neste service)
  // message: mensagem para mandar ao RASA
    // mensagem para o erro {'contexto': 'Função', 'mensagem': 'Faltou utilizar :'}
    // mensagem para a ajuda no exercício {teste: testCase, resposta: answerCode}
  public sendMessage(user, message){
    // ################## REFORMULAR MENSAGEM ##################
    if (typeof message !== 'string') {
      if (message.contexto !== undefined) {
        message = `/EXTERNAL_ERROR_MESSAGE{"error_type":"${message.contexto}", "error_message":"${message.mensagem}"}`
      }
      else {
        // O RASA é um pouco estranho com as mensagens que aceita, por isso tenho de as modificar
        // --- Formar a string com o/os input/s e o/os output/s do caso de teste ---
        let test_case = message.teste;
        let test_case_string = "";
        test_case[0].forEach(element => test_case_string = test_case_string + "<input>" + element);
        test_case_string = test_case_string + "<sep>";
        test_case[1].forEach(element => test_case_string = test_case_string + "<output>" + element);
        // -------------------------------------------------------------------------
        // Aqui estou a remover novas linhas e tabs
        // Se resultar em erro, poderá ser porque a string que contém o código está envolvida com ('), em vez de ("), acho que quando tentei ele não gostou
        let resposta_código = message.resposta.replaceAll("\n", "<new_line>").replaceAll("\t", "<tab>");
        message = `/EXTERNAL_CODE_MESSAGE{"code_test_case":"${test_case_string}", "code_message_answer":"${resposta_código}"}`
      }
    }
    // #########################################################
    // #################### MANDAR MENSAGEM ####################
    const rasaMessageUrl = this.url + "/webhooks/rest/webhook";
    this.latestMessageArr = this.http
      .post<any[]>(rasaMessageUrl, {
        message,
        sender: user,
      })
      .pipe(
        map((responseMessages: any[]) =>
          responseMessages.map(m => {
            // ##### -> Para os diferentes tipos de resposta <- #####
            // Para quando a resposta conté botões
            if (m["buttons"] !== undefined) {
              // Verificar se a resposta também contém texto
              if (m["text"] !== undefined) {
                return {message: m["text"], buttons: m["buttons"], type: "buttons"}
              }
              // Apenas contém butões
              else {
                return {buttons: m["buttons"], type: "buttons"}
              }
            }
            
            else {
              // Estas tags, parecidas a html, foram fabricadas por mim apenas para simbolizar 
              // os diferentes tipos te texto
              // --> Resposta contém código <--
              if (m["text"].includes("<code>")){
                return { message: m["text"].replace("<code>", ""), type: "code" }
              }
              // --> Resposta contém resultado do código <--
              else if (m["text"].includes("<code_print>")) {
                return { message: m["text"].replace("<code_print>", ""), type: "print" }
              }
              // --> Resposta contém os botões para o exercício de ordenar <--
              else if (m["text"].includes("<buttons_order>")) {
                let btnArr = m["text"].replace("<buttons_order>", "").split("<sep>");
                let btnArrFinal = []
                btnArr.forEach(element => {
                  btnArrFinal.push(element.split("<num>"));
                });
                return { message: btnArrFinal, type: "buttons_order" }
              } 
              // --> Resposta contém dicas para o exercício de ordenar <--
              else if (m["text"].includes("<buttons_order_second>")) {
                let btnArr = m["text"].replace("<buttons_order_second>", "").split("<sep>");
                let btnArrFinal = []
                btnArr.forEach(element => {
                  btnArrFinal.push(element.split("<num>"));
                });
                return {message: btnArrFinal, type: "buttons_order_second" }
              }
              // --> Resposta é texto simples <--
              return {message: m["text"], type: "text"}
            }
          })
        ),
    )
    // Informar o widget de nova resposta do chatbot
    this.messageUpdate.emit();
    // #########################################################
  }
}
