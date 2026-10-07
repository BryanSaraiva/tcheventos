const ptBR = {
  common: {
    appName: 'Tchêventos',
    subtitle:
      'Gerenciador e Roteiro de Eventos',
    eventTitlePlaceholder:
      'Nome do Evento...',
    timeRange: '14h às 22h',
  },

  menu: {
    title: 'Ações do Cronograma',

    newActivity: 'Nova Atividade',
    importCsv: 'Importar CSV',
    copyForSheets:
      'Copiar p/ Planilhas',
    exportCsv: 'Exportar CSV',
    exportMatrix:
      'Exportar Matriz (Excel)',

    restoreDefaults:
      'Restaurar Dados Padrão',
    clearAll:
      'Limpar Todas as Atividades',

    language: 'Idioma',
  },

  languages: {
    'pt-BR': 'Português (Brasil)',
    'en-US': 'English (United States)',
  },

  filters: {
    allDays: 'Todos os Dias ({{count}})',
    allTracks:
      'Todos os Espaços / Trilhas',
    allCategories:
      'Todas as Categorias',

    searchPlaceholder:
      'Buscar por título, espaço ou nota...',
  },

  views: {
    table: 'Tabela',
    timeline: 'Matriz',
    runOfShow: 'Roteiro',

    tableTitle:
      'Visualização em Tabela Detalhada',

    timelineTitle:
      'Visualização em Matriz Visual / Linha do Tempo',

    runOfShowTitle:
      'Roteiro de Produção Minuto a Minuto',
  },

  activity: {
    title: 'Título da Atividade',
    date: 'Data',
    startTime: 'Início',
    endTime: 'Término',
    track: 'Espaço / Trilha',
    category: 'Categoria',
    optional: 'opcional',

    color: 'Cor de Destaque',
    chooseColor: 'Escolher Cor',

    notes:
      'Notas / Descrição Detalhada',

    titlePlaceholder:
      'Ex: Palestra Magna de Inovação',

    notesPlaceholder:
      'Ex: Detalhes dos palestrantes, equipamentos necessários ou observações técnicas...',
  },

  activityModal: {
    editTitle: 'Editar Atividade',
    createTitle: 'Nova Atividade',

    editDescription:
      'Atualize as informações do cronograma',

    createDescription:
      'Adicione uma nova sessão ao evento',

    cancel: 'Cancelar',
    saveChanges: 'Salvar Alterações',
    create: 'Criar Atividade',
  },

  combobox: {
    typeOrSelect:
      'Digite ou selecione...',

    create: 'Criar "{{value}}"',

    noOptions:
      'Nenhuma opção cadastrada.',

    save: 'Salvar',
    cancel: 'Cancelar',

    editOption: 'Editar opção',
    deleteOption: 'Excluir opção',

    usedInOne:
      'Esta opção é usada em {{count}} atividade. Remover de todas?',

    usedInMany:
      'Esta opção é usada em {{count}} atividades. Remover de todas?',

    remove: 'Remover',
  },

  categories: {
    none: 'Sem categoria',
  },

  timeline: {
    track: 'Espaço / Trilha',

    noActivities:
      'Nenhuma atividade na linha do tempo',

    emptyDescription:
      'Não há sessões programadas para exibir no modo matriz. Tente alterar os filtros ou cadastrar uma nova atividade.',

    addActivity:
      'Adicionar Atividade',

    activities: 'atividades',
    activity: 'atividade',

    duplicate: 'Duplicar',
    delete: 'Excluir',
  },

  table: {
    noActivities:
      'Nenhuma atividade encontrada',

    noActivitiesDescription:
      'Não foi possível encontrar sessões com os filtros aplicados. Tente ajustar os termos da busca ou adicionar uma nova atividade.',

    addActivity:
      'Adicionar Atividade',

    color: 'Cor',
    time: 'Horário',
    titleDescription:
      'Título & Descrição',
    category: 'Categoria',
    actions: 'Ações',

    edit: 'Editar Atividade',
    duplicate: 'Duplicar Atividade',
    delete: 'Excluir Atividade',
  },

  validation: {
    titleRequired:
      'Por favor, informe o título da atividade.',

    trackRequired:
      'Por favor, informe o Espaço / Trilha.',

    endTimeAfterStart:
      'O horário de término deve ser posterior ao horário de início.',
  },

  toasts: {
    activityUpdated:
      'Atividade atualizada com sucesso!',

    activityCreated:
      'Nova atividade adicionada ao cronograma!',

    activityDeleted:
      'Atividade removida do cronograma.',

    activityDuplicated:
      'Atividade duplicada com sucesso!',

    csvExported:
      'Cronograma exportado para CSV com sucesso!',

    csvImported:
      '{{count}} atividades importadas com sucesso!',

    matrixExported:
      'Matriz exportada para Excel com sucesso!',

    matrixCopied:
      'Matriz copiada! Cole diretamente no Google Planilhas.',

    allActivitiesCleared:
      'Todas as atividades foram apagadas.',

    defaultsRestored:
      'Cronograma restaurado para os dados padrão!',

    nothingToExport:
      'Não há atividades para exportar como matriz.',

    nothingToCopy:
      'Não há atividades para copiar.',
  },

  matrix: {
    track: 'Espaço / Trilha',
    noCategory: 'Sem categoria',
    date: 'Data',
  },

  runOfShow: {
    // We'll populate these after auditing RunOfShowView.tsx.
  },

  metrics: {
  activities_one: '<bold>{{count}}</bold> atividade',
  activities_other: '<bold>{{count}}</bold> atividades',

  scheduled:
    '<bold>{{duration}}</bold> programadas',

  overlaps_one:
    '{{count}} sobreposição',

  overlaps_other:
    '{{count}} sobreposições',
},
} as const;

export default ptBR;