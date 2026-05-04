# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-05-04
### Adicionado
- Sistema de Migrations para execução de scripts de alteração única.
- Script de migration \`001_add_display_sentences.ts\` que:
  - Adiciona campos de exibição \`SentenceX_Display\` no modelo \`JP::Katakana\`.
  - Atualiza o template do Anki para reproduzir os áudios rápidos antes das frases.
  - Atualiza as notas existentes para exibir as palavras com a classe de destaque \`.highlight\`.
- Atualização do \`CardCreationService\` para preencher o campo de exibição durante novas importações.

## [1.0.0] - 2026-05-04
### Adicionado
- Versão inicial do projeto.
- Importador em massa assíncrono para notas do Anki.
- Interface de aprovação de imagens.
