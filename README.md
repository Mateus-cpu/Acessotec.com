# Carrosserie de Cornaux — proposta de redesign

Prévia de um novo site para a **Carrosserie de Cornaux Sàrl** (carrosseriecornaux.ch), feita para
apresentar ao patrão. A identidade visual do site atual foi mantida: laranja `#F37029` / `#FF6600`,
cinzas `#343434`, azul-cinza claro `#CBDCE9`, fundo escuro `#171A00`, fonte **Heebo**, o logo e as
fotos reais do atelier, os ícones e os logos dos parceiros. Todo o texto é o texto atual do site.

## O que há no site novo

Página única (`index.html`) com navegação por âncoras, estilo Apple: tipografia grande, muito
espaço, animações suaves e discretas.

| Secção | O que faz |
| --- | --- |
| Navegação | Barra fixa translúcida com *blur*, encolhe ao rolar, menu de hambúrguer no telemóvel, botão de telefone. |
| Hero | Foto a toda a largura com zoom lento (Ken Burns), *parallax* ao rolar, título e botões que entram em sequência. |
| Faixa de confiança | Cartão flutuante sobre o hero: agréé AXA & Vaudoise, veículo de substituição, assurances, toutes marques. |
| Serviços | 3 cartões (tôlerie, peinture, pare-brise) com foto que faz zoom ao passar o rato. |
| Detalhe dos serviços | Secção *sticky* ao estilo das páginas de produto da Apple: a foto fica presa à esquerda e troca enquanto o texto rola à direita. No telemóvel vira lista normal. |
| Acompanhamento | Os 7 ícones originais (Devis, Carrosserie, Actions spéciales, …) com entrada escalonada. |
| À propos | Foto do edifício + atelier, selo «2013», factos (toutes marques, bus 9 places, Repanet & ClearCarRep, base d’eau). |
| Service sans souci | Bloco escuro com veículo de substituição, démarches, réseaux, agréé. |
| Réalisations | Grelha tipo mosaico com 8 fotos e *lightbox* (teclado e gestos). |
| Partenaires | Agréés em destaque, carrossel infinito das outras seguradoras, parceiros comerciais; logos a cinza que ganham cor ao passar o rato. |
| Contact | Morada com itinerário, telefone, e-mail, horários com estado «Ouvert / Fermé» calculado em tempo real (fuso Europe/Zurich) e formulário. |
| Rodapé | Escuro, com logo, navegação, contactos e ligação à política de confidencialidade. |

Também existe `politique-de-confidentialite.html` com o texto legal completo do site atual.

Acessibilidade e desempenho: `prefers-reduced-motion` respeitado, foco visível, *skip link*,
imagens *lazy*, WebP, Schema.org `AutoBodyShop`, meta Open Graph.

## Como as imagens entram no projeto

O ambiente onde o site foi escrito não consegue aceder ao site atual, por isso as imagens são
obtidas por um workflow do GitHub Actions (`.github/workflows/fetch-assets.yml`):

1. `tools/fetch-assets/run.js` descarrega as fotos e logos do site Wix atual, otimiza-as e grava
   as versões finais em `assets/img/` com os nomes que o `index.html` espera (`hero.webp`,
   `tolerie.webp`, `logo.png`, `logo-axa.png`, …). A lista de correspondência está no início do
   ficheiro (`SELECTION`).
2. Guarda material de referência em `_source/`: capturas de ecrã do site atual (`shots/`),
   folhas de contacto numeradas com todas as fotos (`sheets/`) e `legend.json` (que foto original
   virou que ficheiro).
3. `tools/fetch-assets/qa.js` abre o site novo num Chromium, tira capturas de ecrã desktop e
   telemóvel para `_source/preview/` e escreve `report.json` (erros de consola, imagens
   partidas, *overflow* horizontal).
4. Faz *commit* de tudo no branch.

O workflow corre sozinho quando o ficheiro do workflow ou `tools/fetch-assets/` mudam, e também
manualmente em **Actions → Fetch original site assets → Run workflow**.

## Para ver a prévia online

`.github/workflows/deploy-pages.yml` publica o site no GitHub Pages depois de as imagens terem
sido geradas (ou manualmente em **Actions → Deploy preview to GitHub Pages → Run workflow**).
O endereço aparece no resumo do workflow (normalmente `https://mateus-cpu.github.io/Acessotec.com/`).
Se o GitHub recusar ativar o Pages automaticamente, ative em **Settings → Pages → Source:
GitHub Actions** e corra o workflow outra vez.

Para ver localmente: `python3 -m http.server 8080` na raiz e abrir `http://localhost:8080/`.

## A rever depois de ver as imagens

- As fotos foram escolhidas pelo nome e pela página onde aparecem no site atual, sem as ver.
  Com `_source/sheets/*.jpg` e `_source/legend.json` é fácil trocar: basta mudar o `out` no
  `SELECTION` de `run.js` (ou substituir o ficheiro em `assets/img/`) e correr o workflow.
- Instagram / LinkedIn: o workflow tenta extrair as ligações do site atual para
  `assets/js/social.json`; se não encontrar, os ícones ficam escondidos. Pode escrever o JSON à mão:
  `{"instagram": "https://instagram.com/...", "linkedin": "https://linkedin.com/company/..."}`.
- O formulário abre o programa de e-mail com a mensagem preenchida (`mailto:`). Para envio direto,
  ligar a um serviço (Formspree, Netlify Forms, …) ou a um pequeno *backend*.
- Para colocar em produção basta alojar os ficheiros estáticos (GitHub Pages, Vercel, Netlify ou o
  alojamento atual) e apontar o domínio carrosseriecornaux.ch.
