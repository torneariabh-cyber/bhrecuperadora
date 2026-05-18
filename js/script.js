// ==================== CONFIGURAÇÃO JSONBIN.IO ====================
const JSONBIN_BIN_ID = "6a073187adc21f119aa52743";
const JSONBIN_API_KEY = "$2a$10$lhJUAJrzaktow5Z6xxRb4umOZnO4IucCBgy.nWbDoB8qrwudrYaky";

// Variáveis globais
let produtos = [];
let servicos = [];
let carrinho = [];

// Dados das galerias de fotos para cada serviço (será preenchido dinamicamente)
let galeriaServicos = {};

// ==================== FUNÇÃO PARA PEGAR PRODUTOS ALEATÓRIOS ====================
/**
 * Retorna um array com produtos aleatórios (máx 6)
 * @param {Array} produtosList - Lista de produtos
 * @param {number} quantidade - Quantidade desejada (padrão 6)
 * @returns {Array} - Produtos aleatórios
 */
function getRandomProducts(produtosList, quantidade = 6) {
    if (!produtosList || produtosList.length === 0) return [];
    
    // Se tiver menos produtos que a quantidade desejada, retorna todos
    if (produtosList.length <= quantidade) {
        return [...produtosList];
    }
    
    // Embaralhar o array usando Fisher-Yates shuffle
    const shuffled = [...produtosList];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Retornar os primeiros 'quantidade' produtos
    return shuffled.slice(0, quantidade);
}

