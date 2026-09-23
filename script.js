
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 600;


/* =========================================================
   ÁUDIO DO JOGO
   Coloque seus arquivos dentro de:

   assets/audio/

   Arquivos esperados:
   - tiro.mp4
   - fundo.mp4
   - alien.mp4
   - gameover.mp4
   ========================================================= */

const somTiro = new Audio("assets/audio/tiro.mp3");
const musicaFundo = new Audio("assets/audio/fundo.mp3");
const somAlien = new Audio("assets/audio/alien.mp3");
const musicaGameOver = new Audio("assets/audio/gameover.mp3");


// Música de fundo fica repetindo
musicaFundo.loop = true;


// Volumes
somTiro.volume = 0.45;
somAlien.volume = 0.30;
musicaFundo.volume = 0.40;
musicaGameOver.volume = 0.5;


// Controla se o áudio já foi liberado pelo navegador
let audioLiberado = false;


/* =========================================================
   INICIAR ÁUDIO APÓS INTERAÇÃO DO JOGADOR
   ========================================================= */

function iniciarAudio() {

  if (audioLiberado) {
    return;
  }

  audioLiberado = true;

  musicaGameOver.pause();
  musicaGameOver.currentTime = 0;

  musicaFundo.play().catch(() => {
    // Navegador bloqueou o áudio.
    // Ele poderá tentar novamente na próxima interação.
    audioLiberado = false;
  });
}


/* =========================================================
   TOCAR EFEITO SONORO
   Permite vários sons sobrepostos.
   ========================================================= */

function tocarSom(audio) {

  const som = audio.cloneNode();

  som.volume = audio.volume;

  som.play().catch(() => {
    // Ignora caso o navegador bloqueie o áudio.
  });
}


/* =========================================================
   PERSONAGEM
   ========================================================= */

const personagem = new Image();

personagem.src = "assets/personagem/personagem.png";


/* =========================================================
   TIPOS DE ALIENS
   ========================================================= */

const tiposAliens = [
  {
    nome: "Alien Verde",

    frames: [
      "assets/green/1.png",
      "assets/green/2.png",
      "assets/green/3.png",
    ],

    width: 90,
    height: 95,

    speed: 50,

    tiroIntervalo: 1700,

    corFallback: "#53f56b00",
  },

  {
    nome: "Alien Azul",

    frames: [
      "assets/red/1.png",
      "assets/red/2.png",
      "assets/red/3.png",
    ],

    width: 100,
    height: 110,

    speed: 85,

    tiroIntervalo: 1400,

    corFallback: "#5ffcff00",
  },

  {
    nome: "Alien Roxo",

    frames: [
      "assets/gold/1.png",
      "assets/gold/2.png",
      "assets/gold/3.png",
    ],

    width: 86,
    height: 90,

    speed: 80,

    tiroIntervalo: 1150,

    corFallback: "#d45cff00",
  },
];


for (const tipo of tiposAliens) {

  tipo.imagens = tipo.frames.map((caminho) => {

    const imagem = new Image();

    imagem.src = caminho;

    return imagem;

  });

}


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

  x: 360,

  y: 450,

  width: 90,

  height: 130,

  speed: 343,

  vidas: 6,

};


/* =========================================================
   ARRAYS DO JOGO
   ========================================================= */

const tiros = [];

const capsulas = [];

const aliens = [];

const tirosInimigos = [];

const keys = {};


/* =========================================================
   VARIÁVEIS
   ========================================================= */

let ultimoTempo = 0;

let ultimoTiro = 0;

let proximoAlienEm = 0;

let pontuacao = 0;

let gameOver = false;


/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

const intervaloTiroPlayer = 130;

const maxAliens = 8;


/* =========================================================
   TECLADO
   ========================================================= */

document.addEventListener("keydown", (event) => {

  // Libera o áudio na primeira interação
  iniciarAudio();

  keys[event.key] = true;


  if (
    event.code === "Space" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight"
  ) {

    event.preventDefault();

  }


  if (gameOver && event.key.toLowerCase() === "enter") {

    reiniciarJogo();

  }

});


