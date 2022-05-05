// Adapted from:
// https://github.com/Poio-NLP/poio-chatbot-ui
// https://github.com/contribution-jhipster-uga/angular-chat-widget-rasa
import { Component, HostListener, Input, OnInit } from '@angular/core'
import { fadeIn, fadeInOut } from '../animations'
import { ChatbotService } from '../chatbot.service';

@Component({
  selector: 'chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css'],
  animations: [fadeInOut, fadeIn],
})
export class ChatWidgetComponent implements OnInit {
  // ############################### VARIÁVEIS ###############################
  // Tema do chatbot
  @Input() public theme: 'blue' | 'grey' | 'red' = 'blue';
  // Titulo que aparece na janela do chat
  @Input() public botName: string = 'Monitor';
  // Icons dos users que aparecem na conversa
  @Input() public botAvatar: string = "/assets/botAvatar.png";
  @Input() public userAvatar: string = "/assets/userAvatar.jpg";
  // Primeira mensagem
  @Input() public startingMessage = 'Olá 👋, eu sou um monitor que está aqui para o ajudar. A qualquer momento poderá fazer perguntas como "O que é uma variável?", ou "Qual é um exemplo de uma condição?", que eu farei o meu melhor para responder! Estarei também aqui para quando tiver problemas na resolução dos seus exercicios!'
  // Controla se a janela começa aberta ou fechada
  @Input() public opened: boolean = false;

  // Abrir/fechar janela do chatbot
  public _visible = false;

  // ------------ Variáveis para as mensagens da conversa -------------
  // Contém as mensagens que aparecem na janela do chatbot 
  public messages = [];
  // Array com TODAS as mensagens (inclui a primeira mensagem, 
  // por exemplo, qual foi o erro, que não se mostra ao estudante)
  public wholeConversation = [];
  public isFirstMessage = false; // !!!!!! Verificar utilidadde !!!!!!
  // Controla de quem é a mensagem
  public monitor;
  public estudante;
  // Verifica se é a mensagem inicial
  public isFirstMsg = true;
  // -------------------------------------------------------------------

  // Usada para verificar se o aluno já pode pedir ajuda
  public canAskExHelp = false;

  // ---- Váriáveis usadas para o exercício de ordenar os conceitos ----
  public isConceptOrderDisabled = true;
  public conceptsChosen = [];
  public isVar = false;
  public isVarSet = false;
  public identLevel = "";
  public identArr = [];
  // -------------------------------------------------------------------

  // #########################################################################


  constructor(private chatbotService: ChatbotService) { 
    // ################ CHATBOT SERVICE MENSAGENS DE UPDATES ################
    // --> Novo conceito para adicionar à tela do algorimo (exercício de ornedar) <--
    this.chatbotService.conceptUpdate.subscribe(() => {
      this.checkConcept(this.chatbotService.conceptClicked[0], this.chatbotService.conceptClicked[1]);
    });
    // --------> Já pode pedir ajuda no exercício <----------
    this.chatbotService.helpActivate.subscribe(() => {
      this.canAskExHelp = this.chatbotService.canAskHelp;
    });
    // -------------------------------------------------------------------------------
    // ------------------> Nova mensagem do RASA <-------------------
    // Para quando é mandada uma mensagem ao RASA de outro componente (mensagem de erro, ...)
    this.chatbotService.messageUpdate.subscribe(() => {
      // Novas mensagens
      this.chatbotService.latestMessageArr.subscribe(
        responseMessages => {
          // Se não for a primeira mensagem no array da conversa...
          if (this.messages[0] !== undefined) {
            // Parar animação de estar a escrever (...)
            if (this.messages[0].type === "typing") { this.messages.shift(); }
          }
          // Retornar erro se a mensagem do RASA vier vazia
          if (responseMessages.length === 0) {
            if (!this.isFirstMsg) {
              this.addMessage(this.monitor, "Desculpe estou com algumas dificuldades, por favor tente mais tarde 🤕", "erro", 'received');
            }
          }
          // Mostrar mensagem retornada pelo RASA
          else {
            this.organizeMessages(responseMessages);
            this.isFirstMsg = false;
          }
        });
      // Abrir janela do chat se ela estiver fechada (ao receber mensagem do RASA)
      if (this.visible === false) {
        this.visible = true;
      }
    });
  }
  