// ==================== FUNÇÕES DE CARREGAMENTO ====================
async function carregarDadosJSONBin() {
    try {
        console.log('🔄 Carregando dados do JSONBin.io...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const dados = data.record;
        
        // Carregar produtos
        if (dados.produtos && dados.produtos.length > 0) {
            produtos = dados.produtos;
            console.log(`✅ Carregados ${produtos.length} produtos do JSONBin`);
        } else {
            produtos = [];
            console.log('📦 Nenhum produto encontrado');
        }
        
        // Carregar serviços
        if (dados.servicos && dados.servicos.length > 0) {
            servicos = dados.servicos;
            console.log(`✅ Carregados ${servicos.length} serviços do JSONBin`);
            
            // Construir galeriaServicos a partir dos dados
            for (const servico of servicos) {
                galeriaServicos[servico.nome] = {
                    descricao: servico.descricao_detalhada || servico.descricao,
                    fotos: (servico.galeria || []).map(url => ({ url: url, legenda: servico.nome }))
                };
            }
        } else {
            servicos = [];
            console.log('📦 Nenhum serviço encontrado');
        }
        
        renderizarTudo();
        return true;
    } catch(error) {
        console.error('❌ Erro ao carregar do JSONBin:', error);
        produtos = [];
        servicos = [];
        renderizarTudo();
        return false;
    }
}

function renderizarTudo() {
    if(document.getElementById('productsContainer')) renderAllProducts();
    if(document.getElementById('carouselWrapper')) renderCarousel();
    if(document.getElementById('servicosCarouselWrapper')) renderServicosCarousel();
    if(document.getElementById('totalProdutos')) document.getElementById('totalProdutos').textContent = produtos.length;
}

// ==================== FUNÇÕES DE RENDERIZAÇÃO ====================
function renderAllProducts(produtosList = null) {
    const lista = produtosList || produtos;
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if(lista.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Nenhum produto cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = '';
    for (const prod of lista) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img">
                <img src="${prod.imagem || 'imagens/parafuso.jpg'}" alt="${prod.nome}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23e8edf2%27/%3E%3Ctext x=%2750%27 y=%2750%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%230b2b3b%27 font-size=%2712%27%3E🔩%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="product-info">
                <h3>${prod.nome}</h3>
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

// 🆕 FUNÇÃO ATUALIZADA - Carrossel com produtos aleatórios
function renderCarousel() {
    const wrapper = document.getElementById('carouselWrapper');
    if (!wrapper) return;
    
    // Verificar se existem produtos
    if(produtos.length === 0) {
        wrapper.innerHTML = '<div class="swiper-slide"><div style="text-align:center; padding:50px;"><p>Nenhum produto cadastrado.</p></div></div>';
        return;
    }
    
    // 🔥 PEGAR PRODUTOS ALEATÓRIOS (entre 4 e 8 produtos, dependendo da quantidade disponível)
    const quantidadeDestaques = Math.min(6, produtos.length);
    const produtosAleatorios = getRandomProducts(produtos, quantidadeDestaques);
    
    console.log(`🎲 Carrossel carregado com ${produtosAleatorios.length} produtos aleatórios`);
    
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
    
    // Reinicializar o Swiper (destruir o anterior se existir)
    if (window.carouselSwiper) {
        window.carouselSwiper.destroy(true, true);
    }
    
    if (typeof Swiper !== 'undefined') {
        window.carouselSwiper = new Swiper('.mySwiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            autoplay: { delay: 4000, disableOnInteraction: false },
            loop: produtosAleatorios.length >= 3,
            breakpoints: { 
                640: { slidesPerView: 2 }, 
                1024: { slidesPerView: 3 } 
            }
        });
    }
}

// Função para forçar atualização aleatória do carrossel
function refreshRandomCarousel() {
    if (produtos.length > 0) {
        renderCarousel();
        showNotification('🔄 Destaques atualizados aleatoriamente!');
    }
}

function renderServicosCarousel() {
    const wrapper = document.getElementById('servicosCarouselWrapper');
    if (!wrapper) return;
    
    if(servicos.length === 0) {
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
            <div class="servicos-swiper-img" style="cursor: pointer;" data-servico-nome="${servico.nome.replace(/'/g, "\\'")}">
                <img src="${servico.imagem || 'imagens/servico-padrao.jpg'}" alt="${servico.nome}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 800 600%27%3E%3Crect width=%27800%27 height=%27600%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27400%27 y=%27300%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2740%27%3E🔧%3C/text%3E%3Ctext x=%27400%27 y=%27350%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2722%27%3E${servico.nome}%3C/text%3E%3C/svg%3E'">
                <div class="servico-badge"><i class="fas fa-star"></i> Destaque</div>
                <div class="servico-icon-center">${iconeClasse}</div>
                <div class="clique-indicador"><i class="fas fa-hand-pointer"></i> ${mensagemRandom}</div>
                <div class="servicos-swiper-info"><h3>${servico.nome}</h3><p>${servico.descricao}</p></div>
            </div>
        `;
        wrapper.appendChild(slide);
    }
    
    // Reinicializar o Swiper de serviços
    if (window.servicosSwiper) {
        window.servicosSwiper.destroy(true, true);
    }
    
    if (typeof Swiper !== 'undefined') {
        window.servicosSwiper = new Swiper('.servicosSwiper', {
            slidesPerView: 'auto',
            spaceBetween: 20,
            centeredSlides: false,
            loop: true,
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
    
    // Adicionar eventos de clique
    setTimeout(() => {
        document.querySelectorAll('.servicos-swiper-img').forEach(card => {
            card.addEventListener('click', function() {
                const titulo = this.querySelector('.servicos-swiper-info h3')?.innerText;
                if(titulo && galeriaServicos[titulo]) {
                    abrirGaleriaServico(titulo);
                } else if (titulo) {
                    const servico = servicos.find(s => s.nome === titulo);
                    if(servico && servico.galeria && servico.galeria.length > 0) {
                        abrirGaleriaServicoDinamica(servico);
                    } else {
                        alert('Este serviço não possui fotos cadastradas ainda.');
                    }
                }
            });
        });
    }, 100);
}

// Função para abrir galeria dinâmica (para serviços adicionados pelo admin)
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
        for (const fotoUrl of servico.galeria) {
            const fotoDiv = document.createElement('div');
            fotoDiv.className = 'foto-item';
            fotoDiv.innerHTML = `<img src="${fotoUrl}" alt="${servico.nome}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect width=%27400%27 height=%27300%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27200%27 y=%27150%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2720%27%3E🔧%3C/text%3E%3C/svg%3E'"><div class="foto-legenda">${servico.nome}</div>`;
            fotoDiv.onclick = (function(fotoUrl) {
                return function() { abrirFotoAmpliada(fotoUrl, servico.nome); };
            })(fotoUrl);
            galeriaFotos.appendChild(fotoDiv);
        }
    } else {
        galeriaFotos.innerHTML = '<p style="text-align:center; color:#999;">Nenhuma foto disponível para este serviço.</p>';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Função original para abrir galeria (mantida para compatibilidade)
function abrirGaleriaServico(titulo) {
    const servicoData = galeriaServicos[titulo];
    if (!servicoData) return;
    
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
        fotoDiv.innerHTML = `<img src="${foto.url}" alt="${foto.legenda}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect width=%27400%27 height=%27300%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27200%27 y=%27150%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2720%27%3E🔧%3C/text%3E%3C/svg%3E'"><div class="foto-legenda">${foto.legenda}</div>`;
        fotoDiv.onclick = (function(fotoUrl, legenda) {
            return function() { abrirFotoAmpliada(fotoUrl, legenda); };
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
            <img src="${url}" alt="${legenda}" style="max-width: 1080px; max-height: 1080px; width: auto; height: auto;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 300%27%3E%3Crect width=%27400%27 height=%27300%27 fill=%27%230b2b3b%27/%3E%3Ctext x=%27200%27 y=%27150%27 text-anchor=%27middle%27 fill=%27%23f9b81b%27 font-size=%2730%27%3E📷%3C/text%3E%3C/svg%3E'">
        </div>
    `;
    document.body.appendChild(modalAmpliada);
    modalAmpliada.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const fecharBtn = modalAmpliada.querySelector('.fechar-ampliada');
    fecharBtn.onclick = function() { modalAmpliada.remove(); document.body.style.overflow = ''; };
    modalAmpliada.onclick = function(e) { if (e.target === modalAmpliada) { modalAmpliada.remove(); document.body.style.overflow = ''; } };
}

function configurarModal() {
    const modal = document.getElementById('modalServicos');
    const fecharBtn = document.querySelector('.modal-fechar');
    if (fecharBtn) fecharBtn.onclick = function() { if (modal) modal.style.display = 'none'; document.body.style.overflow = ''; };
    if (modal) modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; document.body.style.overflow = ''; } };
}

// ==================== FUNÇÕES DO CARRINHO ====================
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
window.refreshRandomCarousel = refreshRandomCarousel;

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
        cartItemsDiv.innerHTML = '<p style="text-align:center; color:#999;">Seu carrinho esta vazio</p>';
        return;
    }
    
    cartItemsDiv.innerHTML = '';
    for (let idx = 0; idx < carrinho.length; idx++) {
        const item = carrinho[idx];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info"><h4>${item.nome}</h4><p>${formatPrice(item.preco)}</p></div>
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

// ==================== FUNÇÕES DO ORÇAMENTO ====================
function generatePrintHTML() {
    if (carrinho.length === 0) {
        alert('Adicione produtos ao carrinho primeiro!');
        return null;
    }
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');
    const totalValor = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    let itemsHTML = '';
    for (let idx = 0; idx < carrinho.length; idx++) {
        const item = carrinho[idx];
        itemsHTML += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nome}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPrice(item.preco)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPrice(item.preco * item.quantidade)}</td>
            </tr>
        `;
    }
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orcamento BH Recuperadora</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',Arial,sans-serif;background:white;padding:30px;color:#1e2a3e;}.print-container{max-width:900px;margin:0 auto;background:white;}.header-print{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #f9b81b;display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;}.logo-print{display:flex;align-items:center;gap:15px;}.logo-icon{width:60px;height:60px;}.logo-icon img{width:100%;height:100%;object-fit:contain;}.logo-text h1{color:#0b2b3b;font-size:28px;margin-bottom:5px;font-family:'Montserrat',sans-serif;}.logo-text p{color:#4a627a;font-size:12px;}.info-cliente{background:#f4f7fc;padding:15px;border-radius:10px;margin-bottom:25px;display:flex;justify-content:space-between;flex-wrap:wrap;}table{width:100%;border-collapse:collapse;margin-bottom:25px;}th{background:#0b2b3b;color:white;padding:10px;text-align:left;}td{padding:8px;border-bottom:1px solid #ddd;}.total-box{text-align:right;padding:15px;background:#fef3e0;border-radius:10px;margin-bottom:30px;}.total-box h2{color:#0b2b3b;}.footer-print{text-align:center;font-size:11px;padding-top:20px;border-top:1px solid #ddd;margin-top:20px;}.obs{background:#f9f9f9;padding:12px;border-radius:8px;font-size:12px;margin-bottom:20px;}.assinatura{margin-top:40px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:40px;}.assinatura-item{text-align:center;flex:1;}.linha-assinatura{border-top:1px solid #999;width:200px;margin:10px auto 5px auto;}@media print{body{padding:0;}.no-print{display:none;}}</style></head><body><div class="print-container"><div class="header-print"><div class="logo-print"><div class="logo-icon"><img src="imagens/icones-bh-05.png" alt="Logo BH"></div><div class="logo-text"><h1>BH RECUPERADORA</h1><p>Soluções rapidas em peças e serviços</p></div></div></div><div class="info-cliente"><div><strong>Data:</strong> ${dataAtual} - ${horaAtual}</div><div><strong>Orçamento:</strong> BH-${Date.now().toString().slice(-8)}</div><div><strong>Cliente:</strong> _________________________________</div></div><table><thead><tr><th>#</th><th>Produto</th><th>Qtd</th><th>Unitario</th><th>Subtotal</th></tr></thead><tbody>${itemsHTML}</tbody></table><div class="total-box"><h2>Total: ${formatPrice(totalValor)}</h2></div><div class="obs"><strong>Observacoes:</strong><br>- Validade: 24 horas<br>- Pagamento: Pix, Cartao, Dinheiro<br>- Entregamos em Sinop e regiao<br>- Os preços podem sofrer alterações sem aviso previo</div><div class="assinatura"><div class="assinatura-item"><div class="linha-assinatura"></div><p>Cliente</p></div><div class="assinatura-item"><div class="linha-assinatura"></div><p>BH Recuperadora</p></div></div><div class="footer-print"><p>BH Recuperadora - Especialistas em recuperação e venda de parafusos</p><p>E-mail: torneariabh@hotmail.com | WhatsApp: (66) 99901-9605 | Sinop - MT</p><p>* Este documento e um orçamento e não representa uma nota fiscal *</p></div></div><div class="no-print" style="text-align: center; margin-top: 20px;"><button onclick="window.print()" style="padding: 10px 30px; background: #0b2b3b; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">🖨️ Imprimir / Salvar PDF</button></div></body></html>`;
}

