# ÁUREO — Cafés Especiais ☕

E-commerce premium de café especial com **clube de assinatura**, construído como protótipo de alta fidelidade em **HTML + Tailwind CSS + JavaScript puro** (zero build, zero dependências de instalação).

A UI foi desenhada aplicando a metodologia da skill [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): paleta premium por indústria (specialty coffee), pareamento tipográfico editorial, hierarquia, micro-interações e checklist de qualidade.

---

## ▶️ Como abrir

É um site estático — **basta abrir `index.html` no navegador**. Nenhuma instalação necessária.

Para uma experiência completa (rotas relativas, fontes, etc.), suba um servidor local:

```bash
# Python (já vem no Windows via "py")
cd C:\projects\cafe
py -m http.server 8080
# abra http://localhost:8080

# ou Node
npx serve .
```

> O carrinho usa `localStorage`, então funciona melhor servido por HTTP do que via `file://`.

---

## 📄 Páginas

| Arquivo | Página | O que demonstra |
|---|---|---|
| `index.html` | **Home** | Hero premium, destaques, banner do clube, métodos, depoimentos, newsletter |
| `loja.html` | **Loja** | Grade de produtos com filtros por categoria |
| `produto.html` | **Produto** | Galeria, notas sensoriais, moagem, relacionados (lê `?p=slug`) |
| `carrinho.html` | **Carrinho** | Itens, quantidade, cupom, frete grátis progressivo, resumo |
| `checkout.html` | **Checkout** | Dados, entrega, pagamento (Pix/cartão/boleto) → envia pedido ao WhatsApp |
| `assinatura.html` | **Clube** | 3 planos, toggle mensal/trimestral, benefícios, como funciona, FAQ |
| `conta.html` | **Área do assinante** | Assinatura, pedidos, endereços, benefícios, dados |
| `sobre.html` | **Institucional** | História, princípios, números, políticas de troca/entrega |

### Assets

```
assets/css/styles.css   → design system (tokens, componentes, animações)
assets/js/main.js        → carrinho (localStorage), header, reveal, WhatsApp, etc.
```

---

## 🎨 Design system

- **Paleta:** espresso `#1c1714`, cocoa `#3b2a20`, creme `#f6f1e7`, areia `#ede4d3`, dourado `#c19a5b`, musgo `#5b6b52`.
- **Tipografia:** `Fraunces` (display serif editorial) + `Inter` (corpo). Via Google Fonts.
- **Imagens:** as "fotos" de produto são geradas por CSS (`.bean-art`) — **sem dependência de arquivos externos**. Para produção, troque por fotos reais.
- **Responsivo:** mobile, tablet e desktop (grid Tailwind + menu mobile).
- **Acessibilidade/Performance:** `prefers-reduced-motion`, lazy reveal via IntersectionObserver, fontes com `preconnect`.

---

## ✅ Escopo coberto (proposta original)

- [x] Loja virtual completa (home, institucional, loja, produto, carrinho, checkout)
- [x] Estrutura responsiva (mobile, tablet, desktop)
- [x] Layout premium personalizado
- [x] Cadastro inicial de produtos (catálogo em `main.js → CATALOG`)
- [x] Estrutura de meios de pagamento (Pix, cartão, boleto — visual)
- [x] Configuração de frete (frete grátis progressivo acima de R$ 99)
- [x] Painel de pedidos (área do cliente)
- [x] Clube de assinatura / recorrência + múltiplos planos
- [x] Área do assinante/cliente
- [x] Benefícios exclusivos para assinantes
- [x] Cupons e vantagens promocionais (`BEMVINDO10`, `ASSINANTE20`)
- [x] Integração WhatsApp (acompanhamento e envio de pedido)
- [x] SEO básico (title, meta description, Open Graph, theme-color)

> ⚠️ Este é o **front-end / protótipo de UI**. Pagamento, cálculo real de frete e recorrência exigem backend (ver abaixo).

---

## 🔁 Caminho para WordPress + WooCommerce

A proposta original previa WordPress + WooCommerce. Este protótipo serve como **referência visual e de UX** para o tema/loja real. Mapa de conversão:

| Aqui (protótipo) | No WooCommerce |
|---|---|
| `CATALOG` em `main.js` | Produtos (CPT `product`) — cadastro no admin |
| `loja.html` | Template `archive-product.php` / Shop |
| `produto.html` | `single-product.php` |
| `carrinho.html` / `checkout.html` | Páginas Cart e Checkout do WooCommerce |
| Carrinho em `localStorage` | Carrinho/sessão nativos do WooCommerce |
| `assinatura.html` + planos | Plugin **WooCommerce Subscriptions** (ou YITH/SUMO) |
| `conta.html` | "Minha conta" (`my-account`) + endpoints de assinatura |
| Cupons `BEMVINDO10` etc. | WooCommerce → Marketing → Cupons |
| Frete grátis +R$99 | WooCommerce → Envio → método "Frete grátis" com mínimo |
| Pix/cartão/boleto | Gateways (Mercado Pago, PagSeguro, Stripe, etc.) |
| Botões/links WhatsApp | Plugin (ex.: "Click to Chat") ou os mesmos links `wa.me` |
| `styles.css` + Tailwind | Tema-filho (Storefront/Blocksy) ou block theme com o mesmo design system |

**Sugestão de stack WP para produção:** tema block (FSE) ou Storefront + tema-filho, WooCommerce, WooCommerce Subscriptions, gateway nacional, plugin de WhatsApp e cache (LiteSpeed/WP Rocket) para a "otimização de performance/SEO".

---

## 🔧 Como personalizar

- **Número do WhatsApp:** `assets/js/main.js` → `const WHATSAPP = '5511999999999';`
- **Produtos/preços:** `assets/js/main.js` → objeto `CATALOG`
- **Cores/fontes:** `assets/css/styles.css` (`:root`) e o `tailwind.config` no topo de cada HTML
- **Regra de frete grátis:** `main.js → updateSummary()` (limiar `99` e valor `19.9`)

---

*Protótipo de demonstração de UI. Marca, textos e números são fictícios.*
