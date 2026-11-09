// ==UserScript==
// @name         INFODIP - Botão copiar título e ir para o ELO 22
// @namespace    https://github.com/wiltonramon/botao-copiar-titulo-ir-para-o-ELO4
// @version      2.4.0
// @description  Adiciona atalhos aos detalhes da comunicação no INFODIP para copiar o título eleitoral e abrir diretamente o cadastro no ELO 22 em uma nova aba.
// @author       Ramon Machado
// @match        https://infodip.tse.jus.br/infodip/comunicacao/consulta/detalhes.jsp*
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/547853/Copiar%20T%C3%ADtulo%20Eleitoral%20%28Ultra%20Otimizado%20v22%29%2010082026.user.js
// @updateURL https://update.greasyfork.org/scripts/547853/Copiar%20T%C3%ADtulo%20Eleitoral%20%28Ultra%20Otimizado%20v22%29%2010082026.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const AREAS = '.requestBox, #detalhes-individualizacao';
    const ACOES = '[data-infodip-titulo-acoes]';
    const NOTIFICACAO = 'titulo-eleitoral-notificacao';
    const ENDERECO_ELO22 = 'https://cad-elo22.tse.jus.br/#/main/eleitor/atendimento/eleitor';
    const CHAVE_DEPURACAO = 'te-debug';
    const acoesInseridas = new WeakSet();
    const estatisticas = { buscas: 0, titulos: 0, copias: 0, aberturas: 0 };
    let quadroPendente = null;
    let temporizadorNotificacao;
    let depuracaoNaAba = null;

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
        abrir.href = `${ENDERECO_ELO22}/${numero}/detalhar`;
        abrir.target = '_blank';
        abrir.rel = 'noopener noreferrer';
        abrir.className = 'infodip-titulo-acao infodip-titulo-acao-elo';
        abrir.title = 'Abrir no sistema ELO 22';
        abrir.setAttribute('aria-label', abrir.title);
        abrir.append(criarIcone(
            'M13 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7 M13 11l7-7 M15 4h5v5'
        ));
        abrir.addEventListener('click', evento => {
            evento.stopPropagation();
            estatisticas.aberturas++;
        });

        acoes.append(copiar, abrir);
        acoesInseridas.add(acoes);
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
            // Uma tabela clonada mantém os atributos, mas perde os eventos.
            if (!acoesInseridas.has(acoes) || acoes.dataset.infodipTituloAcoes !== numero) {
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

        if (elemento.closest(AREAS)) return true;

        // A própria tabela pode ser substituída, ou voltar a ficar visível.
        if (type === 'attributes') return Boolean(elemento.querySelector(`${AREAS}, ${ACOES}`));
        return [...addedNodes, ...removedNodes].some(no =>
            no.nodeType === Node.ELEMENT_NODE && (no.matches(AREAS) || no.querySelector(AREAS))
        );
    }

    function inicializar() {
        instalarEstilos();
        atualizarAcoes();

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

    window.exibirEstatisticasTituloEleitoral = () => {
        const dados = { ...estatisticas };
        console.table(dados);
        return dados;
    };

    window.ativarDebugTituloEleitoral = () => definirDepuracao(true);
    window.desativarDebugTituloEleitoral = () => definirDepuracao(false);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar, { once: true });
    } else {
        inicializar();
    }
})();