document.addEventListener("keyup", (event) => {

  keys[event.key] = false;

});


/* =========================================================
   TIRO DO PLAYER
   ========================================================= */

function criarTiro() {

  tiros.push({

    x: player.x + player.width / 2 - 2,

    y: player.y + 20,

    width: 4,

    height: 12,

    speed: 620,

  });


  capsulas.push({

    x: player.x + player.width * 0.72,

    y: player.y + 58,

    vx: 95,

    vy: -250,

    rotacao: 0,

    velocidadeRotacao: 13,

  });


  // Som da nave atirando
  tocarSom(somTiro);

}


/* =========================================================
   CRIAR ALIEN
   ========================================================= */

function criarAlien() {

  const tipo =
    tiposAliens[
      Math.floor(Math.random() * tiposAliens.length)
    ];


  aliens.push({

    tipo,

    x: Math.random() * (canvas.width - tipo.width),

    y: 15 + Math.random() * 100,

    width: tipo.width,

    height: tipo.height,

    vx: Math.random() > 0.5
      ? tipo.speed
      : -tipo.speed,

    frameAtual: 0,

    proximaAnimacao: 0,

    proximoTiro:
      performance.now() +
      600 +
      Math.random() * 1200,

  });

}


/* =========================================================
   TIRO DO ALIEN
   ========================================================= */

function criarTiroInimigo(alien) {

  const centroAlien =
    alien.x + alien.width / 2;

  const centroPlayer =
    player.x + player.width / 2;


  tirosInimigos.push({

    x: centroAlien - 4,

    y: alien.y + alien.height - 5,

    width: 8,

    height: 16,

    vx:
      (centroPlayer - centroAlien) *
      0.16,

    vy:
      240 +
      Math.random() * 70,

  });


  // Som do alien
  tocarSom(somAlien);

}


/* =========================================================
   COLISÃO
   ========================================================= */

function colisao(a, b) {

  return (

    a.x < b.x + b.width &&

    a.x + a.width > b.x &&

    a.y < b.y + b.height &&

    a.y + a.height > b.y

  );

}


/* =========================================================
   RECEBER DANO
   ========================================================= */

function receberDano() {

  player.vidas--;


  if (player.vidas <= 0) {

    gameOver = true;


    // Para música normal
    musicaFundo.pause();

    musicaFundo.currentTime = 0;


    // Para efeitos
    somAlien.pause();
    somAlien.currentTime = 0;


    // Toca música de Game Over
    musicaGameOver.currentTime = 0;

    musicaGameOver.play().catch(() => {});

  }

}


/* =========================================================
   REINICIAR JOGO
   ========================================================= */

function reiniciarJogo() {

  player.x = 360;

  player.vidas = 3;

  pontuacao = 0;


  tiros.length = 0;

  capsulas.length = 0;

  aliens.length = 0;

  tirosInimigos.length = 0;


  gameOver = false;

  proximoAlienEm = 0;


  // Para música de Game Over
  musicaGameOver.pause();

  musicaGameOver.currentTime = 0;


  // Volta música do jogo
  musicaFundo.currentTime = 0;

  musicaFundo.play().catch(() => {});

}


/* =========================================================
   ATUALIZAÇÃO
   ========================================================= */