  public get visible() {
    return this._visible;
  }
 
  // --> Abre/fecha a janela do chat <--
  @Input() public set visible(visible) {
    this._visible = visible;
  }

  // Função para: adicionar mensagens 
  // O type, é simplesmente para controlar o css dos diferentes tipos (texto, codigo, botões, ...)
  public addMessage(from, text, type, direction: 'received' | 'sent') {
    // Adiciona as mensagens no começo do array (messages) 
    this.messages.unshift({from, text, type, direction, date: new Date().getTime()})
    // Adiciona as mensagens no final do array (wholeConversation)
    // Array para fazer store na base de dados
    this.wholeConversation.push({from, text, type, date: new Date().getTime()});
  }

  ngOnInit() {
    this.estudante = {
      name: this.chatbotService.senderID,
      avatar: this.userAvatar,
    };
    this.monitor = {
      name: this.botName,
      avatar: this.botAvatar,
    };
    // CONECTAR AO RASA
    this.chatbotService
      .initRasaChat()
      .subscribe(
        data => console.log('Rasa conversa inicializada'),
        error => {             
          console.error('Erro ao conectar com RASA')
        }
      );
  }

  // ##################### FUNÇÃO QUE ABRE E FECHA A JANELA DO CHAT #####################
  public toggleChat() {
    if (this.messages.length === 0) {
      // Mostrar mensagem inicial mais informativa
      if (sessionStorage.getItem("chatbot-presentation-message") === null) {
        sessionStorage.setItem("chatbot-presentation-message", "exists");
        this.addMessage(this.monitor, this.startingMessage, 'text', 'received');
      }
      // Mostrar mensagem inicial mais simples
      else {
        this.addMessage(this.monitor, "Olá 👋 em que posso ajudar?", 'text', 'received');
      }
      this.isFirstMsg = false;
    }
    // Se a janela estiver aberta
    if (this.visible) {
      // Apagar mensagens
      this.messages = [];
      this.isFirstMsg = true;
      // Dizer ao RASA para reiniciar conversa
      this.chatbotService
        .sendMessage(this.chatbotService.senderID, "/restart")
    }
    // Se a tela de ordenação do algoritmo estiver ativa, desativar
    if (this.isConceptOrderDisabled === false) {
      this.isConceptOrderDisabled = true;
      this.conceptsChosen = [];
    }
    // Se aberta -> fechar || Se fechadad -> abrir
    this.visible = !this.visible
  }
  // ####################################################################################
  
