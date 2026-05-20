// ==================== CONFIGURAÇÃO JSONBIN.IO ====================
const JSONBIN_BIN_ID = "6a073187adc21f119aa52743";
const JSONBIN_API_KEY = "$2a$10$lhJUAJrzaktow5Z6xxRb4umOZnO4IucCBgy.nWbDoB8qrwudrYaky";

let produtos = [];
let servicos = [];
let carrinho = [];
let galeriaServicos = {};
let categorias = [];
let categoriaAtiva = null;      // nome da categoria selecionada (null = todas)
let filtroAtual = 'todos';      // 'todos', 'menorPreco', 'maiorPreco'

// ==================== FUNÇÃO PARA PRODUTOS ALEATÓRIOS ====================
function getRandomProducts(produtosList, quantidade = 6) {
    if (!produtosList || produtosList.length === 0) return [];
    if (produtosList.length <= quantidade) return [...produtosList];
    const shuffled = [...produtosList];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, quantidade);
}

// ==================== CARREGAMENTO DOS DADOS ====================
async function carregarDadosJSONBin() {
    try {
        console.log('🔄 Carregando dados do JSONBin.io...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const dados = data.record;

        produtos = dados.produtos && Array.isArray(dados.produtos) ? dados.produtos : [];
        servicos = dados.servicos || [];
        categorias = dados.categorias && Array.isArray(dados.categorias) ? dados.categorias : [];

        console.log(`✅ Carregados: ${produtos.length} produtos, ${servicos.length} serviços, ${categorias.length} categorias`);

        // Construir galeriaServicos com suporte a legendas
        galeriaServicos = {};
        for (const servico of servicos) {
            let fotosArray = [];
            if (servico.galeria && Array.isArray(servico.galeria)) {
                fotosArray = servico.galeria.map(item => {
                    if (typeof item === 'string') return { url: item, legenda: servico.nome };
                    if (typeof item === 'object' && item.url) return { url: item.url, legenda: item.legenda || servico.nome };
                    return null;
                }).filter(f => f && f.url);
            }
            galeriaServicos[servico.nome] = {
                descricao: servico.descricao_detalhada || servico.descricao,
                fotos: fotosArray
            };
        }

        renderizarTudo();
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar do JSONBin:', error);
        servicos = [];
        produtos = [];
        categorias = [];
        renderizarTudo();
        return false;
    }
}

function renderizarTudo() {
    if (document.getElementById('productsContainer')) {
        aplicarFiltrosCompletos();
    }
    if (document.getElementById('carouselWrapper')) renderCarousel();
    if (document.getElementById('servicosCarouselWrapper')) renderServicosCarousel();
    if (document.getElementById('totalProdutos')) {
        document.getElementById('totalProdutos').textContent = produtos.length;
    }
    renderizarFiltrosCategoria();
}

// ==================== FILTROS DE CATEGORIA (com rolagem horizontal) ====================
function renderizarFiltrosCategoria() {
    const container = document.getElementById('categoriasFiltros');
    if (!container) return;

    if (!categorias || categorias.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    categorias.forEach(cat => {
        let nome = typeof cat === 'string' ? cat : cat.nome;
        nome = nome.trim(); // remove espaços extras
        const activeClass = (categoriaAtiva === nome) ? 'active' : '';
        html += `<button class="btn-filtro-cat ${activeClass}" data-cat="${nome.replace(/"/g, '&quot;')}">${nome}</button>`;
    });
    container.innerHTML = html;

    // Remove todos os listeners antigos para evitar duplicação
    document.querySelectorAll('.btn-filtro-cat').forEach(btn => {
        btn.removeEventListener('click', window.categoryClickHandler);
        const handler = function(e) {
            const cat = this.getAttribute('data-cat');
            categoriaAtiva = cat === '' ? null : cat;
            renderizarFiltrosCategoria();   // atualiza visual dos botões
            aplicarFiltrosCompletos();      // recarrega produtos
        };
        btn.addEventListener('click', handler);
        btn.categoryClickHandler = handler; // guarda referência
    });
}
// ==================== FILTROS DE PREÇO E ORDENAÇÃO ====================
function ordenarMenorPreco() {
    filtroAtual = 'menorPreco';
    aplicarFiltrosCompletos();
}

function ordenarMaiorPreco() {
    filtroAtual = 'maiorPreco';
    aplicarFiltrosCompletos();
}

function resetarFiltro() {
    filtroAtual = 'todos';
    categoriaAtiva = null;
    renderizarFiltrosCategoria();   // atualiza botões de categoria (nenhum ativo)
    aplicarFiltrosCompletos();
}

function aplicarFiltrosCompletos() {
    let produtosFiltrados = [...produtos];

    console.log(`Filtrando por categoria: ${categoriaAtiva || 'TODOS'}`);
    if (categoriaAtiva) {
        // Normaliza a comparação (trim e case-sensitive? melhor manter exato)
        produtosFiltrados = produtosFiltrados.filter(p => {
            const prodCat = p.categoria ? p.categoria.trim() : '';
            return prodCat === categoriaAtiva;
        });
        console.log(`Produtos na categoria "${categoriaAtiva}": ${produtosFiltrados.length}`);
    }

    if (filtroAtual === 'menorPreco') {
        produtosFiltrados.sort((a, b) => a.preco - b.preco);
    } else if (filtroAtual === 'maiorPreco') {
        produtosFiltrados.sort((a, b) => b.preco - a.preco);
    }

    renderAllProducts(produtosFiltrados);
    atualizarBotaoFiltro(filtroAtual);
}
function atualizarBotaoFiltro(filtro) {
    const btnMenorPreco = document.getElementById('filtrarMenorPreco');
    const btnMaiorPreco = document.getElementById('filtrarMaiorPreco');
    const btnTodos = document.getElementById('filtrarTodos');

    const resetStyle = (btn) => {
        if (btn) {
            btn.classList.remove('btn-filtro-ativo');
            btn.style.background = '#f4f7fc';
            btn.style.color = '#1e2a3e';
        }
    };
    resetStyle(btnMenorPreco);
    resetStyle(btnMaiorPreco);
    resetStyle(btnTodos);

    if (filtro === 'menorPreco' && btnMenorPreco) {
        btnMenorPreco.classList.add('btn-filtro-ativo');
        btnMenorPreco.style.background = '#0b2b3b';
        btnMenorPreco.style.color = 'white';
    } else if (filtro === 'maiorPreco' && btnMaiorPreco) {
        btnMaiorPreco.classList.add('btn-filtro-ativo');
        btnMaiorPreco.style.background = '#0b2b3b';
        btnMaiorPreco.style.color = 'white';
    } else if (filtro === 'todos' && btnTodos) {
        btnTodos.classList.add('btn-filtro-ativo');
        btnTodos.style.background = '#0b2b3b';
        btnTodos.style.color = 'white';
    }
}

// ==================== RENDERIZAÇÃO DE PRODUTOS ====================
function renderAllProducts(produtosList = null) {
    const lista = produtosList || produtos;
    const container = document.getElementById('productsContainer');
    if (!container) return;

    const totalSpan = document.getElementById('totalProdutos');
    if (totalSpan) totalSpan.textContent = lista.length;

    if (lista.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Nenhum produto encontrado.</p>';
        return;
    }

    container.innerHTML = '';
    for (const prod of lista) {
        const card = document.createElement('div');
        card.className = 'product-card';

        const catBadge = prod.categoria ? `<span class="produto-categoria-badge">${prod.categoria}</span>` : '';

        card.innerHTML = `
            <div class="product-img">
                <img src="${prod.imagem || 'imagens/parafuso.jpg'}" alt="${prod.nome}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23e8edf2%27/%3E%3Ctext x=%2750%27 y=%2750%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%230b2b3b%27 font-size=%2712%27%3E🔩%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="product-info">
                <h3>${prod.nome} ${catBadge}</h3>
                <p style="font-size:0.7rem; color:#666;">${prod.descricao || 'ROSCA GROSSA'}</p>
                <div class="product-price">${formatPrice(prod.preco)}</div>
                <button class="btn-add-cart" onclick="addToCart('${prod.nome.replace(/'/g, "\\'")}', ${prod.preco})">
                    <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
                </button>
            </div>
        `;
        container.appendChild(card);
    }
}

// ==================== CARROSSEL DE PRODUTOS ====================
function renderCarousel() {
    const wrapper = document.getElementById('carouselWrapper');
    if (!wrapper) return;

    if (produtos.length === 0) {
        wrapper.innerHTML = '<div class="swiper-slide"><div style="text-align:center; padding:50px;"><p>Nenhum produto cadastrado.</p></div></div>';
        return;
    }

    const quantidadeDestaques = Math.min(6, produtos.length);
    const produtosAleatorios = getRandomProducts(produtos, quantidadeDestaques);
    wrapper.innerHTML = '';

    for (const prod of produtosAleatorios) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="carousel-img">
                <img src="${prod.imagem || 'imagens/parafuso.jpg'}" alt="${prod.nome}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23e8edf2%27/%3E%3Ctext x=%2750%27 y=%2750%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%230b2b3b%27 font-size=%2712%27%3E🔩%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="carousel-info">
                <h3>${prod.nome}</h3>
                <div class="carousel-price">${formatPrice(prod.preco)}</div>
                <button class="btn-add-cart" onclick="addToCart('${prod.nome.replace(/'/g, "\\'")}', ${prod.preco})">
                    <i class="fas fa-cart-plus"></i> Adicionar
                </button>
            </div>
        `;
        wrapper.appendChild(slide);
    }

    if (window.carouselSwiperModern) window.carouselSwiperModern.destroy(true, true);
    if (window.carouselSwiper) window.carouselSwiper.destroy(true, true);
    if (typeof Swiper !== 'undefined') {
        const container = document.querySelector('.produtosSwiperModern') ? '.produtosSwiperModern' : '.mySwiper';
        window.carouselSwiperModern = new Swiper(container, {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            autoplay: { delay: 4000, disableOnInteraction: false },
            loop: produtosAleatorios.length >= 3,
            breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
        });
    }
}

// ==================== CARROSSEL DE SERVIÇOS ====================
function renderServicosCarousel() {
    const wrapper = document.getElementById('servicosCarouselWrapper');
    if (!wrapper) return;

    if (servicos.length === 0) {
        wrapper.innerHTML = '<div class="swiper-slide"><div style="text-align:center; padding:50px;"><p>Nenhum serviço cadastrado.</p></div></div>';
        return;
    }

    wrapper.innerHTML = '';
    const mensagensClique = ['👆 Clique e saiba mais', '✨ Veja mais fotos', '📸 Conheça nosso trabalho', '🔍 Clique e descubra', '⚡ Saiba mais sobre este serviço', '📋 Veja nossos trabalhos'];

    for (const servico of servicos) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        let iconeClasse = '<i class="fas fa-wrench"></i>';
        const nomeLower = servico.nome.toLowerCase();
        if (nomeLower.includes('torno')) iconeClasse = '<i class="fas fa-cogs"></i>';
        else if (nomeLower.includes('solda')) iconeClasse = '<i class="fas fa-fire"></i>';
        else if (nomeLower.includes('manutenção') || nomeLower.includes('manutencao')) iconeClasse = '<i class="fas fa-tools"></i>';
        else if (nomeLower.includes('corte')) iconeClasse = '<i class="fas fa-bolt"></i>';
        else if (nomeLower.includes('postos') || nomeLower.includes('molas')) iconeClasse = '<i class="fas fa-truck"></i>';

        const mensagemRandom = mensagensClique[Math.floor(Math.random() * mensagensClique.length)];

        slide.innerHTML = `
            <div class="servicos-swiper-img" style="cursor: pointer;">
                <img src="${servico.imagem || 'imagens/servico-padrao.jpg'}" alt="${servico.nome}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 800 600%27%3E%3Crect width=%27800%27 height=%27600%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27400%27 y=%27300%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2740%27%3E🔧%3C/text%3E%3Ctext x=%27400%27 y=%27350%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2722%27%3E${servico.nome}%3C/text%3E%3C/svg%3E'">
                <div class="servico-badge"><i class="fas fa-star"></i> Destaque</div>
                <div class="servico-icon-center">${iconeClasse}</div>
                <div class="clique-indicador"><i class="fas fa-hand-pointer"></i> ${mensagemRandom}</div>
                <div class="servicos-swiper-info">
                    <h3>${servico.nome}</h3>
                    <p>${servico.descricao}</p>
                </div>
            </div>
        `;
        wrapper.appendChild(slide);
    }

    if (window.servicosSwiperModern) window.servicosSwiperModern.destroy(true, true);
    if (window.servicosSwiper) window.servicosSwiper.destroy(true, true);
    if (typeof Swiper !== 'undefined') {
        const container = document.querySelector('.servicosSwiperModern') ? '.servicosSwiperModern' : '.servicosSwiper';
        window.servicosSwiperModern = new Swiper(container, {
            slidesPerView: 'auto',
            spaceBetween: 20,
            centeredSlides: false,
            loop: servicos.length >= 3,
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: {
                0: { slidesPerView: 1.2, spaceBetween: 15, centeredSlides: true },
                640: { slidesPerView: 2, spaceBetween: 20, centeredSlides: false },
                1024: { slidesPerView: 3, spaceBetween: 25, centeredSlides: false }
            }
        });
    }

    setTimeout(() => {
        document.querySelectorAll('.servicos-swiper-img').forEach(card => {
            card.addEventListener('click', function () {
                const titulo = this.querySelector('.servicos-swiper-info h3')?.innerText;
                if (titulo && galeriaServicos[titulo]) {
                    abrirGaleriaServico(titulo);
                } else if (titulo) {
                    const servico = servicos.find(s => s.nome === titulo);
                    if (servico && servico.galeria && servico.galeria.length > 0) {
                        abrirGaleriaServicoDinamica(servico);
                    } else {
                        alert('Este serviço não possui fotos cadastradas ainda.');
                    }
                }
            });
        });
    }, 100);
}

// ==================== GALERIA DE SERVIÇOS ====================
function abrirGaleriaServicoDinamica(servico) {
    const modal = document.getElementById('modalServicos');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalDescricao = document.getElementById('modalDescricao');
    const galeriaFotos = document.getElementById('galeriaFotos');

    let icone = '<i class="fas fa-wrench"></i>';
    const nomeLower = servico.nome.toLowerCase();
    if (nomeLower.includes('torno')) icone = '<i class="fas fa-cogs"></i>';
    else if (nomeLower.includes('solda')) icone = '<i class="fas fa-fire"></i>';
    else if (nomeLower.includes('manutenção') || nomeLower.includes('manutencao')) icone = '<i class="fas fa-tools"></i>';
    else if (nomeLower.includes('corte')) icone = '<i class="fas fa-bolt"></i>';
    else if (nomeLower.includes('postos') || nomeLower.includes('molas')) icone = '<i class="fas fa-truck"></i>';

    modalTitulo.innerHTML = icone + ' ' + servico.nome;
    modalDescricao.innerHTML = servico.descricao_detalhada || servico.descricao;
    galeriaFotos.innerHTML = '';

    if (servico.galeria && servico.galeria.length > 0) {
        for (const foto of servico.galeria) {
            const url = typeof foto === 'string' ? foto : foto.url;
            const legenda = (typeof foto === 'object' && foto.legenda) ? foto.legenda : servico.nome;
            const fotoDiv = document.createElement('div');
            fotoDiv.className = 'foto-item';
            fotoDiv.innerHTML = `
                <img src="${url}" alt="${legenda}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect width=%27400%27 height=%27300%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27200%27 y=%27150%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2720%27%3E🔧%3C/text%3E%3C/svg%3E'">
                <div class="foto-legenda">${legenda}</div>
            `;
            fotoDiv.onclick = (function (u, l) {
                return function () { abrirFotoAmpliada(u, l); };
            })(url, legenda);
            galeriaFotos.appendChild(fotoDiv);
        }
    } else {
        galeriaFotos.innerHTML = '<p style="text-align:center; color:#999;">Nenhuma foto disponível para este serviço.</p>';
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function abrirGaleriaServico(titulo) {
    const servicoData = galeriaServicos[titulo];
    if (!servicoData) {
        const servico = servicos.find(s => s.nome === titulo);
        if (servico) abrirGaleriaServicoDinamica(servico);
        return;
    }

    const modal = document.getElementById('modalServicos');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalDescricao = document.getElementById('modalDescricao');
    const galeriaFotos = document.getElementById('galeriaFotos');

    let icone = '<i class="fas fa-wrench"></i>';
    const tituloLower = titulo.toLowerCase();
    if (tituloLower.includes('torno')) icone = '<i class="fas fa-cogs"></i>';
    else if (tituloLower.includes('solda')) icone = '<i class="fas fa-fire"></i>';
    else if (tituloLower.includes('manutenção') || tituloLower.includes('manutencao')) icone = '<i class="fas fa-tools"></i>';
    else if (tituloLower.includes('corte')) icone = '<i class="fas fa-bolt"></i>';
    else if (tituloLower.includes('postos') || tituloLower.includes('molas')) icone = '<i class="fas fa-truck"></i>';

    modalTitulo.innerHTML = icone + ' ' + titulo;
    modalDescricao.innerHTML = servicoData.descricao;
    galeriaFotos.innerHTML = '';

    for (const foto of servicoData.fotos) {
        const fotoDiv = document.createElement('div');
        fotoDiv.className = 'foto-item';
        fotoDiv.innerHTML = `
            <img src="${foto.url}" alt="${foto.legenda}" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect width=%27400%27 height=%27300%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27200%27 y=%27150%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2720%27%3E🔧%3C/text%3E%3C/svg%3E'">
            <div class="foto-legenda">${foto.legenda}</div>
        `;
        fotoDiv.onclick = (function (u, l) {
            return function () { abrirFotoAmpliada(u, l); };
        })(foto.url, foto.legenda);
        galeriaFotos.appendChild(fotoDiv);
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function abrirFotoAmpliada(url, legenda) {
    const modalAmpliada = document.createElement('div');
    modalAmpliada.className = 'foto-ampliada-modal';
    modalAmpliada.innerHTML = `
        <span class="fechar-ampliada">&times;</span>
        <div class="foto-ampliada-content">
            <img src="${url}" alt="${legenda}" style="max-width:1080px; max-height:1080px;" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect width=%27400%27 height=%27300%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27200%27 y=%27150%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2730%27%3E📷%3C/text%3E%3C/svg%3E'">
        </div>
    `;
    document.body.appendChild(modalAmpliada);
    modalAmpliada.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const fecharBtn = modalAmpliada.querySelector('.fechar-ampliada');
    fecharBtn.onclick = function () { modalAmpliada.remove(); document.body.style.overflow = ''; };
    modalAmpliada.onclick = function (e) {
        if (e.target === modalAmpliada) {
            modalAmpliada.remove();
            document.body.style.overflow = '';
        }
    };
}

function configurarModal() {
    const modal = document.getElementById('modalServicos');
    const fecharBtn = document.querySelector('.modal-fechar');
    if (fecharBtn) fecharBtn.onclick = function () { if (modal) modal.style.display = 'none'; document.body.style.overflow = ''; };
    if (modal) modal.onclick = function (e) { if (e.target === modal) { modal.style.display = 'none'; document.body.style.overflow = ''; } };
}

// ==================== CARRINHO ====================
function formatPrice(price) {
    return 'R$ ' + price.toFixed(2).replace('.', ',');
}

function saveCart() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    updateCartUI();
}

function loadCart() {
    const saved = localStorage.getItem('carrinho');
    if (saved) carrinho = JSON.parse(saved);
    updateCartUI();
}

function addToCart(produtoNome, preco) {
    const existing = carrinho.find(item => item.nome === produtoNome);
    if (existing) existing.quantidade++;
    else carrinho.push({ nome: produtoNome, preco: preco, quantidade: 1 });
    saveCart();
    showNotification(produtoNome + " adicionado ao carrinho!");
}

function removeFromCart(index) {
    carrinho.splice(index, 1);
    saveCart();
}

function updateQuantity(index, delta) {
    if (carrinho[index]) {
        carrinho[index].quantidade += delta;
        if (carrinho[index].quantidade <= 0) carrinho.splice(index, 1);
        saveCart();
    }
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCountSpan = document.getElementById('cartCount');
    const cartTotalSpan = document.getElementById('cartTotal');
    if (!cartItemsDiv) return;

    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    const totalValor = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

    if (cartCountSpan) cartCountSpan.textContent = totalItens;
    if (cartTotalSpan) cartTotalSpan.textContent = formatPrice(totalValor);

    if (carrinho.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align:center; color:#999;">Seu carrinho está vazio</p>';
        return;
    }

    cartItemsDiv.innerHTML = '';
    for (let idx = 0; idx < carrinho.length; idx++) {
        const item = carrinho[idx];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.nome}</h4>
                <p>${formatPrice(item.preco)}</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQuantity(${idx}, -1)">-</button>
                <span>${item.quantidade}</span>
                <button onclick="updateQuantity(${idx}, 1)">+</button>
                <button onclick="removeFromCart(${idx})" style="background:#ff4444; color:white;">x</button>
            </div>
        `;
        cartItemsDiv.appendChild(itemDiv);
    }
}

