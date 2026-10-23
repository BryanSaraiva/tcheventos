<p align="center">
  <img src="./public/logo.svg" alt="Ícone do Tchêventos" width="112">
</p>

<h1 align="center">Tchêventos</h1>

<p align="center">
  Uma forma simples e flexível de criar, organizar e compartilhar programações de eventos.
</p>

<p align="center">
  <a href="README.en.md">Read this page in English</a> ·
  <a href="https://bryansaraiva.github.io/tcheventos/">Abrir o Tchêventos</a>
</p>

---

## Sobre o projeto

O **Tchêventos** é uma ferramenta gratuita e de código aberto para criar e organizar programações de eventos. Foi pensado para quem precisa montar uma agenda clara, acompanhar várias atividades e preparar uma programação pronta para consultar ou compartilhar, sem complicar o processo.

Use-o em eventos universitários, atividades educacionais, encontros pessoais, eventos de empresas, congressos, seminários, summits ou em qualquer ocasião que precise de uma programação bem organizada.

A ideia é simples: **facilitar a organização de eventos e deixar uma ferramenta útil ao alcance de todo mundo**. O Tchêventos é gratuito para uso pessoal, educacional e profissional.

## Recursos

### Organize eventos do seu jeito

- **Nome personalizado para cada evento.**
- **Duração flexível:** monte programações de um ou muitos dias, incluindo eventos que atravessam a virada do ano.
- **Visão geral automática:** acompanhe a quantidade de atividades, o total de horas programadas e as sobreposições de horário.
- **Consulta por dia ou da programação inteira:** veja os indicadores e as atividades de um dia específico ou os totais de todos os dias combinados.

### Encontre e visualize atividades

- **Busca rápida** por título, espaço ou notas.
- **Filtros** por espaço/local e categoria.
- **Visualização em tabela:** organize a programação e crie ou edite atividades.
- **Visualização em matriz:** consulte a programação em uma linha do tempo horizontal, com espaços nas linhas e horários nas colunas. Também é possível editar atividades nessa visualização.
- **Roteiro operacional (*run of show*):** consulte a programação com informações e notas de produção.

### Personalize cada atividade

Cada atividade pode incluir:

- Título, data, horário inicial e horário final.
- Espaço, sala ou trilha.
- Categoria e cor de destaque individual.
- Descrição e notas.
- Notas de produção.
- Palestrantes e participantes, quando aplicável.

As cores de destaque usam uma paleta familiar a quem trabalha com ferramentas do Google, facilitando a diferenciação visual das atividades.

### Exporte, importe e compartilhe

- **Importação e exportação CSV:** salve uma programação, compartilhe o arquivo ou importe-o novamente para continuar trabalhando. Isso também permite manter arquivos separados para diferentes eventos.
- **Copiar para o Google Sheets:** copie a programação atual para a área de transferência e cole-a diretamente em uma planilha.
- **Exportar a matriz para Excel:** leve a visualização horizontal da programação para uma planilha.
- **Exportar a programação do evento:** gere uma versão organizada para apresentar e consultar os horários e as atividades, no estilo das programações usadas em congressos e summits.
- **Recomeçar rapidamente:** limpe as atividades atuais para começar uma nova programação.

### Uma interface para trabalhar com conforto

- Interface simples, dinâmica e fácil de usar.
- Modos claro e escuro.
- Salvamento automático no navegador: não é necessário clicar em um botão de salvar.

## Como seus dados são armazenados

O Tchêventos salva automaticamente a programação atual no armazenamento local do navegador. Assim, suas alterações ficam salvas enquanto você trabalha, sem precisar salvar manualmente.

**Atenção:** os dados locais não são sincronizados automaticamente entre navegadores, dispositivos ou pessoas. Para fazer uma cópia de segurança, compartilhar uma programação ou trabalhar em outro dispositivo, exporte o arquivo CSV. Depois, use a opção de importação para continuar trabalhando com ele. Limpar os dados do site no navegador pode apagar a programação armazenada localmente.

## Comece a usar

**[Abrir o Tchêventos](COLOQUE-AQUI-A-URL-DO-APP)**

Crie um evento, configure os dias, adicione as atividades e escolha a visualização que melhor atende ao seu trabalho. A programação é salva automaticamente no navegador.

## Desenvolvimento

O Tchêventos usa **React**, **TypeScript** e **Vite**.

Para executar o projeto localmente, instale o [Node.js](https://nodejs.org/) e o npm. Depois, clone este repositório e execute:

```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
```

Para visualizar localmente a versão de produção:

```bash
npm run preview
```

Substitua `SEU-USUARIO` e `SEU-REPOSITORIO` pelo endereço e pelo nome reais do repositório.

## Idiomas

A interface do Tchêventos está disponível em português brasileiro e inglês.

- **Português (Brasil):** este README.
- **English:** [README.en.md](README.en.md).

## Licença

O Tchêventos é distribuído sob a **GNU General Public License v3.0 (GPL-3.0)**. Você pode usar, estudar, modificar e redistribuir o software de acordo com os termos dessa licença.

Consulte o arquivo [`LICENSE`](LICENSE) para ler o texto completo.

---

Feito para deixar a organização de eventos mais fácil — para todo mundo.