  // Função que: Faz a conecção com o chatbot.service para mandar as mensagens ao RASA
  // Adicinar as mensagens que o RASA retorna ao messages array (através da função addMessage)
  public sendMessage({ message }) {
    // ----------------> ESTÁ NO EXERCÍCIO DE ORDENAR OS CONCEITOS <----------------
    if (this.isConceptOrderDisabled === false) {
      let reallyDisable = true;
      // Nada escrito no input, verificar conceitos
      if(message === "") {
        // Não fazer nada se o aluno não tiver escolhido nenhum conceito
        if (this.conceptsChosen.length === 0) {
          return
        }
        else {
          // Verificar se existem butões (se sim, remover para o estudante nao poder clicar)
          for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].type === "buttons_order" || this.messages[i].type === "buttons_order_second") {
              this.messages.splice(i, 1);
            }
          }
          // Adiciona a mensagem do estudante ao array da conversa 
          this.addMessage(this.estudante, "Ordem definida", "text", 'sent');
          // Adiciona uma animação como se o bot estivesse a escrever
          this.addMessage(this.monitor, message, "typing", 'received');
          this.chatbotService
            // Manda mensagem ao RASA --> chatbot.service.ts
            .sendMessage(this.chatbotService.senderID, this.sendOrderConcepts());
        }
        // Apagar conceitos que tinham sido escolhidos pelo estudante
        this.conceptsChosen = [];
      }
      // O estudante escrevreveu algo, apenas pode ser parar ou para
      else {
        // Escreveu que queria parar
        if (message.toLowerCase() === "parar" || message.toLowerCase() === "para") {
          // Verificar se existem butões (se sim, remover para o estudante nao poder clicar)
          for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].type === "buttons_order" || this.messages[i].type === "buttons_order_second") {
              this.messages.splice(i, 1);
            }
          }
          // Adiciona a mensagem do estudante ao array da conversa 
          this.addMessage(this.estudante, message, "text", 'sent');
          // Adiciona uma animação como se o bot estivesse a escrever
          this.addMessage(this.monitor, message, "typing", 'received');
          this.chatbotService
            // Manda mensagem ao RASA --> chatbot.service.ts
            .sendMessage(this.chatbotService.senderID, message);
        }
        // Escreveu outra coisa
        else {
          this.addMessage(this.monitor, "Se quiser parar diga, PARAR", "text", 'received');
          this.isConceptOrderDisabled = false;
          reallyDisable = false;
        }
      }
      if (reallyDisable === true) {
        this.isConceptOrderDisabled = true;
        this.conceptsChosen = [];
      }
    }
    // -----------------------------------------------------------------------------
    // -----------------------------> Mensagem Normal <-----------------------------
    else {
      if (message[0] == '"') {
        message = message.substring(1, message.length - 1);
      }
      // Não retorna nada se o input estiver vazio
      if (message.trim() === '') {
        return
      }
      // Verificar se existem butões (se sim, remover para o estudante nao poder clicar)
      for (let i = 0; i < this.messages.length; i++) {
        if (this.messages[i].type === "buttons") {
          this.messages.splice(i, 1);
        }
      }
      // Adiciona a mensagem do estudante ao array da conversa 
      this.addMessage(this.estudante, message, "text", 'sent');
      // Adiciona uma animação como se o bot estivesse a escrever
      this.addMessage(this.monitor, message, "typing", 'received');
      this.chatbotService
        // Manda mensagem ao RASA --> chatbot.service.ts
        .sendMessage(this.chatbotService.senderID, message)
    }
    // -----------------------------------------------------------------------------
  }

  // Função que organiza as mensagens consoante o seu tipo
  public organizeMessages(messages) {
    let i = 0
    while (messages[i]) {
      let code_str = ""
      // --------------> BOTÕES - NORMAIS <-------------
      // Se a mensagem contiver botões, verificar se também contém texto
      if (messages[i].type === "buttons") {
        if (messages[i].message !== undefined) {
          this.addMessage(this.monitor, messages[i].message, "text", 'received');
        }
        this.addMessage(this.monitor, messages[i].buttons, messages[i].type, 'received');
      }
      // ---------> BOTÕES - ORDENAR CONCEITOS <---------
      else if (messages[i].type === "buttons_order") {
        this.addMessage(this.monitor, messages[i].message, messages[i].type, 'received');
        console.log("here")
        // Mostrar tela do algoritmo
        this.isConceptOrderDisabled = false;
      }
      // ----> BOTÕES - ORDENAR CONCEITOS > PISTAS <-----
      else if (messages[i].type === "buttons_order_second") {
        // Para cada opção colocar no array da tela do algoritmo 
        messages[i].message.forEach(element => {
          if (element[1] === undefined) { this.appendCluesArr("none", element);}
          else { this.appendCluesArr(element[0], element[1]);}
        });
      }
      // ------------------> CÓDIGO <------------------
      // Ver se mensagem é código (código vem com tabs pelo meio o que separa em
      // várias mensagens, então temos de fazer concat dessas strings)
      else if (messages[i].type === "code") {
        while (messages[i].message.includes("</code>") === false) {
          code_str = code_str + messages[i].message + "\n\n";
          i++;
        }
        code_str = code_str + messages[i].message.replace("</code>", "").substring(-1);
        if (code_str[0] === "\n"){
          code_str = code_str.substring(1);
        }
        this.addMessage(this.monitor, code_str, "code", 'received');
      }
      else {
        this.addMessage(this.monitor, messages[i].message, messages[i].type, 'received');
      }
      i++;
    }
  }

  // ########################## EXERCÍCIO DE ORDENAR ##########################

  // Função que adiciona as pistas do "Ordenar algoritmo" à tela do exercício
  public appendCluesArr(btnId, text) {
    if (text !== "" && text !== "var") {
      this.chatbotService.sendDisableButton(btnId);
    }
    // ------------------ Variáveis ------------------
    // Esta condição serve para controlar o número de espaços 
    if (text === "var") {
      this.isVar = true;
      this.conceptsChosen.push(["empty", this.conceptsChosen.length, ""]);
    }
    // A pista é a declaração de uma variavel
    else if (text === "Declaração de variável") {
      this.isVar = true;
      this.isVarSet = true;
      this.conceptsChosen.push(["var", this.conceptsChosen.length, btnId, [this.normalizeText(text), "=", ""]])
    }
    // --------------- Dado da variável --------------
    else if (this.isVar === true) {
      if (text === "") {
        this.isVar = false;
        this.isVarSet = false;
      } 
      else {
        this.isVar = false;
        // A dica da declaração desta variável ainda não foi dada
        if (this.isVarSet === false) {
          this.conceptsChosen[this.conceptsChosen.length - 1][0] = "var";
          this.conceptsChosen[this.conceptsChosen.length - 1].push(["", "=", [btnId, this.normalizeText(text)]]);
        }
        // Uma das outras pistas foi a declaração da própria variável
        else {
          this.isVarSet = false;
          this.conceptsChosen[this.conceptsChosen.length - 1][3][2] = [btnId, this.normalizeText(text)];
        }
      }
    }
    // --------------- Dado em branco ----------------
    else if (text === "") {
      this.conceptsChosen.push(["empty", this.conceptsChosen.length]);
    }
    // ------------------ Outro dado -----------------
    else {
      this.isVar = false;
      this.conceptsChosen.push(["normal", this.conceptsChosen.length, btnId, this.normalizeText(text)]);
    }
  }

  // Função que adicina a opção do botão, à tela do exercício
  public checkConcept(btnId, text){
    // Verificar se existe um espaço em branco, de uma conceito previamente apagado
    // Se sim adicinar nesse espaço
    let thereIsEmpty = false;
    for (let i = 0; i < this.conceptsChosen.length; i++) {
      // Existe espaço (completo) vazio
      if (this.conceptsChosen[i][0] === "empty"){
        thereIsEmpty = true;
        if (text == "Declaração de variável") {
          this.conceptsChosen[i] = ["var", i, btnId, [this.normalizeText(text), "=", ""]];
        }
        else {
          this.conceptsChosen[i] = ["normal", i, btnId, this.normalizeText(text)];
        }
        break;
      }
      else if(this.conceptsChosen[i][0] === "var"){
        // Existe espaço (de um dado de um variável) vazio
        if (this.conceptsChosen[i][3][2] === "") {
          thereIsEmpty = true;
          this.conceptsChosen[i][3][2] = [btnId, this.normalizeText(text)];
          break;
        }
        // Existe espaço (de declaração de variavel) vazio
        else if (this.conceptsChosen[i][3][0] === ""){
          let new_text = this.normalizeText(text);
          // Preencher apenas com declaração de variável
          if (new_text === "variável") {
            thereIsEmpty = true;
            this.conceptsChosen[i][2] = btnId;
            this.conceptsChosen[i][3][0] = this.normalizeText(text);
            break;
          }
        }
      }
    }
    // Se não houver nenhum espaço vazio, continuar a completar
    if (thereIsEmpty === false) {
      if (text == "Declaração de variável") {
        this.isVar = true;
        this.conceptsChosen.push(["var", this.conceptsChosen.length, btnId, [this.normalizeText(text), "="]]);
      }
      else if (this.isVar === true) {
        this.isVar = false;
        this.conceptsChosen[this.conceptsChosen.length - 1][3].push([btnId, this.normalizeText(text)]);
      }
      else {
        this.conceptsChosen.push(["normal", this.conceptsChosen.length, btnId, this.normalizeText(text)]);
      }
    }
  }

  // Fazer display (na tela do ex do algoritmo) de texto mais amigável
  public normalizeText(text) {
    if (text == "Declaração de variável") { return "variável" }
    else if (text == "Leitura de dado do teclado"){ return "input" }
    else if (text.includes("Dado")) { return text.split(" - ")[1] }
    else if (text === "Impressão (print) de dado") { return "print" }
    else { return text }
  }

  // Ao clicar num botão presente no quadro do algoritmo, 
  // remover essa opção e voltar a ativar botão da opção
  public eraseChoice(id, btnID, text) {
    let btnIDFinal = btnID;
    if (text == "variável") {
      // A variavel nao tem dado
      if (Array.isArray(this.conceptsChosen[id][3][2]) === false) {
        // Se for o último elemento, remover do array
        if (id === this.conceptsChosen.length - 1) {
          if (this.conceptsChosen[id][3][2] !== undefined) {
            if (this.conceptsChosen[id][3][2] !== "") {
              btnIDFinal = [btnIDFinal, this.conceptsChosen[id][3][2][0]]
            }
          }
          this.conceptsChosen.pop();
        }
        // Se não for o último elemento, subsituir por empty string
        else {
          this.conceptsChosen[id][0] = "empty";
          this.conceptsChosen[id][3] = "";
        }
      }
      else { this.conceptsChosen[id][3][0] = ""; }
    }
    else {
      // Se for uma opção atribuida a uma variável, subsitui por empty string
      if (Array.isArray(this.conceptsChosen[id][3])) {
        if (this.conceptsChosen[id][3][0] === "") {
          if (id === this.conceptsChosen.length - 1) {
            this.conceptsChosen.pop();
          }
          else {
            this.conceptsChosen[id][0] = "empty";
            this.conceptsChosen[id][3] = "";
          }
        }
        else { this.conceptsChosen[id][3][2] = ""; }
      }
      else {
        // Se for o último elemeneto, remover do array
        if (id === this.conceptsChosen.length - 1) { this.conceptsChosen.pop(); }
        // Se não for o último elemeneto, subsituir por empty string
        else {
          this.conceptsChosen[id][0] = "empty";
          this.conceptsChosen[id][3] = "";
        }
      }
    }
    this.chatbotService.sendEnableButton(btnIDFinal);
  }

  // Função que retira as opções escolhidas pelo aluno,
  // retorna-as ao seu texto inicial para depois 
  // para depois enviar ao RASA
  public sendOrderConcepts() {
    let answer = ""
    for(let i = 0; i < this.conceptsChosen.length; i++) {
      let currConcept = this.conceptsChosen[i];
      if (currConcept[0] === "var") {
        answer = answer + "Declaração de variável" + "<sep>";
        if (currConcept[3][2] !== undefined && currConcept[3][2] !== "") {
          if (currConcept[3][2][1] == "input") {
            answer = answer + "Leitura de dado do teclado" + "<sep>";
          }
          else if (currConcept[3][2][1] == "print") {
            answer = answer + "Impressão (print) de dado" + "<sep>";
          }
          else if (currConcept[3][2][1] == "texto (string)" || currConcept[3][2][1] == "inteiro (int)" || currConcept[3][2][1] == "número decimal (float)" || currConcept[3][2][1] == "Lista") {
            answer = answer + "Dado - " + currConcept[3][2][1] + "<sep>";
          }
          else {
            answer = answer + currConcept[3][2][1] + "<sep>";
          }
        }
      }
      else {
        if (currConcept[3] == "input") {
          answer = answer + "Leitura de dado do teclado" + "<sep>";
        }
        else if (currConcept[3] == "print") {
          answer = answer + "Impressão (print) de dado" + "<sep>";
        }
        else if (currConcept[3] == "texto (string)" || currConcept[3] == "inteiro (int)" || currConcept[3] == "número decimal (float)" || currConcept[3] == "Lista") {
          answer = answer + "Dado - " + currConcept[3] + "<sep>";
        }
        else {
          answer = answer + currConcept[3] + "<sep>";
        }
      }
    }
    return answer
  }
  // ##########################################################################

  public checkArr(targetArr) {
    return Array.isArray(targetArr)
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === '/') {
      //this.focusMessage()
    }
    if (event.key === '?' && !this._visible) {
      this.toggleChat()
    }
  }
}