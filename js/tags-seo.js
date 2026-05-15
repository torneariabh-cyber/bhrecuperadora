// ==================== SISTEMA DE TAGS SEO ====================

const SEO_CONFIG = {
    siteName: "BH Recuperadora",
    siteDescription: "Especialistas em recuperação de peças, serviços de torno, solda elétrica e alumínio, venda de parafusos. Atendemos indústrias, serrarias, construção civil e agricultura em Sinop - MT.",
    siteUrl: window.location.origin,
    whatsappNumber: "5566999019605",
    email: "bhrecuperadora@hotmail.com",
    address: "Rua Dirson José Martini, 827, Sinop - MT",
    
    keywords: [
        "Serviços de Torno", "torno mecânico", "usinagem", "torneamento",
        "Serviços de Solda elétrica", "solda elétrica", "Serviços de Solda Alumínio", "solda alumínio",
        "Recuperação de Peças Agrícolas", "Recuperação de máquinas pesadas",
        "Recuperação de motores elétricos", "Recuperação de bombas d'agua",
        "Recuperação de compressores de ar", "Recuperação de eixos em geral",
        "Recuperação de redutores de velocidade", "Recuperação de máquinas e peças para serrarias",
        "Acoplamento de geradores", "Serviços de bases para geradores de energia estacionários",
        "Recuperação e fabricação de escapamento para geradores estacionários",
        "Furo de polias", "Fabricaçao de Flange para polias",
        "Serviços de pistões hidráulicos", "Venda de parafusos",
        "Vendas de lâminas para tratores", "Serviços de solda para maquinários da construção civil",
        "BH Recuperadora", "Sinop MT"
    ]
};

const TAGS_POR_CATEGORIA = {
    torno: ["torno mecânico", "usinagem", "torneamento", "Serviços de Torno", "recuperação de eixos"],
    solda: ["solda elétrica", "solda alumínio", "solda mig", "solda tig", "Serviços de Solda elétrica", "Serviços de Solda Alumínio"],
    agricola: ["Recuperação de Peças Agrícolas", "peças agrícolas", "lâminas para tratores"],
    pesadas: ["Recuperação de máquinas pesadas", "máquinas pesadas"],
    motores: ["Recuperação de motores elétricos", "motor elétrico", "bobinagem"],
    bombas: ["Recuperação de bombas d'agua", "bomba d'água", "Recuperação de compressores de ar", "compressor de ar"],
    serrarias: ["Recuperação de máquinas e peças para serrarias", "serrarias"],
    geradores: ["Acoplamento de geradores", "bases para geradores", "escapamento para geradores"],
    polias: ["Furo de polias", "Fabricaçao de Flange para polias", "flange", "polias"],
    hidraulica: ["Serviços de pistões hidráulicos", "pistão hidráulico"],
    produtos: ["Venda de parafusos", "parafusos SXT", "lâminas para tratores"],
    construcao: ["Serviços de solda para maquinários da construção civil"]
};

function gerarTagsProduto(produtoNome, produtoDescricao = '') {
    const tags = new Set();
    const nome = produtoNome.toLowerCase();
    const descricao = (produtoDescricao || '').toLowerCase();
    
    if (nome.includes('torno') || descricao.includes('torno')) {
        TAGS_POR_CATEGORIA.torno.forEach(tag => tags.add(tag));
    }
    if (nome.includes('solda') || descricao.includes('solda')) {
        TAGS_POR_CATEGORIA.solda.forEach(tag => tags.add(tag));
    }
    if (nome.includes('agricola') || nome.includes('trator')) {
        TAGS_POR_CATEGORIA.agricola.forEach(tag => tags.add(tag));
    }
    if (nome.includes('pesada')) {
        TAGS_POR_CATEGORIA.pesadas.forEach(tag => tags.add(tag));
    }
    if (nome.includes('motor')) {
        TAGS_POR_CATEGORIA.motores.forEach(tag => tags.add(tag));
    }
    if (nome.includes('bomba') || nome.includes('compressor')) {
        TAGS_POR_CATEGORIA.bombas.forEach(tag => tags.add(tag));
    }
    if (nome.includes('serraria')) {
        TAGS_POR_CATEGORIA.serrarias.forEach(tag => tags.add(tag));
    }
    if (nome.includes('gerador')) {
        TAGS_POR_CATEGORIA.geradores.forEach(tag => tags.add(tag));
    }
    if (nome.includes('polia') || nome.includes('flange')) {
        TAGS_POR_CATEGORIA.polias.forEach(tag => tags.add(tag));
    }
    if (nome.includes('pistão') || nome.includes('hidráulico')) {
        TAGS_POR_CATEGORIA.hidraulica.forEach(tag => tags.add(tag));
    }
    if (nome.includes('parafuso')) {
        TAGS_POR_CATEGORIA.produtos.forEach(tag => tags.add(tag));
        const medidaMatch = nome.match(/\d{2}x\d{2}/i);
        if (medidaMatch) tags.add(`parafuso ${medidaMatch[0]}`);
    }
    if (nome.includes('lâmina')) {
        tags.add('lâminas para tratores');
    }
    if (descricao.includes('construção civil')) {
        TAGS_POR_CATEGORIA.construcao.forEach(tag => tags.add(tag));
    }
    
    tags.add('BH Recuperadora');
    tags.add('Sinop MT');
    
    return Array.from(tags).filter(tag => tag);
}

function gerarMetaTags(produto = null) {
    let title = SEO_CONFIG.siteName;
    let description = SEO_CONFIG.siteDescription;
    let keywords = [...SEO_CONFIG.keywords];
    
    if (produto) {
        title = `${produto.nome} - ${SEO_CONFIG.siteName}`;
        description = `${produto.descricao || 'Serviço/produto de qualidade'} - BH Recuperadora em Sinop - MT.`;
        const tagsProduto = gerarTagsProduto(produto.nome, produto.descricao);
        keywords.push(...tagsProduto);
    }
    
    return {
        title: title,
        description: description.substring(0, 160),
        keywords: [...new Set(keywords)].join(', ')
    };
}

function buscarPorTag(tag, produtos) {
    const tagLower = tag.toLowerCase();
    return produtos.filter(produto => {
        const tagsProduto = gerarTagsProduto(produto.nome, produto.descricao);
        return tagsProduto.some(t => t.toLowerCase().includes(tagLower)) ||
               produto.nome.toLowerCase().includes(tagLower);
    });
}

window.SEO_CONFIG = SEO_CONFIG;
window.gerarTagsProduto = gerarTagsProduto;
window.gerarMetaTags = gerarMetaTags;
window.buscarPorTag = buscarPorTag;