function printBudget() {
    if (carrinho.length === 0) { alert('Adicione produtos ao carrinho primeiro!'); return; }
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
    if (carrinho.length === 0) { alert('Adicione produtos ao carrinho primeiro!'); return; }
    let message = 'Ola! Gostaria de solicitar orçamento:%0A%0A';
    for (const item of carrinho) message += `*${item.nome}* - Qtd: ${item.quantidade} - Unit: ${formatPrice(item.preco)} - Sub: ${formatPrice(item.preco * item.quantidade)}%0A`;
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    message += `%0A*TOTAL: ${formatPrice(total)}*`;
    window.open(`https://wa.me/5566999019605?text=${message}`, '_blank');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (cartSidebar) cartSidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

function openWhatsApp() {
    const message = 'Ola! Gostaria de mais informacoes sobre os servicos e produtos da BH Recuperadora.';
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
    
    function close() { if (cartSidebar) cartSidebar.classList.remove('open'); if (overlay) overlay.classList.remove('active'); }
    
    if (cartIcon) cartIcon.addEventListener('click', () => { if (cartSidebar) cartSidebar.classList.add('open'); if (overlay) overlay.classList.add('active'); });
    if (closeCart) closeCart.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
    if (sendCartBtn) sendCartBtn.addEventListener('click', sendCartToWhatsApp);
    if (printCartBtn) printCartBtn.addEventListener('click', printBudget);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosJSONBin().then(() => {
        console.log('✅ Site inicializado com ' + servicos.length + ' serviços');
        console.log('🎲 Carrossel com produtos aleatórios ativado');
    });
    loadCart();
    initCartEvents();
    configurarModal();
    
    const orcamentoBtn = document.getElementById('orcamentoNavBtn');
    if (orcamentoBtn) orcamentoBtn.addEventListener('click', (e) => { e.preventDefault(); if (carrinho.length > 0) sendCartToWhatsApp(); else alert('Adicione produtos ao carrinho primeiro!'); });
    
    const whatsappBtn = document.getElementById('whatsappFloatBtn');
    if (whatsappBtn) whatsappBtn.addEventListener('click', (e) => { e.preventDefault(); openWhatsApp(); });
});