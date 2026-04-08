# Regras Locais - Crônicas do Códice

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
