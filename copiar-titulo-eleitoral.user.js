// ==UserScript==
// @name         INFODIP - Botão copiar título e ir para o ELO 4
// @namespace    https://github.com/wiltonramon/botao-copiar-titulo-ir-para-o-ELO4
// @version      2.3.9
// @description  Adiciona atalhos aos detalhes da comunicação no INFODIP para copiar o título eleitoral e abrir o cadastro do eleitor no ELO 4 em uma nova aba.
// @author       Ramon Machado
// @match        https://infodip.tse.jus.br/infodip/comunicacao/consulta/detalhes.jsp*
// @match        https://cad-elo.tse.jus.br/sae/jsp/ELO.jsp*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        unsafeWindow
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/547853/Copiar%20T%C3%ADtulo%20Eleitoral%20%28Ultra%20Otimizado%20v22%29%2010082026.user.js
// @updateURL https://update.greasyfork.org/scripts/547853/Copiar%20T%C3%ADtulo%20Eleitoral%20%28Ultra%20Otimizado%20v22%29%2010082026.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const AREAS = '.requestBox, #detalhes-individualizacao';
    const ACOES = '[data-infodip-titulo-acoes]';
    const NOTIFICACAO = 'titulo-eleitoral-notificacao';
    const DIALOGO_ELO = 'infodip-preparar-elo4';
    const ENTRADA_ELO = 'https://cad-elo.tse.jus.br/sae/jsp/ELO.jsp';
    const ATENDIMENTO_ELO = '/sae/jsp/ConsultaAtendimento.jsp';
    const CONSULTA_ELEITOR = '/sae/jsp/ResConsultaEleitor.jsp';
    const CHAVE_ENTRADA = 'infodip-entrada-elo4';
    const FRAGMENTO_TITULO = 'infodip-titulo';
    const CHAVE_DEPURACAO = 'te-debug';
    const estatisticas = { buscas: 0, titulos: 0, copias: 0, aberturas: 0 };
    let quadroPendente = null;
    let temporizadorNotificacao;
    let depuracaoNaAba = null;
    let entradaConfigurada = null;

    function depuracaoAtiva() {
        if (depuracaoNaAba !== null) return depuracaoNaAba;

        try {
            return localStorage.getItem(CHAVE_DEPURACAO) === 'true';
        } catch {
            return false;
        }
    }

    function definirDepuracao(ativa) {
        try {
            if (ativa) {
                localStorage.setItem(CHAVE_DEPURACAO, 'true');
            } else {
                localStorage.removeItem(CHAVE_DEPURACAO);
            }
            depuracaoNaAba = null;
        } catch {
            depuracaoNaAba = ativa;
        }

        const estado = ativa ? 'ativado' : 'desativado';
        const escopo = depuracaoNaAba === null ? '' : ' nesta aba';
        console.info(`[Título Eleitoral] Modo de depuração ${estado}${escopo}.`);
    }

    function instalarEstilos() {
        const estilo = document.createElement('style');
        estilo.textContent = `
            /* Mantém o título e o grupo de atalhos juntos em células estreitas. */
            :has(> ${ACOES}) { white-space: nowrap; }
            ${ACOES} {
                display: inline-flex; align-items: center; gap: 4px;
                margin-left: 6px; vertical-align: middle;
            }
            ${ACOES} > .infodip-titulo-acao {
                --fundo: #edf4ff; --fundo-hover: #dbeaff; --borda: #c4d9f9; --traco: #204e91;
                appearance: none; display: inline-grid; place-items: center;
                box-sizing: border-box; width: 24px; height: 24px; padding: 0;
                border: 1px solid var(--borda); border-radius: 7px;
                background-color: var(--fundo); color: var(--traco);
                text-decoration: none; line-height: 1; cursor: pointer;
                box-shadow: 0 1px 2px rgba(15, 23, 42, .09);
                transition: background-color .15s, border-color .15s;
            }
            ${ACOES} > .infodip-titulo-acao-elo {
                --fundo: #eaf7f3; --fundo-hover: #d6efe6; --borda: #bcdfd2; --traco: #1b6255;
            }
            ${ACOES} > .infodip-titulo-acao > svg {
                display: block; width: 16px; height: 16px; pointer-events: none;
            }
            ${ACOES} > .infodip-titulo-acao:hover,
            ${ACOES} > .infodip-titulo-acao:focus-visible {
                background-color: var(--fundo-hover); border-color: currentColor;
            }
            ${ACOES} > .infodip-titulo-acao:focus-visible {
                outline: 2px solid currentColor; outline-offset: 2px;
            }
            #${NOTIFICACAO} {
                --destaque: #12624d; --fundo-icone: #e4f5ed;
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                display: flex; align-items: center; gap: 11px;
                box-sizing: border-box; width: 244px; max-width: calc(100vw - 40px);
                padding: 11px 13px; background: #fff; color: #203348;
                border: 1px solid #dce4e8; border-inline-start: 3px solid var(--destaque);
                border-radius: 11px; box-shadow: 0 5px 18px rgba(15, 23, 42, .15);
                font: 13px/1.35 Arial, sans-serif;
            }
            #${NOTIFICACAO}[data-erro] {
                --destaque: #a52231; --fundo-icone: #fcebee;
            }
            #${NOTIFICACAO} > svg {
                flex: none; width: 34px; height: 34px; padding: 7px;
                box-sizing: border-box; border-radius: 9px;
                background: var(--fundo-icone); color: var(--destaque);
            }
            #${NOTIFICACAO} strong { display: block; font-weight: 700; }
            #${NOTIFICACAO} span { display: block; margin-top: 3px; color: #4c5e70; }
            #${NOTIFICACAO}:not([data-erro]) span {
                font: 600 14px/1.3 ui-monospace, Consolas, monospace;
                color: var(--destaque); white-space: nowrap;
            }
            #${DIALOGO_ELO} {
                box-sizing: border-box; width: 374px; max-width: calc(100vw - 32px);
                padding: 20px; border: 1px solid #d6e3e8; border-radius: 12px;
                background: #fff; color: #203348; font: 14px/1.5 Arial, sans-serif;
                box-shadow: 0 12px 32px rgba(15, 23, 42, .2);
            }
            #${DIALOGO_ELO}::backdrop { background: rgba(15, 23, 42, .32); }
            #${DIALOGO_ELO} h2 { margin: 0 0 6px; font: 700 18px/1.3 Arial, sans-serif; }
            #${DIALOGO_ELO} p { margin: 0 0 12px; }
            #${DIALOGO_ELO} [role="status"] { color: #8a3a19; }
            #${DIALOGO_ELO}[data-pronto] [role="status"] { color: #1b6255; }
            #${DIALOGO_ELO} [role="status"]:empty { display: none; }
            #${DIALOGO_ELO} form { display: flex; gap: 8px; justify-content: flex-end; margin: 0; }
            #${DIALOGO_ELO} button {
                border: 1px solid #c8d8df; border-radius: 7px; padding: 7px 11px;
                color: #203348; background: #fff; font: 600 13px/1.4 Arial, sans-serif; cursor: pointer;
            }
            #${DIALOGO_ELO} [data-continuar] {
                border-color: #1b6255; background: #1b6255; color: #fff;
            }
        `;
        document.head.append(estilo);
    }

    function notificarCopia(numero = null) {
        let aviso = document.getElementById(NOTIFICACAO);
        if (!aviso) {
            aviso = document.createElement('div');
            aviso.id = NOTIFICACAO;
            aviso.setAttribute('role', 'status');
            document.body.append(aviso);
        }

        const erro = numero === null;
        const icone = criarIcone(erro ? 'M12 6v7m0 4h.01' : 'M5 12l4 4L19 6');
        const conteudo = document.createElement('div');
        const titulo = document.createElement('strong');
        const detalhe = document.createElement('span');
        titulo.textContent = erro ? 'Não foi possível copiar' : 'Título copiado';
        detalhe.textContent = erro
            ? 'Tente copiar novamente.'
            : `${numero.slice(0, 4)} ${numero.slice(4, 8)} ${numero.slice(8)}`;
        conteudo.append(titulo, detalhe);
        aviso.toggleAttribute('data-erro', erro);
        aviso.replaceChildren(icone, conteudo);
        clearTimeout(temporizadorNotificacao);
        temporizadorNotificacao = setTimeout(() => aviso.remove(), 2000);
    }

    function criarIcone(tracado) {
        const namespace = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(namespace, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.9');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        const linha = document.createElementNS(namespace, 'path');
        linha.setAttribute('d', tracado);
        svg.append(linha);
        return svg;
    }

    function entradaComPerfil(endereco) {
        if (!endereco) return null;

        try {
            const origem = new URL(endereco.trim());
            const destino = new URL(ENTRADA_ELO);
            if (origem.origin !== destino.origin || origem.pathname !== destino.pathname) return null;

            const contexto = origem.searchParams.get('contextoSAE');
            if (!JSON.parse(contexto)?.ambientePerfil) return null;
            destino.searchParams.set('contextoSAE', contexto);
            destino.searchParams.set('url', ATENDIMENTO_ELO);
            return destino.href;
        } catch {
            return null;
        }
    }

    function enderecoCadastro(numero) {
        const url = new URL(CONSULTA_ELEITOR, ENTRADA_ELO);
        url.searchParams.set('num_inscricao', numero);
        return url;
    }

    function enderecoAtalho(numero) {
        const url = new URL(entradaConfigurada ?? ENTRADA_ELO);
        if (entradaConfigurada) {
            // O título fica no fragmento até o atendimento estar pronto no ELO.
            url.hash = new URLSearchParams({ [FRAGMENTO_TITULO]: numero }).toString();
        } else {
            const consulta = enderecoCadastro(numero);
            url.searchParams.set('url', consulta.pathname + consulta.search);
        }
        return url.href;
    }

    function lerEntradaElo() {
        const entrada = entradaComPerfil(GM_getValue(CHAVE_ENTRADA, null));
        if (entrada) return entrada;

        // Aproveita a configuração feita no INFODIP na versão anterior.
        let anterior;
        try {
            anterior = entradaComPerfil(localStorage.getItem(CHAVE_ENTRADA));
        } catch {
            return null;
        }
        if (anterior) GM_setValue(CHAVE_ENTRADA, anterior);
        return anterior;
    }

    function atualizarEntradaElo(entrada = lerEntradaElo()) {
        if (entrada === entradaConfigurada) return;

        entradaConfigurada = entrada;
        for (const grupo of document.querySelectorAll(ACOES)) {
            const link = grupo.querySelector('.infodip-titulo-acao-elo');
            if (link) link.href = enderecoAtalho(grupo.dataset.infodipTituloAcoes);
        }
        const dialogo = document.getElementById(DIALOGO_ELO);
        if (dialogo) {
            dialogo.toggleAttribute('data-pronto', Boolean(entrada));
            dialogo.querySelector('[role="status"]').textContent = entrada
                ? 'Perfil reconhecido. Clique em Continuar.'
                : '';
        }
    }

    function orientarPrimeiroAcesso(numero) {
        const dialogo = document.createElement('dialog');
        dialogo.id = DIALOGO_ELO;
        dialogo.setAttribute('aria-labelledby', 'infodip-preparar-elo4-titulo');
        dialogo.setAttribute('aria-describedby', 'infodip-preparar-elo4-orientacao');
        dialogo.innerHTML = `
            <h2 id="infodip-preparar-elo4-titulo">Preparar acesso ao ELO 4</h2>
            <p id="infodip-preparar-elo4-orientacao">Acesse o ELO 4 em outra aba pelo caminho habitual.
                Quando a tela de atendimento abrir, volte aqui e clique em <strong>Continuar</strong>.</p>
            <p role="status"></p>
            <form method="dialog">
                <button>Cancelar</button>
                <button type="button" data-continuar>Continuar</button>
            </form>
        `;
        dialogo.querySelector('[data-continuar]').addEventListener('click', () => {
            atualizarEntradaElo();
            if (!entradaConfigurada) {
                dialogo.querySelector('[role="status"]').textContent =
                    'Abra o ELO 4 ou recarregue a aba dele se já estiver aberta.';
                return;
            }
            dialogo.close();
            window.open(enderecoAtalho(numero), '_blank', 'noopener,noreferrer');
            estatisticas.aberturas++;
        });
        dialogo.addEventListener('close', () => dialogo.remove(), { once: true });
        document.body.append(dialogo);
        dialogo.showModal();
    }

    function iniciarNoElo() {
        if (window.top !== window) return;

        const pagina = new URL(location.href);
        const entrada = entradaComPerfil(pagina.href);
        const pedido = new URLSearchParams(pagina.hash.slice(1)).get(FRAGMENTO_TITULO);
        const numero = /^\d{12}$/.test(pedido ?? '') ? pedido : null;
        if (!entrada && !numero) return;

        const quadro = document.querySelector('frame[name="principal"], iframe[name="principal"]');
        if (!quadro) return;

        function aoCarregarAtendimento() {
            const atendimento = quadro.contentDocument;
            if (atendimento?.readyState !== 'complete' ||
                new URL(atendimento.URL).pathname !== ATENDIMENTO_ELO ||
                !atendimento.querySelector('form')) return;

            quadro.removeEventListener('load', aoCarregarAtendimento);
            if (entrada && !pedido) GM_setValue(CHAVE_ENTRADA, entrada);
            if (!numero) return;

            pagina.hash = '';
            history.replaceState(history.state, '', pagina.href);
            quadro.src = enderecoCadastro(numero).href;
        }

        quadro.addEventListener('load', aoCarregarAtendimento);
        aoCarregarAtendimento();
    }

    function criarAcoes(numero) {
        const acoes = document.createElement('span');
        acoes.dataset.infodipTituloAcoes = numero;

        const copiar = document.createElement('button');
        copiar.type = 'button';
        copiar.className = 'infodip-titulo-acao';
        copiar.title = `Copiar título eleitoral (${numero})`;
        copiar.setAttribute('aria-label', 'Copiar título eleitoral');
        copiar.append(criarIcone(
            'M7 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1 ' +
            'M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z'
        ));
        copiar.addEventListener('click', async evento => {
            evento.stopPropagation();
            try {
                await navigator.clipboard.writeText(numero);
                estatisticas.copias++;
                notificarCopia(numero);
            } catch {
                notificarCopia();
            }
        });

        const abrir = document.createElement('a');
        abrir.href = enderecoAtalho(numero);
        abrir.target = '_blank';
        abrir.rel = 'noopener noreferrer';
        abrir.className = 'infodip-titulo-acao infodip-titulo-acao-elo';
        abrir.title = 'Abrir no sistema ELO 4';
        abrir.setAttribute('aria-label', abrir.title);
        abrir.append(criarIcone(
            'M13 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7 M13 11l7-7 M15 4h5v5'
        ));
        abrir.addEventListener('click', evento => {
            evento.stopPropagation();
            atualizarEntradaElo();
            if (!entradaConfigurada) {
                evento.preventDefault();
                orientarPrimeiroAcesso(numero);
                return;
            }
            estatisticas.aberturas++;
        });

        acoes.append(copiar, abrir);
        return acoes;
    }

    function atualizarAcoes() {
        const titulos = new Map();

        for (const sexo of document.querySelectorAll(`:is(${AREAS}) span.fontBlack`)) {
            if (!/^(Feminino|Masculino)$/i.test(sexo.textContent.trim())) continue;

            // Na tabela do INFODIP, o título fica na célula logo após Sexo.
            // Outros números da linha podem pertencer a um campo diferente.
            const celulaTitulo = sexo.closest('td')?.nextElementSibling;
            const campo = celulaTitulo?.querySelector('span.fontBlack');
            const texto = campo?.textContent.trim();
            if (!texto || !/^\d{11,12}$/.test(texto)) continue;

            const numero = texto.padStart(12, '0');
            const anterior = titulos.get(numero);
            // Se o mesmo título aparecer duas vezes, prefira a linha exibida.
            if (!anterior || (!anterior.getClientRects().length && campo.getClientRects().length)) {
                titulos.set(numero, campo);
            }
        }

        const acoesAtivas = new Set();
        for (const [numero, campo] of titulos) {
            let acoes = campo.nextElementSibling;
            if (acoes?.dataset.infodipTituloAcoes !== numero) {
                acoes = criarAcoes(numero);
                campo.after(acoes);
            }
            acoesAtivas.add(acoes);
        }

        for (const acoes of document.querySelectorAll(ACOES)) {
            if (!acoesAtivas.has(acoes)) acoes.remove();
        }

        estatisticas.buscas++;
        estatisticas.titulos = titulos.size;
        if (depuracaoAtiva()) {
            console.debug(`[Título Eleitoral] ${titulos.size} título(s) com atalho.`);
        }
    }

    function afetaAreas(mutacao) {
        const { target, type, addedNodes, removedNodes } = mutacao;
        const elemento = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
        if (!elemento || elemento.closest(ACOES)) return false;

        if (elemento.closest(AREAS)) {
            if (type !== 'childList' || removedNodes.length) return true;
            return [...addedNodes].some(no => no.nodeType !== Node.ELEMENT_NODE || !no.matches(ACOES));
        }

        // A própria tabela pode ser substituída, ou voltar a ficar visível.
        if (type === 'attributes') return Boolean(elemento.querySelector(`${AREAS}, ${ACOES}`));
        return [...addedNodes, ...removedNodes].some(no =>
            no.nodeType === Node.ELEMENT_NODE && (no.matches(AREAS) || no.querySelector(AREAS))
        );
    }

    function inicializar() {
        entradaConfigurada = lerEntradaElo();
        instalarEstilos();
        atualizarAcoes();
        GM_addValueChangeListener(CHAVE_ENTRADA, (_, anterior, atual) =>
            atualizarEntradaElo(entradaComPerfil(atual))
        );

        const observador = new MutationObserver(mutacoes => {
            if (quadroPendente !== null || !mutacoes.some(afetaAreas)) return;

            quadroPendente = requestAnimationFrame(() => {
                quadroPendente = null;
                atualizarAcoes();
                // A busca já leu o DOM atual e concluiu a limpeza dos atalhos.
                observador.takeRecords();
            });
        });

        observador.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class', 'hidden', 'id', 'style']
        });
    }

    const noElo = location.origin === new URL(ENTRADA_ELO).origin;
    if (!noElo) {
        const pagina = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
        function exporComando(nome, comando) {
            if (pagina !== window && typeof exportFunction === 'function') {
                exportFunction(comando, pagina, { defineAs: nome });
            } else {
                pagina[nome] = comando;
            }
        }
        exporComando('exibirEstatisticasTituloEleitoral', () => {
            const dados = { ...estatisticas };
            console.table(dados);
            return pagina !== window && typeof cloneInto === 'function' ? cloneInto(dados, pagina) : dados;
        });
        exporComando('ativarDebugTituloEleitoral', () => definirDepuracao(true));
        exporComando('desativarDebugTituloEleitoral', () => definirDepuracao(false));
    }

    const iniciar = noElo ? iniciarNoElo : inicializar;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
