const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const telaInicial = document.getElementById('telaInicial');
const telaSobre = document.getElementById('telaSobre');
const telaFinal = document.getElementById('telaFinal');
const resultado = document.getElementById('resultado');

let circulosGerados = [];
let tempoInicio;
let tempoFinal;
let intervaloCronometro;
let quantidadeCirculos;
let background;

const som = new Audio();
const sons = {
    gerarAlvo: './sons/geraalvo.wav',
    clicarAlvo: './sons/clickalvo.wav',
    clicarBotao: './sons/botao.wav'
};

function tocar(nome) {
    som.src = sons[nome];
    som.play();
}


function tamanhoCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    desenharBackground();
}

async function carregarImagem(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function desenharImagem(x, y, raio, imagem) {
    ctx.drawImage(imagem, x - raio, y - raio, raio * 2, raio * 2);
}

function desenharBackground() {
    if (background) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

async function carregarBackground(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            background = img;
            desenharBackground();
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

window.addEventListener('load', async () => {
    await carregarBackground('./imagens/background2.png');
    tamanhoCanvas();
});

function popIn(circulo) {
    const inicio = Date.now();
    const duracao = 100;

    function animar() {
        const agora = Date.now();
        const tempoPassado = agora - inicio;

        const progresso = tempoPassado / duracao;

        if (progresso < 1) {
            const raioAnimado = circulo.raio * progresso;
            desenharImagem(circulo.x, circulo.y, raioAnimado, circulo.imagem);
            requestAnimationFrame(animar);
        } else {
            desenharImagem(circulo.x, circulo.y, circulo.raio, circulo.imagem);
            circulo.animando = false;
        }
    }

    requestAnimationFrame(animar);
}

function popOut(circulo, indice) {
    const inicio = Date.now();
    const duracao = 100;

    function animar() {
        const agora = Date.now();
        const tempoPassado = agora - inicio;

        const progresso = tempoPassado / duracao;

        if (progresso < 1) {
            const raioAnimado = circulo.raio * (1 - progresso);

            desenharBackground();

            for (let j = 0; j < circulosGerados.length; j++) {
                const outroCirculo = circulosGerados[j];
                const raioAtual = (j === indice) ? raioAnimado : outroCirculo.raio;

                if (raioAtual > 0) {
                    desenharImagem(outroCirculo.x, outroCirculo.y, raioAtual, outroCirculo.imagem);
                }
            }

            requestAnimationFrame(animar);
        } else {
            circulosGerados.splice(indice, 1);

            desenharBackground();
            for (const c of circulosGerados) {
                desenharImagem(c.x, c.y, c.raio, c.imagem);
            }

            if (circulosGerados.length === 0) {
                tempoFinal = Date.now();
                finalizarJogo();
            }
        }
    }

    requestAnimationFrame(animar);
}

function mostrarSobre() {
    telaInicial.style.display = 'none';
    telaFinal.style.display = 'none';
    telaSobre.style.display = 'flex';
    tocar('clicarBotao');
}

function voltar() {
    circulosGerados = [];
    telaFinal.style.display = 'none';
    telaSobre.style.display = 'none';
    telaInicial.style.display = 'flex';
    tocar('clicarBotao');
    ocultarCronometro();
}

function atualizarCronometro() {
    const tempoDecorrido = (Date.now() - tempoInicio) / 1000;
    document.getElementById('cronometro').textContent = `Tempo: ${tempoDecorrido.toFixed(2)}s`;
}

function ocultarCronometro() {
    const cronometro = document.getElementById('cronometro');
    if (cronometro.style.display !== 'none') {
        cronometro.style.display = 'none';
    }
}

function canvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const cliqueX = event.clientX - rect.left;
    const cliqueY = event.clientY - rect.top;

    for (let i = 0; i < circulosGerados.length; i++) {
        const circulo = circulosGerados[i];
        const distanciaX = cliqueX - circulo.x;
        const distanciaY = cliqueY - circulo.y;
        const distancia = Math.sqrt(distanciaX ** 2 + distanciaY ** 2);

        if (distancia <= circulo.raio + 1 && !circulo.clicado) {
            circulo.clicado = true;
            popOut(circulo, i);
            tocar('clicarAlvo');
            break;
        }
    }
}


function longeSuficiente(x, y, raio) {
    const distanciaMinima = Math.min(canvas.width, canvas.height) * 0.02;

    for (const circulo of circulosGerados) {
        const distanciaX = x - circulo.x;
        const distanciaY = y - circulo.y;
        const distancia = Math.sqrt(distanciaX ** 2 + distanciaY ** 2);

        if (distancia < (raio + circulo.raio + distanciaMinima)) {
            return false;
        }
    }
    return true;
}

async function gerarAlvo() {
    const diametro = Math.min(canvas.width, canvas.height) * 0.20;
    const raio = diametro / 2;
    const delayInicial = Math.random() * 0.75 + 0.75;

    try {
        await new Promise(resolve => setTimeout(resolve, delayInicial * 1000));  

        tempoInicio = Date.now();
        intervaloCronometro = setInterval(atualizarCronometro, 100);
        document.getElementById('cronometro').style.display = 'block';

        for (let i = 0; i < quantidadeCirculos; i++) {
            setTimeout(async () => {
                let xAleatorio, yAleatorio;
                let circuloValido = false;
                while (!circuloValido) {
                    xAleatorio = raio + Math.random() * (canvas.width - 2 * raio);
                    yAleatorio = raio + Math.random() * (canvas.height - 2 * raio);
                    circuloValido = longeSuficiente(xAleatorio, yAleatorio, raio);
                }

                const imagem = await carregarImagem('./imagens/alvo.png');

                const novoCirculo = {
                    x: xAleatorio,
                    y: yAleatorio,
                    raio: raio,
                    clicado: false,
                    animando: true,
                    imagem: imagem
                };

                circulosGerados.push(novoCirculo);
                popIn(novoCirculo);
                tocar('gerarAlvo');
            }, i * 250);
        }
    } catch (error) {
        console.error('Erro ao carregar a imagem:', error);
    }
}

async function iniciarJogo() {
    circulosGerados = [];
    quantidadeCirculos = Math.floor(Math.random() * 10) + 1;
    telaInicial.style.display = 'none';
    telaFinal.style.display = 'none';
    document.getElementById('cronometro').style.display = 'none';
    tamanhoCanvas();
    canvas.addEventListener('click', canvasClick);
    tocar('clicarBotao');
    gerarAlvo();
}

function finalizarJogo() {
    const tempoTotal = (tempoFinal - tempoInicio) / 1000;
    let mediaTempoPorCirculo = 0;
    if (quantidadeCirculos > 0) {
        mediaTempoPorCirculo = tempoTotal / quantidadeCirculos;
    }
    clearInterval(intervaloCronometro);
    ocultarCronometro();
    canvas.removeEventListener('click', canvasClick);
    telaFinal.style.display = 'flex';
    resultado.innerHTML = `Círculos clicados: ${quantidadeCirculos} <br> Tempo total: ${tempoTotal.toFixed(2)}s <br> Média por círculo: ${mediaTempoPorCirculo.toFixed(2)}s`;
}
