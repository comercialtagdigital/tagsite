# TAG Digital — site

Site institucional da TAG Digital (redetag.com.br). HTML, CSS e JS puros: sem build, sem dependências, sem cookies.

## Rodar localmente

```bash
python -m http.server 8000
# abra http://localhost:8000
```

## Estrutura

- `index.html` — conteúdo
- `assets/css/site.css` — tokens (cores do banner oficial), layout e movimento
- `assets/js/site.js` — campo de sinal do hero (canvas), vinheta, abas, rotação das plataformas, marquee e formulário
- `assets/img`, `assets/video`, `assets/fonts` — marca, clientes, vinheta e fontes (Montserrat + Open Sans em woff2)

## Formulário

Não há backend: o formulário monta a mensagem e abre o WhatsApp da TAG (`WHATSAPP` em `site.js`). Nenhum dado é armazenado pelo site.

## Publicar

Qualquer hospedagem estática serve (GitHub Pages, Vercel, Netlify). Todos os caminhos são relativos.