function showNotification(msg) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.backgroundColor = '#25D366';
    notif.style.color = 'white';
    notif.style.padding = '12px 20px';
    notif.style.borderRadius = '8px';
    notif.style.zIndex = '1001';
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// ==================== ORÇAMENTO ====================
function generatePrintHTML() {
    if (carrinho.length === 0) {
        alert('Adicione produtos ao carrinho primeiro!');
        return null;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');
    const numeroAleatorio = Math.floor(Math.random() * 9999) + 1;
    const numeroOrcamento = String(numeroAleatorio).padStart(4, '0');
    const totalValor = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const totalLiquido = totalValor;

    let itemsProdutosHTML = '', itemsServicosHTML = '', totalProdutos = 0, totalServicos = 0;

    for (let idx = 0; idx < carrinho.length; idx++) {
        const item = carrinho[idx];
        const subtotal = item.preco * item.quantidade;
        const isServico = item.nome.toLowerCase().includes('serviço') ||
                          item.nome.toLowerCase().includes('servico') ||
                          item.nome.toLowerCase().includes('torno') ||
                          item.nome.toLowerCase().includes('solda') ||
                          item.nome.toLowerCase().includes('manutenção') ||
                          item.nome.toLowerCase().includes('manutencao') ||
                          item.nome.toLowerCase().includes('corte') ||
                          item.nome.toLowerCase().includes('recuperação');

        if (isServico) {
            totalServicos += subtotal;
            itemsServicosHTML += `
                <tr>
                    <td style="padding:8px; border-bottom:1px solid #ddd;">${String(idx + 1).padStart(4, '0')}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd;">${item.nome}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">${item.quantidade}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${formatPrice(item.preco)}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${formatPrice(subtotal)}</td>
                </tr>
            `;
        } else {
            totalProdutos += subtotal;
            itemsProdutosHTML += `
                <tr>
                    <td style="padding:8px; border-bottom:1px solid #ddd;">${String(idx + 1).padStart(4, '0')}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd;">${item.nome}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">${item.quantidade}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${formatPrice(item.preco)}</td>
                    <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${formatPrice(subtotal)}</td>
                </tr>
            `;
        }
    }

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Orçamento BH Recuperadora</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Inter',Arial,sans-serif;background:#f5f5f5;padding:30px;color:#1e2a3e;}
            .print-container{max-width:900px;margin:0 auto;background:white;box-shadow:0 5px 20px rgba(0,0,0,0.1);}
            .header-print{background:#0b2b3b;color:white;padding:20px 30px;}
            .header-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;margin-bottom:15px;}
            .logo-area{display:flex;align-items:center;gap:15px;}
            .logo-icon{width:60px;height:60px;background:white;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:8px;}
            .logo-icon img{width:100%;height:100%;object-fit:contain;}
            .logo-text h1{font-size:22px;font-weight:800;margin-bottom:5px;}
            .logo-text p{font-size:11px;opacity:0.8;}
            .orcamento-numero{text-align:right;border-left:2px solid #f9b81b;padding-left:20px;}
            .orcamento-numero h2{font-size:24px;color:#f9b81b;margin-bottom:5px;}
            .orcamento-numero p{font-size:12px;}
            .info-empresa{display:flex;justify-content:space-between;flex-wrap:wrap;gap:15px;margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.2);font-size:12px;}
            .info-empresa span{opacity:0.9;}
            .body-print{padding:30px;}
            .info-data{background:#f4f7fc;padding:15px;border-radius:10px;margin-bottom:25px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:15px;font-size:13px;}
            .info-data strong{color:#0b2b3b;}
            .section-title{font-size:16px;font-weight:700;color:#0b2b3b;margin:25px 0 10px 0;padding-bottom:5px;border-bottom:2px solid #f9b81b;display:inline-block;}
            table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;}
            th{background:#0b2b3b;color:white;padding:10px;text-align:left;font-weight:600;}
            th:nth-child(3),th:nth-child(4),th:nth-child(5){text-align:center;}
            td{padding:8px;border-bottom:1px solid #e0e0e0;}
            td:nth-child(3),td:nth-child(4),td:nth-child(5){text-align:center;}
            .totais-box{background:#f8f9fa;padding:15px;border-radius:10px;margin:20px 0;text-align:right;}
            .totais-line{display:flex;justify-content:flex-end;gap:40px;margin-bottom:8px;font-size:14px;}
            .totais-line.total{font-size:18px;font-weight:800;color:#0b2b3b;margin-top:10px;padding-top:10px;border-top:2px solid #f9b81b;}
            .observacoes{background:#fef3e0;padding:15px;border-radius:10px;margin:20px 0;font-size:12px;}
            .observacoes strong{color:#0b2b3b;}
            .assinatura{margin-top:40px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:40px;}
            .assinatura-item{text-align:center;flex:1;}
            .linha-assinatura{border-top:1px solid #999;width:200px;margin:10px auto 5px auto;}
            .footer-print{text-align:center;font-size:10px;padding:15px;border-top:1px solid #ddd;color:#666;}
            @media print{body{background:white;padding:0;}.no-print{display:none;}.print-container{box-shadow:none;}}
        </style>
    </head>
    <body>
        <div class="print-container">
            <div class="header-print">
                <div class="header-top">
                    <div class="logo-area">
                        <div class="logo-icon"><img src="imagens/icones-bh-05.png" alt="Logo BH" onerror="this.style.display='none'"></div>
                        <div class="logo-text"><h1>BH RECUPERADORA</h1><p>SOLUÇÕES RÁPIDAS EM PEÇAS E SERVIÇOS</p></div>
                    </div>
                    <div class="orcamento-numero"><h2>ORÇAMENTO</h2><p>Nº ${numeroOrcamento}</p></div>
                </div>
                <div class="info-empresa">
                    <span><i class="fas fa-map-marker-alt"></i> Rua Dirson José Martini, 827 - Sinop - MT</span>
                    <span><i class="fas fa-phone-alt"></i> (66) 99901-9605</span>
                    <span><i class="fas fa-envelope"></i> torneariabh@hotmail.com</span>
                    <span><i class="fas fa-calculator"></i> CNPJ: 27.095.847/0001-53</span>
                </div>
            </div>
            <div class="body-print">
                <div class="info-data">
                    <div><strong>Data Emissão:</strong> ${dataAtual} às ${horaAtual}</div>
                    <div><strong>Orçamento Nº:</strong> ${numeroOrcamento}</div>
                    <div><strong>Validade:</strong> 24 horas</div>
                </div>
                ${itemsServicosHTML ? `<div class="section-title">📋 SERVIÇOS</div><table><thead><tr><th>Código</th><th>Descrição do Item</th><th>Quant.</th><th>Vlr Unitário</th><th>Vlr Total</th></tr></thead><tbody>${itemsServicosHTML}</tbody></table>` : ''}
                ${itemsProdutosHTML ? `<div class="section-title">📦 PRODUTOS</div><table><thead><tr><th>Código</th><th>Descrição do Item</th><th>Quant.</th><th>Vlr Unitário</th><th>Vlr Total</th></tr></thead><tbody>${itemsProdutosHTML}</tbody></table>` : ''}
                <div class="totais-box">
                    ${totalProdutos > 0 ? `<div class="totais-line"><span>Total de Produtos:</span><strong>${formatPrice(totalProdutos)}</strong></div>` : ''}
                    ${totalServicos > 0 ? `<div class="totais-line"><span>Total de Serviços:</span><strong>${formatPrice(totalServicos)}</strong></div>` : ''}
                    <div class="totais-line total"><span>TOTAL:</span><strong style="color:#f9b81b;">${formatPrice(totalLiquido)}</strong></div>
                </div>
                <div class="observacoes">
                    <strong><i class="fas fa-info-circle"></i> Observações:</strong><br>
                    • Orçamento válido por 24 horas.<br>
                    • Formas de pagamento: Pix, Cartão de Débito/Crédito, Dinheiro.<br>
                    • Entregamos em Sinop e região (consulte frete).<br>
                    • Os preços podem sofrer alterações sem aviso prévio.<br>
                    • Serviço de Torno + Mão de obra especializada.
                </div>
                <div class="assinatura">
                    <div class="assinatura-item"><div class="linha-assinatura"></div><p>Cliente</p></div>
                    <div class="assinatura-item"><div class="linha-assinatura"></div><p>BH Recuperadora</p></div>
                </div>
            </div>
            <div class="footer-print">
                <p>BH Recuperadora - Especialistas em recuperação e venda de parafusos</p>
                <p>Rua Dirson José Martini, 827 - Setor Industrial - Sinop - MT | WhatsApp: (66) 99901-9605</p>
                <p>* Este documento é um orçamento e não representa uma nota fiscal *</p>
            </div>
        </div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
            <button onclick="window.print()" style="padding:12px 30px; background:#0b2b3b; color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px; margin:0 10px;">🖨️ Imprimir / Salvar PDF</button>
            <button onclick="window.close()" style="padding:12px 30px; background:#6c757d; color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px;">❌ Fechar</button>
        </div>
    </body>
    </html>`;
}

function printBudget() {
    if (carrinho.length === 0) {
        alert('Adicione produtos ao carrinho primeiro!');
        return;
    }
    const printHTML = generatePrintHTML();
    if (!printHTML) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (cartSidebar) cartSidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

function sendCartToWhatsApp() {
    if (carrinho.length === 0) {
        alert('Adicione produtos ao carrinho primeiro!');
        return;
    }
    let message = 'Olá! Gostaria de solicitar orçamento:%0A%0A';
    for (const item of carrinho) {
        message += `*${item.nome}* - Qtd: ${item.quantidade} - Unit: ${formatPrice(item.preco)} - Sub: ${formatPrice(item.preco * item.quantidade)}%0A`;
    }
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    message += `%0A*TOTAL: ${formatPrice(total)}*`;
    window.open(`https://wa.me/5566999019605?text=${message}`, '_blank');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (cartSidebar) cartSidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

function openWhatsApp() {
    const message = 'Olá! Gostaria de mais informações sobre os serviços e produtos da BH Recuperadora.';
    window.open(`https://wa.me/5566999019605?text=${encodeURIComponent(message)}`, '_blank');
}

// ==================== INICIALIZAÇÃO ====================
function initCartEvents() {
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    const closeCart = document.getElementById('closeCart');
    const sendCartBtn = document.getElementById('sendCartBtn');
    const printCartBtn = document.getElementById('printCartBtn');

    function close() {
        if (cartSidebar) cartSidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    if (cartIcon) cartIcon.addEventListener('click', () => {
        if (cartSidebar) cartSidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
    });
    if (closeCart) closeCart.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
    if (sendCartBtn) sendCartBtn.addEventListener('click', sendCartToWhatsApp);
    if (printCartBtn) printCartBtn.addEventListener('click', printBudget);
}

window.ordenarMenorPreco = ordenarMenorPreco;
window.ordenarMaiorPreco = ordenarMaiorPreco;
window.resetarFiltro = resetarFiltro;
window.refreshRandomCarousel = function () {
    if (produtos.length > 0) {
        renderCarousel();
        showNotification('🔄 Destaques atualizados aleatoriamente!');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosJSONBin().then(() => {
        console.log('✅ Site inicializado');
    });
    loadCart();
    initCartEvents();
    configurarModal();

    const orcamentoBtn = document.getElementById('orcamentoNavBtn');
    if (orcamentoBtn) orcamentoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (carrinho.length > 0) sendCartToWhatsApp();
        else alert('Adicione produtos ao carrinho primeiro!');
    });

    const heroOrcamentoBtn = document.getElementById('heroOrcamentoBtn');
    if (heroOrcamentoBtn) heroOrcamentoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (carrinho.length > 0) sendCartToWhatsApp();
        else alert('Adicione produtos ao carrinho primeiro!');
    });

    const ctaWhatsappBtn = document.getElementById('ctaWhatsappBtn');
    if (ctaWhatsappBtn) ctaWhatsappBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp();
    });

    const whatsappBtn = document.getElementById('whatsappFloatBtn');
    if (whatsappBtn) whatsappBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWhatsApp();
    });
});
