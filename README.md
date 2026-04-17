📚 Biblioteca DuBom - Sistema de Gestão Eclesiástica
O Biblioteca DuBom é uma API robusta desenvolvida com FastAPI para gerenciar o acervo literário, membros e o fluxo de empréstimos de uma biblioteca de igreja. O sistema foca em controle rigoroso de estoque, limites de renovação e relatórios estatísticos.

🚀 Funcionalidades Principais
📖 Gestão de Acervo
Catálogo Completo: Listagem com filtros por título, autor, categoria e status.

Controle de Inventário: Gerenciamento automático de livros disponíveis vs. emprestados.

Segurança no Cadastro: Apenas administradores autenticados podem adicionar ou remover livros.

👥 Gestão de Membros
Cadastro Detalhado: Registro de membros com CPF, contato e data de batismo.

Sistema de Login: Acesso individual para consulta de histórico e renovações.

Políticas de Uso: Controle automático de limite de livros por pessoa (configurável).

🔄 Circulação (Empréstimos & Reservas)
Empréstimos Inteligentes: Validação de estoque e restrições de membros em tempo real.

Renovação com Regras: Sistema de renovação por 7 dias com limite de 3 renovações totais por membro.

Reservas de Livros: Permite que membros reservem obras para retirada futura.

Devoluções: Registro de condição física do livro e observações na entrega.

📊 Painel de Controle (Dashboard)
Estatísticas em tempo real (Total de livros, atrasos, membros ativos).

Relatório de livros mais populares.

Histórico de auditoria para todas as ações do sistema.

🛠️ Tecnologias Utilizadas
Linguagem: Python 3.9+

Framework: FastAPI

Banco de Dados: MySQL

Validação de Dados: Pydantic

Servidor ASGI: Uvicorn

Segurança: CORS Middleware e Dotenv para variáveis de ambiente.

📦 Como Instalar e Rodar
1. Clonar o repositório
Bash
git clone https://github.com/seu-usuario/biblioteca-dubom.git
cd biblioteca-dubom
2. Configurar o ambiente virtual
Bash
python -m venv venv
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate
3. Instalar dependências
Bash
pip install fastapi uvicorn mysql-connector-python python-dotenv
4. Configurar Variáveis de Ambiente
Crie um arquivo chamado backend.env na raiz do projeto com as seguintes chaves:

Snippet de código
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=biblioteca_dubom
5. Executar a API
Bash
python main.py
A API estará disponível em http://127.0.0.1:8000.

📖 Documentação da API
Uma das grandes vantagens deste projeto é a documentação automática. Com o servidor rodando, acesse:

Swagger UI (Interativo): http://127.0.0.1:8000/docs

Redoc: http://127.0.0.1:8000/redoc

🗄️ Estrutura do Banco de Dados
O sistema espera que as seguintes tabelas e views existam no MySQL:

livros, membros, administradores

emprestimos, reservas, categorias

historico

Views: vw_livros_completo, vw_emprestimos_ativos, vw_livros_populares.

📝 Licença
Este projeto é destinado a fins educacionais e uso interno eclesiástico. Sinta-se à vontade para clonar e adaptar.

Desenvolvido para a Biblioteca Igreja DuBom. 🕊️
