export interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  highlights?: string[];
  isItalic?: boolean;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  chapters: Chapter[];
  stats: {
    radar: number[];
    encounters: { name: string; value: number }[];
  };
}

export const SESSIONS: Session[] = [
  {
    id: 'sessao-1',
    title: 'O Despertar da Churrasqueira',
    date: 'Dia 1',
    chapters: [
      {
        title: 'Capítulo 1 — A Tempestade',
        imageUrl: '/assets/illustrations/cap1_tempestade.png',
        content: `Era para ser apenas mais uma noite comum entre amigos.

A churrasqueira estava acesa, a carne assando lentamente enquanto o cheiro se misturava com o ar úmido do início da noite. Copos sobre a mesa, risadas soltas e uma pilha de fichas e dados aguardando o início de mais uma sessão de RPG. André, Rodrigo, Alícia, Eric e Lucas já estavam acomodados, discutindo regras, personagens e possibilidades, como faziam tantas outras vezes.

Nada parecia fora do lugar.

Até o vento mudar.

Foi sutil no começo, quase imperceptível, como uma corrente fria atravessando o ambiente. As conversas foram diminuindo aos poucos, não por decisão consciente, mas porque algo no ar parecia errado. Quando olharam para o céu, viram nuvens escuras se formando com uma velocidade impossível, avançando como se fossem empurradas por alguma força invisível.

— Isso não é normal… — alguém comentou, sem tirar os olhos do céu.

A resposta veio em forma de chuva.

Não uma chuva comum, mas uma pancada violenta, pesada, que caiu de uma só vez, como se o céu tivesse se rompido. Em poucos segundos, a área da churrasqueira começou a alagar, a água avançando rapidamente pelo chão.

Sem pensar, os cinco correram em direção à casa, atravessando a área da piscina, que já transbordava como se estivesse sendo alimentada por algo além da própria chuva.

Foi nesse momento que o mundo pareceu parar.

Um clarão branco rasgou o céu.

O som veio depois — um estrondo tão forte que pareceu atravessar o corpo de cada um deles.

E então, tudo ficou escuro.`,
      },
      {
        title: 'Capítulo 2 — O Chamado',
        imageUrl: '/assets/illustrations/cap2_morte.png',
        content: `A consciência voltou devagar, como se emergisse de um lugar profundo demais.

Nenhum deles conseguia abrir os olhos, nem mover o corpo. Era como estar preso dentro da própria mente, consciente, mas desconectado do mundo. Ao redor, não havia som, não havia forma — apenas uma escuridão absoluta.

Mas aquela escuridão não estava vazia.

Algo começou a surgir ao longe, uma presença tomando forma dentro do vazio. Primeiro uma silhueta indistinta, depois contornos mais definidos, até que se revelou completamente: alta, envolta em sombras, portando a inevitável imagem que todos reconhecem sem nunca ter visto de verdade.

A morte.

Ela não caminhava, mas se aproximava.

E quando falou, sua voz não ecoou no espaço — ecoou dentro deles.

— Cinco almas devem ser escolhidas.

O silêncio que se seguiu pareceu ainda mais pesado.

— Mas eu não sei quais.

Havia algo de perturbador naquela indecisão. Algo que tornava tudo ainda mais errado.

— Então vocês serão enviados.

Uma pausa.

— A sua salvação está no Códice Gygax.

Antes que qualquer um pudesse reagir, perguntar ou sequer compreender, a presença desapareceu, como se nunca tivesse existido.

E então veio o retorno.`,
      },
      {
        title: 'Capítulo 3 — O Despertar',
        imageUrl: '/assets/illustrations/cap3_despertar.png',
        content: `Quando finalmente conseguiram abrir os olhos, o mundo já não era mais o mesmo.

O ar era frio, carregado com o cheiro úmido de pedra e terra. Estavam em um corredor que parecia impossível de existir: as paredes eram feitas de tijolos bem estruturados, mas se fundiam com a própria rocha da caverna, enquanto estalactites pendiam do teto. Pequenas pedras azuladas incrustadas nas paredes emitiam uma luz fraca, suficiente apenas para revelar o ambiente ao redor.

Mas não foi o cenário que causou o maior impacto.

Foi quando olharam uns para os outros.

O susto foi imediato, quase instintivo. Nenhum deles parecia mais humano.

André percebeu em si traços élficos, mas não apenas isso — havia algo diferente, algo quase etéreo, como se seu corpo estivesse parcialmente conectado a outro plano. Eric, por sua vez, carregava a aparência marcante de um drow, com sua pele escura e feições afiadas. Alícia agora possuía asas delicadas, brilhando suavemente, enquanto Lucas havia se tornado menor, ágil, claramente um halfling. Rodrigo era o mais impactante: um guerreiro de porte imponente, com traços felinos, um tigre humanoide que exalava força e instinto.

O choque inicial deu lugar à confusão, e a confusão, lentamente, ao entendimento.

Apesar dos corpos diferentes… ainda eram eles.

A prova definitiva veio quando começaram a falar sobre o que haviam vivido antes de acordar.

O “sonho”.

A figura.

A mensagem.

Todos tinham visto a mesma coisa.

Todos ouviram sobre o Códice Gygax.

Aquilo não era coincidência.

Era um propósito.

Ou uma sentença.`,
      },
      {
        title: 'Capítulo 4 — O Primeiro Caçador',
        imageUrl: '/assets/illustrations/cap4_naga.png',
        content: `A conversa foi interrompida por um som que não pertencia àquele momento.

Um silvo.

Vindo de um dos lados do corredor, carregado de intenção.

A voz que o acompanhava era estranha, como se as palavras fossem moldadas por uma língua que não deveria falar o idioma deles. Ainda assim, Alícia entendeu.

— Eles disseram para fugirmos.

A reação foi imediata.

Sem discutir, sem hesitar, todos começaram a correr na direção oposta.

Rodrigo foi o primeiro a agir, movido por um impulso que parecia mais forte que qualquer raciocínio. Ele agarrou Lucas pelo braço, puxando-o consigo enquanto acelerava o passo.

— Vem!

Mas algo dentro dele mudou.

Seu corpo respondeu de forma diferente, mais rápida, mais eficiente. Seus movimentos se ajustaram sem esforço, e quando percebeu, já não corria mais como um homem.

Corria como uma fera.

Ao se lançar sobre quatro patas, sua velocidade aumentou drasticamente. O mundo ao redor virou um borrão, e em poucos segundos ele já havia alcançado — e ultrapassado — todos os outros.

Foi só então que a consciência o alcançou.

Lucas.

Rodrigo freou bruscamente, girando o corpo e olhando para trás.

A distância o atingiu como um golpe.

Lucas estava muito atrás.

Pequeno, tentando acompanhar, mas incapaz de manter o ritmo. O restante do grupo continuava correndo, sem perceber o que havia acontecido.

Sem pensar duas vezes, Rodrigo voltou.

Dessa vez controlado, consciente, dominando o próprio corpo.

Quando chegou até Lucas, o ergueu sem esforço e o colocou sobre os ombros.

— Segura firme.

E voltou a correr, agora apenas com duas pernas, reduzindo a velocidade para manter o controle, mas ainda rápido o suficiente para alcançar os outros.

Foi nesse momento que o perigo se revelou completamente.

Eric percebeu primeiro o movimento no teto, algo se deslocando entre as sombras.

Lucas, ainda sobre os ombros de Rodrigo, conseguiu enxergar melhor.

A criatura era grotesca — uma enorme cobra naja, mas com braços humanos, empunhando um arco com precisão inquietante.

Eles mal tiveram tempo de reagir.

A flecha cortou o ar.

E atingiu Alícia.

O combate foi imediato. Eric respondeu com magia, enquanto a fada, mesmo ferida, reuniu forças para liberar uma energia luminosa e multicolorida que atingiu a criatura em cheio.

Ela caiu do teto, e o impacto no chão quebrou seu pescoço com um estalo seco.

O silêncio que se seguiu foi curto.

Outras vozes surgiram ao longe.

— Derrubaram o batedor?

E então um som alto e estridente tomou o corredor.

Um alarme.

Passos começaram a ecoar dos dois lados.

Não havia mais fuga fácil.

Eles estavam cercados.`,
      },
      {
        title: 'Capítulo 5 — A Pedra Oculta',
        imageUrl: '/assets/illustrations/cap5_pedra_oculta.png',
        content: `Encurralados entre dois perigos que se aproximavam rapidamente, o grupo se viu pela primeira vez diante da possibilidade real de não sobreviver nem aos primeiros minutos naquele novo mundo.

As vozes serpenteantes ecoavam atrás deles, carregadas de irritação e alerta, enquanto à frente o som de passos se tornava cada vez mais evidente. O alarme preenchia o corredor com um som agudo e incessante, tornando impossível pensar com clareza.

Ainda assim, Lucas pensou.

Enquanto os outros se posicionavam instintivamente ao seu redor, preparando-se para um confronto inevitável, o halfling deixou o olhar correr pelas paredes. Pequenos detalhes, padrões, irregularidades — qualquer coisa que fugisse do óbvio.

Foi então que ele percebeu.

Uma das pedras azuladas não brilhava como as outras. Havia algo de levemente deslocado nela, como se não pertencesse completamente àquela estrutura.

Sem perder tempo, aproximou-se e a pressionou.

O clique foi quase inaudível, mas o efeito foi imediato.

Uma parte da parede deslizou para dentro, revelando uma passagem estreita.

— Aqui! — ele chamou, já entrando.

Os outros não hesitaram. Um a um, atravessaram a abertura, e assim que o último passou, Lucas acionou novamente o mecanismo, fechando a passagem exatamente no momento em que o som das criaturas alcançava o ponto onde eles estavam segundos antes.

O silêncio que veio depois não era tranquilizador.

Mas, pelo menos, ainda estavam vivos.`,
      },
      {
        title: 'Capítulo 6 — O Quarto Esquecido',
        imageUrl: '/assets/illustrations/cap6_mimico.png',
        content: `A escuridão dentro da sala era quase completa.

Para André, Eric e Rodrigo, isso não era um problema — seus novos olhos se adaptavam naturalmente à ausência de luz. Mas para Alícia e Lucas, o ambiente era apenas um vazio indistinto.

Percebendo isso, Alícia ergueu as mãos e, com um leve esforço, fez surgir uma luz suave e colorida que se espalhou pelo cômodo, revelando o que havia ali.

Era um quarto antigo.

Abandonado.

Uma cama encostada à parede, coberta por lençóis gastos e poeira acumulada ao longo de anos — ou talvez séculos. Uma escrivaninha praticamente destruída, com madeira rachada e partes faltando. E um baú, fechado, aparentemente intacto.

Do outro lado, uma porta com um símbolo estranho gravado em sua superfície, pulsando com uma energia fraca e instável.

Sem precisar combinar, cada um começou a investigar uma parte do ambiente.

Alícia aproximou-se da cama, confirmando o óbvio: não havia nada ali além de abandono.

André foi até a escrivaninha. Apesar do estado precário, uma pequena gaveta parecia ainda funcional. Com cuidado, ele a abriu.

Dentro, encontrou um objeto incomum.

Um amuleto.

De um lado, a figura de um macaco esculpido com detalhes surpreendentes. Do outro, uma inscrição em uma língua que ele não reconhecia.

Antes que pudesse explorar melhor aquilo, um som brusco cortou o ambiente.

Rodrigo havia tentado abrir o baú.

E o baú respondeu.

A tampa se abriu de forma grotesca, revelando uma boca cheia de dentes irregulares, que se fechou violentamente sobre o braço do tabaxi, prendendo-o com força.

O rugido de dor veio junto com o impacto.

— É um mímico! — alguém gritou.

Lucas reagiu sem hesitar. Avançou com suas adagas, golpeando a criatura duas vezes em pontos vulneráveis. O efeito foi imediato. A pressão diminuiu, e o “baú” começou a perder sua forma, amolecendo como se estivesse se desfazendo.

Poucos segundos depois, estava imóvel.

Morto.

Rodrigo recuou, ainda ofegante, sacudindo o braço para recuperar a mobilidade.

— Beleza… agora a gente já sabe que até os móveis querem matar a gente — murmurou alguém.

Com o perigo imediato resolvido, André mostrou o amuleto ao grupo.

Após alguns segundos analisando a inscrição, finalmente alguém conseguiu compreender o significado:

— “Aquele que possui o macaco… em qualquer besta pode se transformar.”

O silêncio que se seguiu foi diferente dos anteriores.

Era curiosidade.

E oportunidade.`,
      },
      {
        title: 'Capítulo 7 — O Poder do Amuleto',
        imageUrl: '/assets/illustrations/cap7_amuleto.png',
        content: `Os testes começaram ali mesmo.

André foi o primeiro a tentar. Concentrou-se na criatura que haviam enfrentado anteriormente — a naga — mas nada aconteceu. Houve um bloqueio, uma resistência invisível.

Então mudou o foco.

Pensou em algo mais simples.

Um lobo.

Dessa vez, funcionou.

Seu corpo se transformou com fluidez, adaptando-se à nova forma como se aquilo sempre tivesse sido possível. Em seguida, testou outras possibilidades — uma formiga, um urso — e em todas obteve sucesso.

Eric observava com atenção.

Quando pegou o amuleto, pediu que todos se afastassem. Respirou fundo, focou em algo muito maior… e, diante dos olhos do grupo, transformou-se em um mamute.

O impacto daquilo foi imediato.

O amuleto não era apenas útil.

Era perigoso.

E extremamente poderoso.

Já com uma compreensão básica do artefato, decidiram seguir em frente.`,
      },
      {
        title: 'Capítulo 8 — As Runas e o Guardião',
        imageUrl: '/assets/illustrations/cap8_golem.png',
        content: `Ao se aproximarem da porta, Lucas fez o que já começava a se tornar seu papel natural: investigar.

Foi André e Eric, no entanto, que perceberam primeiro.

Uma runa.

Discreta, mas carregada de energia.

— Pode ser armadilha — alertaram.

Com a ajuda de Rodrigo, que o ergueu até a altura do símbolo, Lucas conseguiu analisá-la de perto e, com habilidade, desativá-la sem disparar o mecanismo.

A porta foi aberta.

Do outro lado, um corredor bem iluminado, com cerca de vinte metros de extensão, terminando em outra porta.

O avanço foi cuidadoso.

Lucas verificava cada trecho, cada possível irregularidade, mas nada parecia fora do lugar.

Até chegarem à segunda porta.

Dessa vez, havia duas runas.

E algo nelas parecia… mais ativo.

Novamente, Rodrigo ergueu Lucas para que ele pudesse trabalhar.

O halfling começou a desarmar a primeira.

Mas falhou.

A reação foi instantânea.

Uma explosão de luz tomou o corredor, cegando André, Rodrigo e Alícia ao mesmo tempo. Apenas Lucas e Eric permaneceram com a visão intacta.

E então, a segunda runa começou a pulsar.

Como um coração.

No centro do corredor, pedras começaram a se mover, se encaixar, se erguer.

Uma forma tomou corpo.

Massiva.

Pesada.

Eric reconheceu imediatamente.

— Golem de pedra.

A tensão explodiu.

Mesmo sem enxergar, André reagiu por instinto. Sabendo que algo grande estava diante deles, ativou o amuleto e assumiu a forma de um rinoceronte, seu corpo expandindo-se de forma abrupta dentro do espaço apertado.

O impacto quase esmagou os próprios aliados contra as paredes.

Mas funcionou.

Na nova forma, sua visão retornou.

Rodrigo avançou, posicionando-se entre o grupo e o golem, pronto para conter o que viesse.

Mas nada veio.

A criatura não atacou.

Permaneceu imóvel.

Observando.

Esperando.`,
      },
      {
        title: 'Capítulo 9 — A Solução Invisível',
        imageUrl: '/assets/illustrations/cap9_mosca.png',
        content: `O silêncio se tornou tenso.

As visões começaram a retornar lentamente para os que haviam sido afetados, e Lucas decidiu testar algo.

Aproximou-se da porta.

Assim que sua mão tocou a maçaneta, o golem se moveu.

Um único passo.

Pesado.

Ameaçador.

Lucas recuou imediatamente.

A mensagem era clara.

A porta estava protegida.

Mas talvez não da forma que imaginavam.

André voltou à forma original e entregou o amuleto a Lucas.

Sem perder tempo, o halfling se transformou em uma mosca e atravessou a fechadura.

Do outro lado, encontrou um ambiente completamente escuro. Para enxergar melhor, assumiu a forma de um gato, adaptando-se ao ambiente com facilidade.

Era uma antesala vazia.

E havia uma escada.

Importante: não havia runas naquele lado da porta.

Voltando à forma original, Lucas abriu a porta por dentro.

No exato momento em que isso aconteceu, o golem simplesmente se desfez, como se nunca tivesse sido necessário.

E talvez nunca tivesse sido.`,
      },
      {
        title: 'Capítulo 10 — O Rei Aprisionado',
        imageUrl: '/assets/illustrations/cap10_rei.png',
        content: `A escada os levou a um salão amplo, imponente, com cerca de trinta metros de comprimento por vinte de largura. Tapeçarias antigas decoravam as paredes, e grandes colunas sustentavam o teto. Não havia janelas, nem outras portas visíveis.

No centro, ao fundo, um trono.

E nele…

Uma caveira.

Sentada.

Imóvel.

Assim que entraram e fecharam a porta, o ambiente mudou.

Entre quinze e vinte figuras espectrais surgiram ao redor, soldados etéreos, todos voltados para o trono.

E então, em perfeita sincronia, ajoelharam-se.

Eric foi o primeiro a entender o gesto.

— Ajoelhem.

O grupo seguiu.

Foi então que o rei falou.

Sua voz era antiga, mas firme.

— Vejo que ainda existem seres honrados neste mundo… aproximem-se, viajantes.

Eles obedeceram, avançando com cautela pelo salão.

E foi nesse momento que algo começou a mudar.

À medida que se aproximavam do trono, a figura sentada deixava de ser apenas ossos. Primeiro, uma camada sutil parecia surgir sobre a caveira, como uma sombra ganhando densidade. Depois, músculos começaram a se formar, preenchendo aquela estrutura vazia. A pele veio em seguida, cobrindo o rosto, os braços, o corpo inteiro.

Não foi instantâneo.

Foi gradual.

Quase como se a própria realidade estivesse sendo reescrita diante deles.

Quando finalmente pararam diante do trono, já não havia mais uma caveira.

Diante deles estava um homem.

De aparência comum.

Carne, osso, expressão… vida.

Mas havia algo nos olhos.

Algo antigo demais para pertencer a um humano comum.

O rei continuou, como se aquilo fosse natural.

Explicou que muitos antes deles haviam chegado à masmorra, mas poucos haviam conseguido atravessar todas as provações. Mais fortes, mais rápidos, mais inteligentes — todos haviam falhado em algum ponto.

Eles não.

E por isso, ele fez algo inesperado.

Quebrou o encantamento que os prendia ali.

— Vocês estão livres para partir.

Um portal se abriu diante deles.

André e Alícia não hesitaram. Ele correu, ela voou.

Mas Eric ficou.

— Existe algo que possamos fazer para ajudá-lo?

O rei hesitou por um breve momento.

— Ainda não. Vocês não possuem força suficiente para quebrar minha prisão. Mas… se um dia retornarem mais fortes…

Uma pausa.

— Eu possuo o Códice. E ele será de vocês.

Como prova, entregou a Eric um pergaminho.

Um meio de retorno.

Lucas, em um gesto simples, ofereceu um pequeno sino ao rei — um sinal de respeito, de honra.

O homem — ou aquilo que agora parecia ser um — inclinou levemente a cabeça.

— Agradeço.

E então, finalmente, todos atravessaram o portal.`,
      },
      {
        title: 'Capítulo 11 — O Mundo Além',
        imageUrl: '/assets/illustrations/cap11_planicie.png',
        content: `A transição foi imediata.

Sem escuridão.

Sem vazio.

Apenas luz.

Quando seus olhos se ajustaram, estavam todos juntos novamente, lado a lado, em uma vasta planície gramada. O vento era leve, o céu aberto, e o silêncio… completamente diferente daquele da masmorra.

Era um silêncio vivo.

Real.

Eles estavam livres.

Mas não por completo.

Agora sabiam que havia um objetivo.

O Códice Gygax existia.

E estava nas mãos de um rei aprisionado.

A jornada, de verdade, começava ali.

E, pela primeira vez, não havia mais dúvidas.

Aquilo não era um jogo.

Era o novo mundo deles.`,
      }
    ],
    stats: {
      radar: [90, 75, 85, 95, 80],
      encounters: [
        { name: 'Combate (Cap 4)', value: 25 },
        { name: 'Puzzle (Cap 6)', value: 25 },
        { name: 'Engenharia (Cap 8)', value: 25 },
        { name: 'Social (Cap 10)', value: 25 },
      ]
    }
  }
];
