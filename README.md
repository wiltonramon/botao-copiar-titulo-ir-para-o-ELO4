# INFODIP - Botão copiar título e ir para o ELO 22

Script de usuário para Tampermonkey que adiciona dois atalhos ao lado do título eleitoral na página de detalhes da comunicação do INFODIP. A versão publicada neste repositório é a **2.4.0**.

## Funcionalidades

| Atalho | O que faz |
| --- | --- |
| **Copiar título eleitoral** | Copia os 12 dígitos sem espaços. O aviso de sucesso exibe o título em três blocos de quatro dígitos (`0000 0000 0000`). |
| **Abrir no sistema ELO 22** | Abre diretamente os detalhes do eleitor em uma nova aba, usando o número do título. |

- Exibe ícones vetoriais. O botão azul copia o título e o botão verde abre o ELO 22.
- Localiza o título na célula logo após o campo **Sexo** na tabela do INFODIP.
- Preserva zeros à esquerda. Quando o título tem 11 dígitos, acrescenta um zero no início.
- Recria os atalhos quando o INFODIP substitui ou clona a tabela e atualiza o link se o número mudar.
- Exibe um par de atalhos por título, dando preferência à linha visível quando houver mais de uma ocorrência.
- Usa JavaScript nativo e executa apenas na página de detalhes da comunicação do INFODIP (`@grant none`).

## Instalação e uso

O script está espelhado no [Greasy Fork](https://greasyfork.org/pt-BR/scripts/547853). O Tampermonkey usa esse canal para verificar e baixar atualizações automáticas.

1. Com o Tampermonkey instalado, use o botão de instalação na página do Greasy Fork.
2. Acesse o INFODIP com sua conta e abra a página de detalhes de uma comunicação que tenha título eleitoral.
3. Clique em **Abrir no sistema ELO 22** para abrir os detalhes do eleitor em uma nova aba.

Para instalar manualmente pelo GitHub, abra [copiar-titulo-eleitoral.user.js](copiar-titulo-eleitoral.user.js), use **Raw** para acessar o código e cole-o no editor do Tampermonkey. Se já tiver o script instalado, substitua o código na instalação existente.

## Diagnóstico

Os comandos abaixo podem ser executados no console do navegador com a página do INFODIP aberta.

| Comando | Função |
| --- | --- |
| `exibirEstatisticasTituloEleitoral()` | Mostra os contadores de buscas, títulos, cópias e cliques de abertura. |
| `ativarDebugTituloEleitoral()` | Ativa os registros de depuração. |
| `desativarDebugTituloEleitoral()` | Desativa os registros de depuração. |

Quando o armazenamento local do navegador está bloqueado, a preferência de depuração vale apenas na aba atual.

## Licença

[MIT](LICENSE). Autoria de Ramon Machado.
