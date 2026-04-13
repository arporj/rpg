# Regras Locais - O Tomo das Aventuras

## TypeScript & Build (Vercel)
- **Tipagem Obrigatória em Callbacks**: Sempre utilize tipos explícitos para parâmetros em funções de callback como `.sort()`, `.map()`, `.filter()`, etc. 
- **Motivo**: O Vercel utiliza verificações rigorosas (`tsc`) que falham se houver `any` implícito, mesmo que o ambiente local permita.
- **Exemplo**:
  ```typescript
  // ❌ Incorreto
  array.sort((a, b) => a.index - b.index)
  
  // ✅ Correto
  array.sort((a: Chapter, b: Chapter) => a.order_index - b.order_index)
  ```

## Atualização do Supabase
- **Sempre utilize o MCP para aplicar migrações**: Quando criar novas rotinas ou tabelas que afetam o banco de dados Supabase, as atualizações devem ser feitas imediatamente pelo assistente (via servidor MCP `supabase-mcp-server` no endpoint correspondente, como `apply_migration` ou `execute_sql`). 
- **Motivo**: Automação contínua. Evita atrasos na continuação das features ou dependência de ações manuais de `db push` pelo usuário.
