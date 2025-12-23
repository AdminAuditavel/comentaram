# Checklist de Desenvolvimento - Pulso (Esporte)

## Fase 1: **Desenvolvimento da Plataforma Pulso (Esporte)**

### 1. Coleta de Dados
- [x] **Reddit**: Integrar a API do Reddit para coletar menções de clubes de futebol.
  - [x] Configurar o acesso à API.
  - [x] Criar script para buscar posts e menções aos clubes.
- [x] **YouTube**: Coletar vídeos relacionados a clubes de futebol usando **YouTube API**.
  - [x] Testar o script de coleta de vídeos (`youtube_collect.py`).
  - [x] Garantir que dados de vídeos sejam armazenados corretamente.
- [x] **Google Trends**: Configurar a coleta de dados sobre popularidade de clubes.
  - [x] Configurar API do Google Trends.
  - [x] Criar função para buscar dados de tendências.
- [x] **Mock de Dados**: Criar dados mock para simular coleta quando as APIs externas estiverem indisponíveis.

### 2. Processamento de Dados
- [x] **Agregação Diária**: Implementar script para agregar dados diários e calcular rankings.
  - [x] Criar função no Supabase para agregar métricas.
  - [x] Implementar processo de atualização de ranking diário.
- [x] **Normalização de Dados**: Criar script para normalizar o volume de interações (como normalizar por maior volume).
  - [x] Implementar normalização de volume nas tabelas.
- [x] **Análise de Sentimento**: Implementar análise de sentimento nas menções.
  - [x] Configurar biblioteca de análise de sentimentos.
  - [x] Armazenar e exibir o sentimento de cada menção.

### 3. Banco de Dados
- [x] **Configuração do Supabase**: Criar tabelas no Supabase para armazenar os dados (clubes, fontes, rankings).
  - [x] Criar tabela para **clubes**.
  - [x] Criar tabela para **fontes**.
  - [x] Criar tabela para **ranking diário**.
  - [x] Criar tabela para **análises de sentimento** e **IAP**.
- [x] **Inserção e Atualização de Dados**: Desenvolver scripts para inserir e atualizar dados no banco de dados.
  - [x] Testar inserção de dados nas tabelas.
  - [x] Validar dados de cada clube.
- [x] **Validações de Dados**: Implementar verificações de integridade de dados no banco (ex: checagem de duplicados).

### 4. API (FastAPI)
- [x] **Criação de Endpoints**: Criar endpoints RESTful para retornar dados aos usuários.
  - [x] Endpoint `/daily_ranking`: Retornar ranking diário de clubes.
  - [x] Endpoint `/clubs`: Retornar dados dos clubes.
  - [x] Endpoint `/sources`: Retornar fontes de dados utilizadas.
  - [x] Endpoint `/daily_iap`: Retornar métricas de IAP.
- [x] **Segurança e Autenticação**: Garantir que a API esteja segura, principalmente ao manipular dados privados.
  - [ ] Implementar autenticação, se necessário.
  - [ ] Adicionar limites de requisição (rate-limiting) se necessário.
- [x] **Documentação da API**: Documentar os endpoints e como utilizá-los.
  - [x] Criar documentação clara e acessível.

### 5. Interface de Visualização
- [ ] **Desenvolvimento Front-End**: Criar interface básica para visualizar rankings e gráficos.
  - [ ] Usar **Next.js** ou outro framework front-end.
  - [ ] Conectar a interface à API para consumir dados.
- [ ] **Gráficos Interativos**: Implementar gráficos para visualizar rankings e métricas de sentimento.
  - [ ] Usar **Chart.js** ou **D3.js** para gráficos dinâmicos.
  - [ ] Implementar filtros interativos para seleção de data, clube, etc.

---

## Fase 2: **Expansão para Outras Áreas de Interesse**

