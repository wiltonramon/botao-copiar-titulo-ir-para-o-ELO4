# INFODIP - Botão copiar título e ir para o ELO 4

Script de usuário para Tampermonkey que adiciona dois atalhos ao lado do título eleitoral na página de detalhes da comunicação do INFODIP. A versão publicada neste repositório é a **2.3.9**.

## Funcionalidades

| Atalho | O que faz |
| --- | --- |
| **Copiar título eleitoral** | Copia os 12 dígitos sem espaços. O aviso de sucesso exibe o título em três blocos de quatro dígitos (`0000 0000 0000`). |
| **Abrir no sistema ELO 4** | Abre a entrada do seu perfil em uma nova aba, aguarda o atendimento e carrega o cadastro no quadro principal do ELO 4. |

- Exibe ícones vetoriais. O botão azul copia o título e o botão verde abre o ELO 4.
- Localiza o título na célula logo após o campo **Sexo** na tabela do INFODIP.
- Preserva zeros à esquerda. Quando o título tem 11 dígitos, acrescenta um zero no início.
- Recria os atalhos quando o INFODIP substitui a tabela e atualiza o link se o número mudar.
- Exibe um par de atalhos por título, dando preferência à linha visível quando houver mais de uma ocorrência.
- Usa JavaScript nativo e o armazenamento local do Tampermonkey para reconhecer o perfil entre as abas do INFODIP e do ELO 4.

## Instalação e uso

O script está espelhado no [Greasy Fork](https://greasyfork.org/pt-BR/scripts/547853). O Tampermonkey usa esse canal para verificar e baixar atualizações automáticas.

1. Com o Tampermonkey instalado, use o botão de instalação na página do Greasy Fork.
2. Acesse o INFODIP com sua conta e abra a página de detalhes de uma comunicação que tenha título eleitoral.
3. Clique em **Abrir no sistema ELO 4**. Se o perfil já estiver salvo, o cadastro abre com um clique.
4. Se aparecer **Preparar acesso ao ELO 4**, abra o ELO 4 em outra aba pelo caminho habitual. Quando a tela de atendimento abrir, volte ao INFODIP e clique em **Continuar**.

O script aproveita o perfil salvo na versão anterior. Quando você abre a tela de atendimento pelo acesso habitual, ele reconhece o perfil usado nessa entrada. Se a aba do ELO 4 já estava aberta antes de instalar a atualização, recarregue-a uma vez.

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
