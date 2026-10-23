# Meu Controle — Finanças pessoais

Aplicação web mobile-first para registrar receitas e despesas, acompanhar o saldo mensal e comparar gastos entre meses. Feita com HTML, CSS e JavaScript puro.

## Recursos
- Cadastro, edição e exclusão de receitas e despesas.
- Categorias iniciais e categorias personalizadas.
- Filtro por tipo e busca de lançamentos.
- Resumo de receitas, despesas e saldo mensal.
- Gráfico de rosca por categoria e gráfico de barras dos últimos seis meses.
- Comparação das despesas do mês selecionado com o anterior.
- Persistência local via `localStorage`.
- Exportação e importação de backup em JSON.
- Manifesto PWA e service worker para instalação/cache básico.
- Interface responsiva, navegação por teclado e rótulos acessíveis.

## Como executar localmente
O service worker/PWA exige `localhost` ou HTTPS. Não abra o HTML diretamente via `file://`.

1. Extraia a pasta.
2. Abra um terminal dentro dela.
3. Execute um servidor local, por exemplo com Python:

   ```bash
   python -m http.server 8000
   ```

4. No computador, abra `http://localhost:8000`.
5. Para testar no celular na mesma rede Wi-Fi, use o IP local do computador, por exemplo `http://192.168.0.10:8000`. O service worker geralmente exige HTTPS no celular; para teste real de PWA, publique em hospedagem HTTPS.

## Publicação
Hospede os arquivos estáticos em uma hospedagem HTTPS (por exemplo, GitHub Pages, Netlify ou Vercel). Não é necessário backend para a versão local.

## Como instalar
- Android/Chrome: abra o site publicado e use a opção de instalar/adicionar à tela inicial quando disponível.
- iPhone: abra no Safari, toque em Compartilhar e escolha **Adicionar à Tela de Início**.

## Limitações e cuidados
- `localStorage` pertence ao navegador e aparelho atuais. Os registros não sincronizam automaticamente entre dispositivos nem são recuperáveis se os dados do navegador forem apagados.
- Exporte um backup JSON regularmente e guarde-o em local seguro.
- Os gráficos usam Chart.js via CDN; para uso offline desde a primeira visita, baixe uma cópia local da biblioteca e inclua-a no projeto. O restante da interface tem cache básico pelo service worker.
- Não registre senhas, dados bancários ou informações sensíveis. Esta versão não tem login nem criptografia dos dados locais.
- O saldo mensal é calculado como receitas registradas menos despesas registradas. Não é uma integração bancária e depende dos lançamentos inseridos pela pessoa.

## Estrutura
```text
controle-financeiro/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── README.md
├── css/style.css
├── js/app.js
├── js/storage.js
└── assets/icon.svg
```