### 1. Definição de Novas Áreas
- [ ] **Identificação de Fontes**: Identificar fontes públicas para as novas áreas (ex: política, ciência, tecnologia).
  - [ ] Coletar fontes de dados sobre política, ciência e tecnologia.
- [ ] **Adaptação de Arquitetura**: Adaptar o sistema para suportar múltiplas áreas de interesse.
  - [ ] Atualizar modelo de dados para suportar categorias (esporte, política, etc.).
  - [ ] Adicionar filtros para visualização de múltiplas áreas.

### 2. Coleta de Dados para Novas Áreas
- [ ] **Coleta Política**: Configurar coleta de dados de discussões políticas (ex: Reddit, Twitter).
  - [ ] Integrar novas APIs ou fontes.
- [ ] **Coleta de Ciência/Tecnologia**: Coletar dados de discussões sobre ciência e tecnologia.
  - [ ] Configurar APIs de ciência e tecnologia (ex: arXiv, Google Scholar).
- [ ] **Testar Coleta**: Garantir que os dados de novas áreas sejam coletados e armazenados corretamente.

### 3. Processamento de Dados para Novas Áreas
- [ ] **Agregação de Dados**: Agregar dados das novas áreas de forma similar ao que é feito para esporte.
  - [ ] Adaptar scripts de agregação para as novas áreas.
- [ ] **Normalização e Análise**: Normalizar dados e implementar análise de sentimentos nas novas áreas.
  - [ ] Testar o processo de normalização e análise de sentimento.

### 4. API e Expansão de Endpoints
- [ ] **Novos Endpoints**: Criar novos endpoints para cada área de interesse.
  - [ ] Endpoint `/political_ranking`: Ranking político.
  - [ ] Endpoint `/science_ranking`: Ranking científico/tecnológico.
- [ ] **Filtros de Área**: Adicionar filtros na API para permitir que os usuários selecionem a área de interesse.
  - [ ] Filtrar por categoria (esporte, política, etc.).

### 5. Interface de Visualização (Expansão)
- [ ] **Atualização de Interface**: Expandir a interface para suportar visualização de novas áreas.
  - [ ] Adicionar seleção de área de interesse (ex: Esporte, Política, Ciência).
- [ ] **Gráficos Interativos**: Atualizar gráficos para suportar múltiplas áreas de dados.
  - [ ] Adicionar filtros para área, data e categoria.

---

## Fase 3: **Escalabilidade e Melhoria Contínua**

### 1. Otimização de Banco de Dados
- [ ] **Melhorias no Supabase**: Implementar indexação e particionamento de tabelas.
  - [ ] Testar consultas para garantir performance com grandes volumes de dados.
  
### 2. Escalabilidade da API
- [ ] **Otimização da API**: Melhorar a performance da API, adicionando cache e otimizando rotas.
  - [ ] Implementar cache para os dados mais acessados.
- [ ] **Limitação de Requisições**: Implementar rate-limiting e controle de uso da API.
  - [ ] Garantir que a API não seja sobrecarregada por acessos simultâneos.

### 3. Monitoramento e Manutenção
- [ ] **Implementação de Monitoramento**: Criar sistema de monitoramento da aplicação (logs, alertas).
  - [ ] Implementar alertas para falhas nas rotinas de coleta ou agregação.

### 4. Melhorias na Interface
- [ ] **Recursos Avançados de Visualização**: Adicionar mais recursos de interação na interface.
  - [ ] Implementar comparação entre diferentes áreas de interesse.
  - [ ] Adicionar recursos de exportação de dados (por exemplo, CSV, PDF).

---

## Fase 4: **Lançamento e Marketing Público**

### 1. Lançamento
- [ ] **Infraestrutura**: Garantir que a plataforma seja escalável para lançamento público.
  - [ ] Testar servidores e banco de dados para suportar alta demanda.
  
### 2. Marketing e Divulgação
- [ ] **Material de Marketing**: Criar páginas de divulgação e materiais explicativos.
  - [ ] Promover a plataforma em redes sociais e fóruns.
