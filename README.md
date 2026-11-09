# INFODIP - Botão copiar título e ir para o ELO 4

Script de usuário para Tampermonkey que adiciona dois atalhos ao lado do título eleitoral na página de detalhes da comunicação do INFODIP. A versão publicada neste repositório é a **2.3.3**.

## Funcionalidades

| Atalho | O que faz |
| --- | --- |
| 📋 **Copiar título eleitoral** | Copia os 12 dígitos para a área de transferência e exibe uma confirmação ou aviso de falha. |
| ➡️ **Abrir no sistema ELO 4** | Abre o cadastro do eleitor em uma nova aba, usando a consulta direta com o parâmetro `num_inscricao`. |

- Localiza o título na célula logo após o campo **Sexo** na tabela do INFODIP.
- Preserva zeros à esquerda. Quando o título tem 11 dígitos, acrescenta um zero no início.
- Recria os atalhos quando o INFODIP substitui a tabela e atualiza o link se o número mudar.
- Exibe um par de atalhos por título, dando preferência à linha visível quando houver mais de uma ocorrência.
- Usa JavaScript nativo, sem bibliotecas externas ou permissões adicionais do gerenciador de scripts (`@grant none`).

## Instalação e uso

1. Tenha o Tampermonkey instalado no navegador.
2. Abra [copiar-titulo-eleitoral.user.js](copiar-titulo-eleitoral.user.js) e use a opção **Raw** para acessar o código. Se já tiver o script no Tampermonkey, substitua o código na instalação existente. Em uma instalação nova, crie um script, cole o conteúdo e salve.
3. Acesse o INFODIP com sua conta e abra a página de detalhes de uma comunicação que tenha título eleitoral.
4. Use os ícones ao lado do título. A consulta direta usa o acesso institucional ao ELO 4.

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
