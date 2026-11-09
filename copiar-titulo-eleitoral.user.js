// ==UserScript==
// @name         Copiar Título Eleitoral (Ultra Otimizado v2.2) 10.08.2026
// @namespace    http://tampermonkey.net/
// @version      2.3.2
// @description  Copia o título eleitoral no INFODIP e abre a consulta direta ao cadastro no ELO.
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
    const CONSULTA_ELO = 'https://cad-elo.tse.jus.br/sae/jsp/ResConsultaEleitor.jsp';
    const CHAVE_DEPURACAO = 'te-debug';
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
            ${ACOES} { display: inline; margin-left: 8px; white-space: nowrap; }
            ${ACOES} > .infodip-titulo-acao {
                appearance: none; display: inline-block; padding: 0; border: 0;
                background: transparent; color: inherit; text-decoration: none;
                font: inherit; font-size: 14px; line-height: 1; cursor: pointer;
                position: relative; top: -1px; margin: 0 2px; opacity: .7;
                vertical-align: baseline; transition: opacity .2s, transform .2s;
            }
            ${ACOES} > .infodip-titulo-acao:hover,
            ${ACOES} > .infodip-titulo-acao:focus-visible {
                opacity: 1; transform: scale(1.1);
            }
            ${ACOES} > .infodip-titulo-acao:focus-visible {
                outline: 2px solid currentColor; outline-offset: 2px;
            }
            #${NOTIFICACAO} {
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                background: #2e7d32; color: white; padding: 8px 16px;
                border-radius: 5px; font: 12px Arial, sans-serif;
                box-shadow: 0 2px 10px rgba(0,0,0,.3);
            }
            #${NOTIFICACAO}[data-erro] { background: #b3261e; }
        `;
        document.head.append(estilo);
    }

    function notificar(mensagem, erro = false) {
        let aviso = document.getElementById(NOTIFICACAO);
        if (!aviso) {
            aviso = document.createElement('div');
            aviso.id = NOTIFICACAO;
            aviso.setAttribute('role', 'status');
            document.body.append(aviso);
        }

        aviso.textContent = mensagem;
        aviso.toggleAttribute('data-erro', erro);
        clearTimeout(temporizadorNotificacao);
        temporizadorNotificacao = setTimeout(() => aviso.remove(), 2000);
    }

    function criarAcoes(numero) {
        const acoes = document.createElement('span');
        acoes.dataset.infodipTituloAcoes = numero;

        const copiar = document.createElement('button');
        copiar.type = 'button';
        copiar.className = 'infodip-titulo-acao';
        copiar.title = `Copiar título eleitoral (${numero})`;
        copiar.setAttribute('aria-label', 'Copiar título eleitoral');
        copiar.textContent = '📋';
        copiar.addEventListener('click', async evento => {
            evento.stopPropagation();
            try {
                await navigator.clipboard.writeText(numero);
                estatisticas.copias++;
                notificar(`Título copiado: ${numero}`);
            } catch {
                notificar('Não foi possível copiar o título eleitoral.', true);
            }
        });

        const abrir = document.createElement('a');
        const url = new URL(CONSULTA_ELO);
        url.searchParams.set('num_inscricao', numero);
        abrir.href = url.href;
        abrir.target = '_blank';
        abrir.rel = 'noopener noreferrer';
        abrir.className = 'infodip-titulo-acao';
        abrir.title = 'Abrir no sistema ELO 4';
        abrir.setAttribute('aria-label', abrir.title);
        abrir.textContent = '➡️';
        abrir.addEventListener('click', evento => {
            evento.stopPropagation();
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