function atualizar(delta, tempo) {

  if (gameOver) {

    return;

  }


  if (keys.ArrowLeft) {

    player.x -= player.speed * delta;

  }


  if (keys.ArrowRight) {

    player.x += player.speed * delta;

  }


  player.x = Math.max(

    0,

    Math.min(
      player.x,
      canvas.width - player.width
    )

  );


  /* =======================================================
     TIRO DO PLAYER
     ======================================================= */

  if (
    keys[" "] &&
    tempo - ultimoTiro >= intervaloTiroPlayer
  ) {

    criarTiro();

    ultimoTiro = tempo;

  }


  /* =======================================================
     CRIAR ALIEN
     ======================================================= */

  if (
    tempo >= proximoAlienEm &&
    aliens.length < maxAliens
  ) {

    criarAlien();

    proximoAlienEm =
      tempo +
      900 +
      Math.random() * 1100;

  }


  /* =======================================================
     ATUALIZAR TIROS DO PLAYER
     ======================================================= */

  for (
    let i = tiros.length - 1;
    i >= 0;
    i--
  ) {

    tiros[i].y -= tiros[i].speed * delta;


    if (
      tiros[i].y + tiros[i].height < 0
    ) {

      tiros.splice(i, 1);

    }

  }


  /* =======================================================
     ATUALIZAR CÁPSULAS
     ======================================================= */

  for (
    let i = capsulas.length - 1;
    i >= 0;
    i--
  ) {

    const capsula = capsulas[i];


    capsula.x += capsula.vx * delta;

    capsula.y += capsula.vy * delta;

    capsula.vy += 720 * delta;

    capsula.rotacao +=
      capsula.velocidadeRotacao * delta;


    if (
      capsula.y >
      canvas.height + 20
    ) {

      capsulas.splice(i, 1);

    }

  }


  /* =======================================================
     ATUALIZAR ALIENS
     ======================================================= */

  for (
    let i = aliens.length - 1;
    i >= 0;
    i--
  ) {

    const alien = aliens[i];


    alien.x += alien.vx * delta;


    if (
      alien.x <= 0 ||
      alien.x + alien.width >= canvas.width
    ) {

      alien.vx *= -1;

      alien.x = Math.max(
        0,
        Math.min(
          alien.x,
          canvas.width - alien.width
        )
      );

    }


    /* =====================================================
       ANIMAÇÃO DO ALIEN
       ===================================================== */

    if (
      tempo >= alien.proximaAnimacao
    ) {

      alien.frameAtual =
        (alien.frameAtual + 1) % 3;

      alien.proximaAnimacao =
        tempo + 180;

    }


    /* =====================================================
       TIRO DO ALIEN
       ===================================================== */

    if (
      tempo >= alien.proximoTiro
    ) {

      criarTiroInimigo(alien);

      alien.proximoTiro =
        tempo +
        alien.tipo.tiroIntervalo +
        Math.random() * 800;

    }

  }


  /* =======================================================
     TIROS DOS ALIENS
     ======================================================= */

  for (
    let i = tirosInimigos.length - 1;
    i >= 0;
    i--
  ) {

    const tiro = tirosInimigos[i];


    tiro.x += tiro.vx * delta;

    tiro.y += tiro.vy * delta;


    if (colisao(tiro, player)) {

      tirosInimigos.splice(i, 1);

      receberDano();

      continue;

    }


    if (
      tiro.y >
      canvas.height + 20
    ) {

      tirosInimigos.splice(i, 1);

    }

  }


  /* =======================================================
     COLISÃO TIRO x ALIEN
     ======================================================= */

  for (
    let i = tiros.length - 1;
    i >= 0;
    i--
  ) {

    for (
      let j = aliens.length - 1;
      j >= 0;
      j--
    ) {

      if (
        colisao(
          tiros[i],
          aliens[j]
        )
      ) {

        tiros.splice(i, 1);

        aliens.splice(j, 1);

        pontuacao += 10;

        break;

      }

    }

  }

}


/* =========================================================
   DESENHAR ALIEN
   ========================================================= */

function desenharAlien(alien) {

  const imagem =
    alien.tipo.imagens[
      alien.frameAtual
    ];


  if (
    imagem.complete &&
    imagem.naturalWidth > 0
  ) {

    ctx.drawImage(

      imagem,

      alien.x,

      alien.y,

      alien.width,

      alien.height

    );

    return;

  }


  ctx.fillStyle =
    alien.tipo.corFallback;

  ctx.shadowColor =
    alien.tipo.corFallback;

  ctx.shadowBlur = 12;


  ctx.fillRect(

    alien.x,

    alien.y,

    alien.width,

    alien.height

  );


  ctx.shadowBlur = 0;

}


/* =========================================================
   INTERFACE
   ========================================================= */

