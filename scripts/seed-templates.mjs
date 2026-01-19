import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const templates = [
  // FITNESS
  {
    name: "Treino do Dia",
    description: "Template para compartilhar rotina de exercícios",
    category: "educativo",
    niche: "fitness",
    platform: "instagram",
    contentType: "post",
    promptTemplate: "Crie uma imagem motivacional de treino fitness com cores vibrantes, mostrando uma pessoa fazendo exercícios em uma academia moderna. Estilo: energético e inspirador.",
    captionTemplate: "💪 TREINO DO DIA\n\n[Descreva os exercícios]\n\n🔥 Bora treinar?\n\n#fitness #treino #academia #saude #motivacao",
    hashtagSuggestions: "#fitness #treino #academia #musculacao #saude #vidasaudavel #foco #determinacao #gym #workout",
    visualStyle: "colorido",
  },
  {
    name: "Antes e Depois",
    description: "Mostre transformações físicas",
    category: "depoimento",
    niche: "fitness",
    platform: "instagram",
    contentType: "carousel",
    promptTemplate: "Crie uma imagem de comparação antes/depois para transformação fitness, com layout dividido ao meio, cores motivacionais e espaço para fotos.",
    captionTemplate: "✨ TRANSFORMAÇÃO REAL\n\n[Conte a história]\n\nResultados que inspiram! 🙌\n\n#antesedepois #transformacao #fitness",
    hashtagSuggestions: "#antesedepois #transformacao #fitness #resultados #dedicacao #foco #mudanca",
    visualStyle: "moderno",
  },
  
  // MODA
  {
    name: "Look do Dia",
    description: "Apresente combinações de roupas",
    category: "inspiracional",
    niche: "moda",
    platform: "instagram",
    contentType: "post",
    promptTemplate: "Crie uma imagem elegante de moda com fundo minimalista, mostrando um look completo com acessórios. Estilo: sofisticado e moderno.",
    captionTemplate: "✨ LOOK DO DIA\n\n[Descreva as peças]\n\nO que acharam? 💕\n\n#lookdodia #moda #fashion #estilo",
    hashtagSuggestions: "#lookdodia #moda #fashion #estilo #tendencia #ootd #style #outfit",
    visualStyle: "minimalista",
  },
  {
    name: "Nova Coleção",
    description: "Lance novas peças ou coleções",
    category: "lancamento",
    niche: "moda",
    platform: "instagram",
    contentType: "carousel",
    promptTemplate: "Crie uma imagem de lançamento de coleção de moda com visual luxuoso, cores da estação e elementos de tendência. Estilo: editorial de moda.",
    captionTemplate: "🆕 NOVA COLEÇÃO\n\n[Nome da coleção]\n\nDisponível agora! Link na bio 🛒\n\n#novacoleção #moda #lancamento",
    hashtagSuggestions: "#novacoleção #moda #lancamento #tendencia #fashion #newcollection #style",
    visualStyle: "artistico",
  },
  
  // GASTRONOMIA
  {
    name: "Receita Rápida",
    description: "Compartilhe receitas fáceis",
    category: "educativo",
    niche: "gastronomia",
    platform: "instagram",
    contentType: "carousel",
    promptTemplate: "Crie uma imagem apetitosa de comida com iluminação profissional, mostrando o prato finalizado. Estilo: food photography premium.",
    captionTemplate: "🍽️ RECEITA RÁPIDA\n\n[Nome do prato]\n\nIngredientes:\n[Liste os ingredientes]\n\nModo de preparo nos próximos slides! 👉\n\n#receita #gastronomia #comida",
    hashtagSuggestions: "#receita #gastronomia #comida #food #foodie #receitafacil #cozinha #delicia",
    visualStyle: "colorido",
  },
  {
    name: "Promoção Restaurante",
    description: "Divulgue ofertas especiais",
    category: "promocao",
    niche: "gastronomia",
    platform: "instagram",
    contentType: "story",
    promptTemplate: "Crie uma imagem promocional de restaurante com cores quentes, mostrando pratos deliciosos e destaque para o desconto. Estilo: apetitoso e urgente.",
    captionTemplate: "🔥 PROMOÇÃO ESPECIAL\n\n[Descreva a oferta]\n\nVálido até [data]!\n\n📍 [Endereço]\n📞 [Telefone]",
    hashtagSuggestions: "#promocao #restaurante #desconto #gastronomia #comida #oferta",
    visualStyle: "colorido",
  },
  
  // TECNOLOGIA
  {
    name: "Dica Tech",
    description: "Compartilhe dicas de tecnologia",
    category: "dica",
    niche: "tecnologia",
    platform: "linkedin",
    contentType: "post",
    promptTemplate: "Crie uma imagem tech minimalista com ícones de tecnologia, cores azul e roxo, visual futurista. Estilo: clean e profissional.",
    captionTemplate: "💡 DICA TECH\n\n[Título da dica]\n\n[Explique a dica]\n\nSalve para não esquecer! 📌\n\n#tecnologia #dica #tech",
    hashtagSuggestions: "#tecnologia #tech #dica #inovacao #digital #software #programacao",
    visualStyle: "moderno",
  },
  {
    name: "Review de Produto",
    description: "Análise de gadgets e softwares",
    category: "educativo",
    niche: "tecnologia",
    platform: "instagram",
    contentType: "carousel",
    promptTemplate: "Crie uma imagem de review de produto tech com fundo escuro, iluminação neon, mostrando o produto em destaque. Estilo: futurista e premium.",
    captionTemplate: "📱 REVIEW\n\n[Nome do produto]\n\n✅ Prós:\n[Liste os prós]\n\n❌ Contras:\n[Liste os contras]\n\nNota: ⭐⭐⭐⭐\n\n#review #tech #gadget",
    hashtagSuggestions: "#review #tech #gadget #tecnologia #unboxing #produto #analise",
    visualStyle: "moderno",
  },
  
  // BELEZA
  {
    name: "Tutorial Maquiagem",
    description: "Passo a passo de makes",
    category: "educativo",
    niche: "beleza",
    platform: "instagram",
    contentType: "reel",
    promptTemplate: "Crie uma imagem glamourosa de maquiagem com cores vibrantes, mostrando produtos de beleza premium. Estilo: editorial de beleza.",
    captionTemplate: "💄 TUTORIAL\n\n[Nome do look]\n\nProdutos usados:\n[Liste os produtos]\n\nSalve e tente em casa! ✨\n\n#maquiagem #makeup #tutorial",
    hashtagSuggestions: "#maquiagem #makeup #tutorial #beleza #beauty #make #skincare",
    visualStyle: "artistico",
  },
  {
    name: "Skincare Routine",
    description: "Rotina de cuidados com a pele",
    category: "educativo",
    niche: "beleza",
    platform: "instagram",
    contentType: "carousel",
    promptTemplate: "Crie uma imagem clean de skincare com produtos de beleza em fundo claro, visual fresh e natural. Estilo: minimalista e clean.",
    captionTemplate: "🧴 ROTINA DE SKINCARE\n\n[Descreva sua rotina]\n\nQual produto você usa? Conta nos comentários! 💬\n\n#skincare #beleza #cuidados",
    hashtagSuggestions: "#skincare #beleza #cuidados #pele #rotina #beauty #selfcare",
    visualStyle: "minimalista",
  },
  
  // NEGÓCIOS
  {
    name: "Dica de Negócios",
    description: "Insights para empreendedores",
    category: "educativo",
    niche: "negocios",
    platform: "linkedin",
    contentType: "post",
    promptTemplate: "Crie uma imagem corporativa profissional com gráficos de crescimento, cores azul e dourado. Estilo: executivo e confiável.",
    captionTemplate: "💼 DICA DE NEGÓCIOS\n\n[Título]\n\n[Desenvolva a dica]\n\nConcorda? Deixe sua opinião! 💬\n\n#negocios #empreendedorismo #dica",
    hashtagSuggestions: "#negocios #empreendedorismo #dica #business #sucesso #carreira #lideranca",
    visualStyle: "corporativo",
  },
  {
    name: "Case de Sucesso",
    description: "Compartilhe resultados e conquistas",
    category: "depoimento",
    niche: "negocios",
    platform: "linkedin",
    contentType: "carousel",
    promptTemplate: "Crie uma imagem de case de sucesso com métricas de crescimento, visual profissional e cores corporativas. Estilo: data-driven.",
    captionTemplate: "📈 CASE DE SUCESSO\n\n[Nome do cliente/projeto]\n\nResultados:\n✅ [Métrica 1]\n✅ [Métrica 2]\n✅ [Métrica 3]\n\n#case #sucesso #resultados",
    hashtagSuggestions: "#case #sucesso #resultados #negocios #crescimento #business #marketing",
    visualStyle: "corporativo",
  },
  
  // LIFESTYLE
  {
    name: "Momento do Dia",
    description: "Compartilhe momentos especiais",
    category: "bastidores",
    niche: "lifestyle",
    platform: "instagram",
    contentType: "story",
    promptTemplate: "Crie uma imagem lifestyle aconchegante com iluminação natural, tons quentes e visual casual. Estilo: autêntico e inspirador.",
    captionTemplate: "☀️ [Descreva o momento]\n\nComo está sendo seu dia? 💭",
    hashtagSuggestions: "#lifestyle #vidasaudavel #momentos #rotina #vida #inspiracao",
    visualStyle: "artistico",
  },
  {
    name: "Motivacional",
    description: "Frases e pensamentos inspiradores",
    category: "inspiracional",
    niche: "lifestyle",
    platform: "instagram",
    contentType: "post",
    promptTemplate: "Crie uma imagem motivacional com fundo gradiente, tipografia elegante para frase inspiradora. Estilo: minimalista e impactante.",
    captionTemplate: "✨ [Frase motivacional]\n\nMarque alguém que precisa ler isso hoje! 💕\n\n#motivacao #inspiracao #frases",
    hashtagSuggestions: "#motivacao #inspiracao #frases #pensamentos #reflexao #vida #positividade",
    visualStyle: "minimalista",
  },
];

async function seedTemplates() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Inserting templates...");
  
  for (const template of templates) {
    try {
      await connection.execute(
        \`INSERT INTO post_templates 
        (name, description, category, niche, platform, contentType, promptTemplate, captionTemplate, hashtagSuggestions, visualStyle, isPremium, usageCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [
          template.name,
          template.description,
          template.category,
          template.niche,
          template.platform,
          template.contentType,
          template.promptTemplate,
          template.captionTemplate,
          template.hashtagSuggestions,
          template.visualStyle,
          false,
          0
        ]
      );
      console.log(\`✅ Inserted: \${template.name}\`);
    } catch (error) {
      console.error(\`❌ Error inserting \${template.name}:\`, error.message);
    }
  }

  console.log("\\nDone! Templates seeded successfully.");
  await connection.end();
}

seedTemplates().catch(console.error);
