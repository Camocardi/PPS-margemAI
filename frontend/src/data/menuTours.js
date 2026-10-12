import { User, Package, ShoppingBag, BarChart3, Wallet, Calculator, Tags, CreditCard, Landmark, ArrowLeftRight, ListFilter } from 'lucide-react'

const accountSteps = [
  { Icon: Landmark, title: 'Onde está o dinheiro?', text: 'Cadastre seu banco PJ, carteira digital ou caixa em espécie. Uma conta pode ser suficiente.', example: 'Banco PJ · Caixa em dinheiro' },
  { Icon: Landmark, title: 'Comece pelo saldo inicial', text: 'Informe quanto já havia na conta e em qual data. Os próximos movimentos serão somados ou descontados desse valor.', example: 'Saldo inicial R$ 100 + aporte R$ 30 = R$ 130' },
  { Icon: ArrowLeftRight, title: 'Registre entradas e saídas', text: 'Aporte é dinheiro seu entrando. Retirada é dinheiro saindo para uso pessoal. Pró-labore é o pagamento pelo seu trabalho e não cria outro custo.', example: 'O custo do pró-labore fica em Custos Fixos.' },
  { Icon: ArrowLeftRight, title: 'Mova dinheiro entre contas', text: 'Na transferência, uma conta diminui e a outra aumenta. O total da empresa continua igual.', example: 'R$ 100 do banco → R$ 100 no caixa' },
  { Icon: ListFilter, title: 'Acompanhe os movimentos', text: 'Use o filtro para ver uma conta ou todas. Vendas e custos ainda não atualizam estes saldos automaticamente.', example: 'Para rever estas dicas, clique em “Como usar”.' }
]

const step = (Icon, title, text, example) => ({ Icon, title, text, example })
export const MENU_TOURS = {
  profile: [
    step(User, 'Seu negócio começa aqui', 'Confira os dados do titular e da empresa. Use “Editar dados cadastrais” para atualizar seu cadastro.', 'Mantenha o segmento do negócio atualizado.'),
    step(User, 'Revise e salve', 'No formulário, confira os campos antes de salvar. Depois, consulte os dados atualizados no perfil.', 'Você pode voltar a editar quando precisar.')
  ],
  products: [
    step(Package, 'Seu catálogo em um lugar', 'Cadastre os produtos e serviços que você vende pelo botão “Novo Item”.', 'Exemplo: bolo caseiro ou serviço de manutenção.'),
    step(Tags, 'Escolha um padrão de preço', 'Vincule o item a um padrão de precificação para usar seus parâmetros de margem e despesas.', 'Os padrões são definidos em Configurações → Padrões de Preço.'),
    step(ListFilter, 'Encontre e revise os itens', 'Use a busca e os filtros para localizar itens. Confira os custos e preços antes de registrar novas vendas.', 'Revise o preço quando o custo do item mudar.')
  ],
  accounts: accountSteps,
  sales: [
    step(ShoppingBag, 'Registre uma venda', 'Abra “Nova Venda Rápida”, selecione o item e informe os dados da operação.', 'Confira quantidade, preço e data antes de salvar.'),
    step(CreditCard, 'Confira a taxa de pagamento', 'Selecione a forma de pagamento e as parcelas. A taxa vem da sua configuração; uma taxa avulsa vale só para aquela venda.', 'Ajustes permanentes ficam em Taxas de Pagamento.'),
    step(ListFilter, 'Consulte seu histórico', 'Use os filtros para acompanhar as vendas e os indicadores do período selecionado.', 'Venda registrada não significa dinheiro recebido em uma conta empresarial.')
  ],
  cashflow: [
    step(BarChart3, 'Compare os meses', 'Escolha o período no cabeçalho para acompanhar a evolução das receitas e despesas.', 'Observe tendências e meses com maior pressão nos custos.'),
    step(Wallet, 'Entenda os valores', 'Confira o detalhamento de receitas, custos e taxas para entender o resultado de cada mês.', 'Este painel não representa o saldo bancário das Contas Empresariais.'),
    step(BarChart3, 'Acompanhe o teto MEI', 'Consulte o indicador de faturamento anual, que independe do período escolhido no painel.', 'O teto acompanha faturamento, e não lucro ou saldo bancário.')
  ],
  costs: [
    step(Wallet, 'Separe os tipos de custo', 'Alterne entre Custos Fixos e Custos Variáveis para registrar as despesas do negócio.', 'Fixos: aluguel. Variáveis: embalagem e matéria-prima.'),
    step(Landmark, 'Registre as despesas fixas', 'Cadastre os valores e a recorrência. Inclua o pró-labore uma única vez para considerar seu trabalho na precificação.', 'O pagamento do pró-labore pode ser registrado em Contas Empresariais sem criar outro custo.'),
    step(Package, 'Vincule os custos variáveis', 'Associe os custos variáveis ao produto correspondente para compor seu custo.', 'Cadastrar um custo não movimenta automaticamente o saldo de uma conta.')
  ],
  pricing: [
    step(Calculator, 'Comece pelo custo', 'Selecione um produto cadastrado ou preencha os parâmetros para simular seu preço de venda.', 'Confira o custo antes de ajustar a margem.'),
    step(CreditCard, 'Considere as despesas', 'Revise margem, impostos e despesas. Ao incluir a taxa de pagamento configurada, evite contar a mesma taxa nas despesas variáveis.', 'A matriz de taxas fica em Configurações → Taxas de Pagamento.'),
    step(BarChart3, 'Compare os resultados', 'Analise o preço sugerido e o ponto de equilíbrio. Use a simulação de desconto para avaliar o impacto na margem.', 'Uma simulação ajuda a decidir; não registra uma venda.')
  ],
  categories: [
    step(Tags, 'Crie padrões reutilizáveis', 'Use “Novo padrão” para definir parâmetros de preço que seus produtos e serviços podem compartilhar.', 'Exemplo: um padrão para produtos e outro para serviços.'),
    step(Calculator, 'Revise os parâmetros', 'Confira margem, impostos, taxas e desconto do padrão. Parâmetros operacionais podem vir da configuração global.', 'Verifique os valores herdados antes de personalizar.'),
    step(Package, 'Acompanhe os itens vinculados', 'Ao alterar um padrão, confira os efeitos nos itens associados e os avisos de preço apresentados.', 'Um padrão reúne regras de preço, não movimentações de dinheiro.')
  ],
  'payment-methods': [
    step(CreditCard, 'Configure suas formas de pagamento', 'Confira as taxas e prazos praticados pela sua operadora. Use as abas para encontrar cada forma de pagamento.', 'Expanda as opções de parcelamento quando precisar.'),
    step(Calculator, 'Personalize só o necessário', 'Ajuste percentual, tarifa fixa e prazo. A marca “Personalizado” aparece quando o valor difere do recomendado.', 'Você pode restaurar os valores recomendados.'),
    step(CreditCard, 'Salve as alterações', 'Revise as marcas de “Não salvo” e clique em “Salvar Alterações”. Os valores salvos serão usados nos cálculos de taxas.', 'Ao sair com mudanças pendentes, a tela pede confirmação.')
  ]
}