function desenharInterface() {

  ctx.save();


  ctx.font =
    "bold 20px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.shadowColor =
    "#5ffcff";

  ctx.shadowBlur = 8;


  ctx.fillText(
    `Pontos: ${pontuacao}`,
    20,
    35
  );


  ctx.fillText(
    `Vidas: ${player.vidas}`,
    20,
    62
  );


  ctx.restore();

}


/* =========================================================
   GAME OVER
   ========================================================= */

function desenharGameOver() {

  if (!gameOver) {

    return;

  }


  ctx.fillStyle =
    "rgba(0, 0, 0, 0.7)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.textAlign =
    "center";


  ctx.fillStyle =
    "#d42525";

  ctx.font =
    "bold 60px Arial";


  ctx.fillText(
    "-Arquivo - Novo-",
    canvas.width / 2,
    260
  );


  ctx.fillStyle =
    "#e68b8b";

  ctx.font =
    "24px Arial";


  ctx.fillText(
    `Pontuação: ${pontuacao}`,
    canvas.width / 2,
    310
  );


  ctx.font =
    "20px Arial";

  ctx.fillStyle =
    "#67e462";

  ctx.textAlign =
    "right";


  ctx.fillText(
    "Pressione ",
    canvas.width / 2.2 - 5,
    355
  );


  ctx.font =
    "bold 25px Arial";

  ctx.fillStyle =
    "#4beb0c";

  ctx.textAlign =
    "left";


  ctx.fillText(
    "Enter",
    canvas.width / 2.2 - 5,
    355
  );


  ctx.font =
    "20px Arial";

  ctx.fillStyle =
    "#67e462";


  ctx.fillText(
    " para reiniciar",
    canvas.width / 2.2 + 65,
    355
  );


  ctx.textAlign =
    "start";

}


/* =========================================================
   DESENHAR
   ========================================================= */

function desenhar() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /* =======================================================
     TIROS DO PLAYER
     ======================================================= */

  ctx.fillStyle =
    "#ffffff";


  for (const tiro of tiros) {

    ctx.shadowColor =
      "#ffffff";

    ctx.shadowBlur = 8;


    ctx.fillRect(

      tiro.x,

      tiro.y,

      tiro.width,

      tiro.height

    );

  }


  ctx.shadowBlur = 0;


  /* =======================================================
     CÁPSULAS
     ======================================================= */

  for (const capsula of capsulas) {

    ctx.save();


    ctx.translate(
      capsula.x,
      capsula.y
    );


    ctx.rotate(
      capsula.rotacao
    );


    ctx.fillStyle =
      "#c9a227";


    ctx.fillRect(
      -2,
      -5,
      4,
      10
    );


    ctx.restore();

  }


  /* =======================================================
     ALIENS
     ======================================================= */

  for (const alien of aliens) {

    desenharAlien(alien);

  }


  /* =======================================================
     TIROS DOS ALIENS
     ======================================================= */

  for (const tiro of tirosInimigos) {

    ctx.fillStyle =
      "#7fff4c";

    ctx.shadowColor =
      "#c8fab4";

    ctx.shadowBlur = 10;


    ctx.fillRect(

      tiro.x,

      tiro.y,

      tiro.width,

      tiro.height

    );

  }


  ctx.shadowBlur = 0;


  /* =======================================================
     PERSONAGEM
     ======================================================= */

  if (
    personagem.complete &&
    personagem.naturalWidth > 0
  ) {

    ctx.drawImage(

      personagem,

      player.x,

      player.y,

      player.width,

      player.height

    );

  }


  desenharInterface();

  desenharGameOver();

}


/* =========================================================
   LOOP PRINCIPAL
   ========================================================= */

function loop(tempo) {

  const delta =
    Math.min(
      (tempo - ultimoTempo) / 1000,
      0.05
    );


  ultimoTempo = tempo;


  atualizar(
    delta,
    tempo
  );


  desenhar();


  requestAnimationFrame(
    loop
  );

}


/* =========================================================
   INICIAR JOGO
   ========================================================= */

personagem.onload = () => {

  requestAnimationFrame(
    loop
  );

};

