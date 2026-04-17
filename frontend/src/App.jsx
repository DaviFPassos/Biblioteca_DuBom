import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [tela, setTela] = useState('home') // home, login, admin, membro
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [tipoUsuario, setTipoUsuario] = useState(null) // admin, membro
  
  // Estados para dados
  const [livros, setLivros] = useState([])
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [emprestimosAtivos, setEmprestimosAtivos] = useState([])
  const [emprestimosDoMembro, setEmprestimosDoMembro] = useState([])
  const [estatisticas, setEstatisticas] = useState({})
  const [renovacoesRestantes, setRenovacoesRestantes] = useState(0)
  
  // Estados para formulários
  const [busca, setBusca] = useState('')
  const [buscaEmprestimos, setBuscaEmprestimos] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [buscaLivroModal, setBuscaLivroModal] = useState('')
  const [buscaMembroModal, setBuscaMembroModal] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalTipo, setModalTipo] = useState('') // 'livro', 'membro', 'emprestimo'
  
  // Forms
  const [formLivro, setFormLivro] = useState({
    titulo: '', autor: '', editora: '', isbn: '', ano_publicacao: '',
    categoria_id: '', quantidade_total: 1, localizacao: '', descricao: ''
  })
  
  const [formMembro, setFormMembro] = useState({
    nome: '', cpf: '', email: '', telefone: '', endereco: '', data_batismo: '', cargo: 'Membro', max_emprestimos: 3, senha: ''
  })
  
  const [formEmprestimo, setFormEmprestimo] = useState({
    livro_id: '', membro_id: '', dias_emprestimo: 14, responsavel: 'Administrador'
  })
  
  const [loginDataAdmin, setLoginDataAdmin] = useState({ usuario: '', senha: '' })
  const [loginDataMembro, setLoginDataMembro] = useState({ cpf: '', senha: '' })
  
  // Estados para confirmação de senha
  const [senhaConfirmacaoLivro, setSenhaConfirmacaoLivro] = useState('')
  const [senhaConfirmacaoEmprestimo, setSenhaConfirmacaoEmprestimo] = useState('')
  
  // Modal renovação
  const [showModalRenovacao, setShowModalRenovacao] = useState(false)
  const [emprestimoRenovacao, setEmprestimoRenovacao] = useState(null)
  const [senhaRenovacao, setSenhaRenovacao] = useState('')

  // ========== FUNÇÕES AUXILIARES ==========
  
  // Função para converter data sem perder 1 dia por timezone
  const formatarData = (dataString) => {
    if (!dataString) return ''
    // Converte string ISO (YYYY-MM-DD) diretamente sem timezone issues
    const [ano, mes, dia] = dataString.split('-')
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR')
  }

  // ========== CARREGAR DADOS ==========
  
  const carregarDados = async () => {
    try {
      const [livrosRes, categoriasRes, estatisticasRes] = await Promise.all([
        axios.get(`${API_URL}/livros`),
        axios.get(`${API_URL}/categorias`),
        axios.get(`${API_URL}/estatisticas`)
      ])
      
      setLivros(livrosRes.data)
      setCategorias(categoriasRes.data)
      setEstatisticas(estatisticasRes.data)
      
      if (tipoUsuario === 'admin') {
        const [membrosRes, emprestimosRes] = await Promise.all([
          axios.get(`${API_URL}/membros`),
          axios.get(`${API_URL}/emprestimos/ativos`)
        ])
        setMembros(membrosRes.data)
        setEmprestimosAtivos(emprestimosRes.data)
      } else if (tipoUsuario === 'membro' && usuarioLogado?.id) {
        try {
          console.log(`🔍 DEBUG: Carregando dados do membro`)
          console.log(`👤 usuarioLogado:`, usuarioLogado)
          console.log(`📝 ID do membro: ${usuarioLogado.id}`)
          const emprestimosRes = await axios.get(`${API_URL}/emprestimos/membro/${usuarioLogado.id}`)
          console.log(`✅ Resposta recebida:`, emprestimosRes.data)
          setEmprestimosDoMembro(emprestimosRes.data.emprestimos || [])
          setRenovacoesRestantes(emprestimosRes.data.renovacoes_restantes || 0)
        } catch (error) {
          console.error('❌ Erro ao carregar empréstimos do membro:', error)
          console.error('❌ Detalhes do erro:', error.response?.data)
          console.error('❌ Status do erro:', error.response?.status)
          console.error('❌ URL tentada:', `${API_URL}/emprestimos/membro/${usuarioLogado.id}`)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  useEffect(() => {
    if (tela === 'admin' || tela === 'membro') {
      console.log(`🔄 useEffect acionado: tela=${tela}, tipoUsuario=${tipoUsuario}, usuarioLogado:`, usuarioLogado)
      carregarDados()
    }
  }, [tela, tipoUsuario, usuarioLogado])

  // ========== AUTENTICAÇÃO ==========
  
  const handleLogin = async (tipo) => {
    try {
      if (tipo === 'admin') {
        const response = await axios.post(`${API_URL}/admin/login`, loginDataAdmin)
        setUsuarioLogado(response.data)
        setTipoUsuario('admin')
        setTela('admin')
        alert('✅ Login de administrador realizado com sucesso!')
      } else {
        const response = await axios.post(`${API_URL}/membros/login`, loginDataMembro)
        setUsuarioLogado(response.data)
        setTipoUsuario('membro')
        setTela('membro')
        alert('✅ Login de membro realizado com sucesso!')
      }
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Erro ao fazer login'))
    }
  }

  const handleLogout = () => {
    setUsuarioLogado(null)
    setTipoUsuario(null)
    setTela('home')
    setLoginDataAdmin({ usuario: '', senha: '' })
    setLoginDataMembro({ cpf: '', senha: '' })
  }

  // ========== CRUD LIVROS ==========
  
  const cadastrarLivro = async () => {
    try {
      if (!senhaConfirmacaoLivro) {
        alert('❌ Por favor, digite a senha do administrador para confirmar')
        return
      }
      
      await axios.post(`${API_URL}/livros`, {
        ...formLivro,
        senha_admin: senhaConfirmacaoLivro
      })
      alert('✅ Livro cadastrado com sucesso!')
      setShowModal(false)
      carregarDados()
      resetFormLivro()
      setSenhaConfirmacaoLivro('')
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Erro ao cadastrar livro'))
    }
  }

  const deletarLivro = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este livro?')) return
    
    try {
      await axios.delete(`${API_URL}/livros/${id}`)
      alert('✅ Livro removido')
      carregarDados()
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Erro ao deletar'))
    }
  }

  // ========== CRUD MEMBROS ==========
  
  const cadastrarMembro = async () => {
    try {
      await axios.post(`${API_URL}/membros/cadastrar`, formMembro)
      alert('✅ Membro cadastrado!')
      setShowModal(false)
      carregarDados()
      resetFormMembro()
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Erro ao cadastrar'))
    }
  }

  // ========== EMPRÉSTIMOS ==========
  
  const realizarEmprestimo = async () => {
    try {
      if (!senhaConfirmacaoEmprestimo) {
        alert('❌ Por favor, digite a senha do membro para confirmar')
        return
      }
      
      await axios.post(`${API_URL}/emprestimos`, {
        ...formEmprestimo,
        senha_membro: senhaConfirmacaoEmprestimo
      })
      alert('✅ Empréstimo realizado!')
      setShowModal(false)
      carregarDados()
      resetFormEmprestimo()
      setSenhaConfirmacaoEmprestimo('')
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Erro ao emprestar'))
    }
  }

  const devolverLivro = async (emprestimoId) => {
    if (!confirm('Confirmar devolução?')) return
    
    try {
      await axios.post(`${API_URL}/emprestimos/devolver`, {
        emprestimo_id: emprestimoId,
        condicao_devolucao: 'bom',
        responsavel: 'Administrador'
      })
      alert('✅ Devolução registrada!')
      carregarDados()
    } catch (error) {
      alert('❌ Erro ao devolver')
    }
  }

  const renovarEmprestimo = async () => {
    if (!senhaRenovacao) {
      alert('❌ Por favor, digite sua senha para confirmar')
      return
    }
    
    if (!emprestimoRenovacao) {
      alert('❌ Erro ao processar renovação')
      return
    }
    
    try {
      await axios.post(`${API_URL}/emprestimos/renovar`, {
        emprestimo_id: emprestimoRenovacao.id,
        membro_id: usuarioLogado.id,
        senha_membro: senhaRenovacao
      })
      alert('✅ Empréstimo renovado por mais 7 dias!')
      setShowModalRenovacao(false)
      setSenhaRenovacao('')
      setEmprestimoRenovacao(null)
      carregarDados()
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Erro ao renovar empréstimo'))
    }
  }

  // ========== RESET FORMS ==========
  
  const resetFormLivro = () => {
    setFormLivro({
      titulo: '', autor: '', editora: '', isbn: '', ano_publicacao: '',
      categoria_id: '', quantidade_total: 1, localizacao: '', descricao: ''
    })
  }

  const resetFormMembro = () => {
    setFormMembro({
      nome: '', cpf: '', email: '', telefone: '', endereco: '', data_batismo: '', cargo: 'Membro', max_emprestimos: 3, senha: ''
    })
  }

  const resetFormEmprestimo = () => {
    setFormEmprestimo({
      livro_id: '', membro_id: '', dias_emprestimo: 14, responsavel: 'Administrador'
    })
    setBuscaLivroModal('')
    setBuscaMembroModal('')
    setSenhaConfirmacaoEmprestimo('')
  }

  // ========== FILTROS ==========
  
  const livrosFiltrados = livros.filter(livro => {
    const matchBusca = busca === '' || 
      livro.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      livro.autor.toLowerCase().includes(busca.toLowerCase())
    
    const matchCategoria = categoriaFiltro === '' || 
      livro.categoria_id === parseInt(categoriaFiltro)
    
    return matchBusca && matchCategoria
  })

  const emprestimosAtivosFilrados = emprestimosAtivos.filter(emp => {
    if (buscaEmprestimos === '') return true
    
    const searchTerm = buscaEmprestimos.toLowerCase()
    return (
      emp.livro.toLowerCase().includes(searchTerm) ||
      emp.membro.toLowerCase().includes(searchTerm)
    )
  })

  // ========================================
  // TELA HOME
  // ========================================
  
  if (tela === 'home') {
    return (
      <div className="container-principal">
        <header className="header-home">
          <div className="logo-biblioteca">
            <h1>📚 Biblioteca DuBom</h1>
            <p>Sistema de Gerenciamento de Acervo</p>
          </div>
        </header>

        <div className="cards-login">
          <div className="card-acesso" onClick={() => setTela('login-admin')}>
            <div className="icone">🔐</div>
            <h3>Administrador</h3>
            <p>Acesso completo ao sistema</p>
          </div>

          <div className="card-acesso" onClick={() => setTela('login-membro')}>
            <div className="icone">👤</div>
            <h3>Membro</h3>
            <p>Consultar livros e histórico</p>
          </div>
        </div>
      </div>
    )
  }

  // ========================================
  // TELA LOGIN ADMIN
  // ========================================
  
  if (tela === 'login-admin') {
    return (
      <div className="container-principal">
        <div className="form-login">
          <button className="btn-voltar" onClick={() => setTela('home')}>← Voltar</button>
          <h2>Login Administrador</h2>
          <input
            type="text"
            placeholder="Usuário"
            value={loginDataAdmin.usuario}
            onChange={(e) => setLoginDataAdmin({ ...loginDataAdmin, usuario: e.target.value })}
          />
          <input
            type="password"
            placeholder="Senha"
            value={loginDataAdmin.senha}
            onChange={(e) => setLoginDataAdmin({ ...loginDataAdmin, senha: e.target.value })}
          />
          <button className="btn-primario" onClick={() => handleLogin('admin')}>
            Entrar
          </button>
        </div>
      </div>
    )
  }

  // ========================================
  // TELA LOGIN MEMBRO
  // ========================================
  
  if (tela === 'login-membro') {
    return (
      <div className="container-principal">
        <div className="form-login">
          <button className="btn-voltar" onClick={() => setTela('home')}>← Voltar</button>
          <h2>Login Membro</h2>
          <input
            type="text"
            placeholder="CPF (apenas números)"
            maxLength="11"
            value={loginDataMembro.cpf}
            onChange={(e) => setLoginDataMembro({ ...loginDataMembro, cpf: e.target.value })}
          />
          <input
            type="password"
            placeholder="Senha"
            value={loginDataMembro.senha}
            onChange={(e) => setLoginDataMembro({ ...loginDataMembro, senha: e.target.value })}
          />
          <button className="btn-primario" onClick={() => handleLogin('membro')}>
            Entrar
          </button>
        </div>
      </div>
    )
  }

  // ========================================
  // TELA ADMIN
  // ========================================
  
  if (tela === 'admin') {
    return (
      <div className="dashboard">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>📚 Biblioteca</h2>
            <p>{usuarioLogado?.nome}</p>
          </div>
          
          <nav className="sidebar-nav">
            <button className="nav-item active">📊 Dashboard</button>
            <button className="nav-item" onClick={() => {
              setShowModal(true)
              setModalTipo('livro')
              setSenhaConfirmacaoLivro('')
            }}>➕ Novo Livro</button>
            <button className="nav-item" onClick={() => {
              setShowModal(true)
              setModalTipo('membro')
            }}>👤 Novo Membro</button>
            <button className="nav-item" onClick={() => {
              setShowModal(true)
              setModalTipo('emprestimo')
              setSenhaConfirmacaoEmprestimo('')
            }}>📤 Emprestar</button>
          </nav>

          <button className="btn-sair" onClick={handleLogout}>🚪 Sair</button>
        </aside>

        {/* Conteúdo Principal */}
        <main className="conteudo-principal">
          {/* Estatísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div>
                <h3>{estatisticas.total_livros}</h3>
                <p>Total de Livros</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div>
                <h3>{estatisticas.livros_disponiveis}</h3>
                <p>Disponíveis</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📤</div>
              <div>
                <h3>{estatisticas.emprestimos_ativos}</h3>
                <p>Emprestados</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div>
                <h3>{estatisticas.emprestimos_atrasados}</h3>
                <p>Atrasados</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filtros">
            <input
              type="text"
              placeholder="🔍 Buscar por título ou autor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-busca"
            />
            <select 
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="select-categoria"
            >
              <option value="">Todas as Categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {/* Lista de Livros */}
          <div className="secao">
            <h2>📚 Acervo ({livrosFiltrados.length})</h2>
            <div className="livros-grid">
              {livrosFiltrados.map(livro => (
                <div key={livro.id} className="livro-card">
                  <div className="livro-header">
                    <h3>{livro.titulo}</h3>
                    <button 
                      className="btn-deletar"
                      onClick={() => deletarLivro(livro.id)}
                    >🗑️</button>
                  </div>
                  <p className="livro-autor">✍️ {livro.autor}</p>
                  <p className="livro-info">📖 {livro.categoria || 'Sem categoria'}</p>
                  <p className="livro-info">📍 {livro.localizacao || 'Não informado'}</p>
                  <div className="livro-disponibilidade">
                    <span className={livro.quantidade_disponivel > 0 ? 'disponivel' : 'indisponivel'}>
                      {livro.quantidade_disponivel > 0 ? '✅ Disponível' : '❌ Indisponível'}
                    </span>
                    <span>{livro.quantidade_disponivel}/{livro.quantidade_total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empréstimos Ativos */}
          <div className="secao">
            <h2>📤 Empréstimos Ativos ({emprestimosAtivosFilrados.length})</h2>
            <div className='filtros'>
              <input
                type="text"
                placeholder="🔍 Buscar por livro ou membro..."
                value={buscaEmprestimos}
                onChange={(e) => setBuscaEmprestimos(e.target.value)}
                className="input-busca"
              />
            </div>
            <div className="tabela-container">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Livro</th>
                    <th>Membro</th>
                    <th>Empréstimo</th>
                    <th>Devolução</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {emprestimosAtivosFilrados.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.livro}</td>
                      <td>{emp.membro}</td>
                      <td>{formatarData(emp.data_emprestimo)}</td>
                      <td>{formatarData(emp.data_prevista_devolucao)}</td>
                      <td>
                        <span className={`badge ${emp.situacao === 'Atrasado' ? 'atrasado' : 'ok'}`}>
                          {emp.situacao}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-acao"
                          onClick={() => devolverLivro(emp.id)}
                        >Devolver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={() => {
            setShowModal(false)
            setSenhaConfirmacaoLivro('')
            setSenhaConfirmacaoEmprestimo('')
          }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Livro */}
              {modalTipo === 'livro' && (
                <>
                  <h2>➕ Cadastrar Livro</h2>
                  <input placeholder="Título *" value={formLivro.titulo} onChange={(e) => setFormLivro({...formLivro, titulo: e.target.value})} />
                  <input placeholder="Autor *" value={formLivro.autor} onChange={(e) => setFormLivro({...formLivro, autor: e.target.value})} />
                  <input placeholder="Editora" value={formLivro.editora} onChange={(e) => setFormLivro({...formLivro, editora: e.target.value})} />
                  <input placeholder="ISBN" maxLength={13} value={formLivro.isbn} onChange={(e) => setFormLivro({...formLivro, isbn: e.target.value})} />
                  <input type="number" placeholder="Ano" value={formLivro.ano_publicacao} onChange={(e) => setFormLivro({...formLivro, ano_publicacao: e.target.value})} />
                  <select value={formLivro.categoria_id} onChange={(e) => setFormLivro({...formLivro, categoria_id: e.target.value})}>
                    <option value="">Selecione Categoria</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                  </select>
                  <input type="number" placeholder="Quantidade" value={formLivro.quantidade_total} onChange={(e) => setFormLivro({...formLivro, quantidade_total: e.target.value})} />
                  <input placeholder="Localização (Ex: Estante A)" value={formLivro.localizacao} onChange={(e) => setFormLivro({...formLivro, localizacao: e.target.value})} />
                  <input type="password" placeholder="🔒 Senha do Administrador *" value={senhaConfirmacaoLivro} onChange={(e) => setSenhaConfirmacaoLivro(e.target.value)} />
                  <div className="modal-acoes">
                    <button className="btn-secundario" onClick={() => {
                      setShowModal(false)
                      setSenhaConfirmacaoLivro('')
                    }}>Cancelar</button>
                    <button className="btn-primario" onClick={cadastrarLivro}>Cadastrar</button>
                  </div>
                </>
              )}

              {/* Modal Membro */}
              {modalTipo === 'membro' && (
                <>
                  <h2>👤 Cadastrar Membro</h2>
                  <input placeholder="Nome Completo *" value={formMembro.nome} onChange={(e) => setFormMembro({...formMembro, nome: e.target.value})} />
                  <input placeholder="CPF *" maxLength="11" value={formMembro.cpf} onChange={(e) => setFormMembro({...formMembro, cpf: e.target.value})} />
                  <input type="email" placeholder="Email" value={formMembro.email} onChange={(e) => setFormMembro({...formMembro, email: e.target.value})} />
                  <input placeholder="Telefone" value={formMembro.telefone} onChange={(e) => setFormMembro({...formMembro, telefone: e.target.value})} />
                  <input placeholder="Endereço" value={formMembro.endereco} onChange={(e) => setFormMembro({...formMembro, endereco: e.target.value})} />
                  <input type="date" placeholder="Data de Batismo" value={formMembro.data_batismo} onChange={(e) => setFormMembro({...formMembro, data_batismo: e.target.value})} />
                  <select value={formMembro.cargo} onChange={(e) => setFormMembro({...formMembro, cargo: e.target.value})}>
                    <option value="Membro">Membro</option>
                    <option value="Professor EBD">Professor EBD</option>
                    <option value="Diácono">Diácono</option>
                    <option value="Pastor">Pastor</option>
                  </select>
                  <input type="number" placeholder="Máximo de Empréstimos" min="1" max="10" value={formMembro.max_emprestimos} onChange={(e) => setFormMembro({...formMembro, max_emprestimos: e.target.value})} />
                  <input type="password" placeholder="Senha (8 dígitos)" maxLength="8" value={formMembro.senha} onChange={(e) => setFormMembro({...formMembro, senha: e.target.value})} />
                  <div className="modal-acoes">
                    <button className="btn-secundario" onClick={() => setShowModal(false)}>Cancelar</button>
                    <button className="btn-primario" onClick={cadastrarMembro}>Cadastrar</button>
                  </div>
                </>
              )}

              {/* Modal Empréstimo */}
              {modalTipo === 'emprestimo' && (
                <>
                  <h2>📤 Realizar Empréstimo</h2>
                  <div className="busca-livro-container">
                    <input
                      type="text"
                      placeholder="🔍 Digite o nome do livro..."
                      value={buscaLivroModal}
                      onChange={(e) => setBuscaLivroModal(e.target.value)}
                      className="input-busca-livro"
                    />
                    {buscaLivroModal && (
                      <div className="sugestoes-livro">
                        {livros
                          .filter(l => l.quantidade_disponivel > 0 && l.titulo.toLowerCase().includes(buscaLivroModal.toLowerCase()))
                          .map(livro => (
                            <div
                              key={livro.id}
                              className="sugestao-item"
                              onClick={() => {
                                setFormEmprestimo({...formEmprestimo, livro_id: livro.id})
                                setBuscaLivroModal('')
                              }}
                            >
                              {livro.titulo} ({livro.quantidade_disponivel} disp.)
                            </div>
                          ))}
                      </div>
                    )}
                    {formEmprestimo.livro_id && (
                      <div className="livro-selecionado">
                        ✅ Livro selecionado: {livros.find(l => l.id === parseInt(formEmprestimo.livro_id))?.titulo}
                      </div>
                    )}
                  </div>
                  <div className="busca-membro-container">
                    <input
                      type="text"
                      placeholder="🔍 Digite o nome do membro..."
                      value={buscaMembroModal}
                      onChange={(e) => setBuscaMembroModal(e.target.value)}
                      className="input-busca-membro"
                    />
                    {buscaMembroModal && (
                      <div className="sugestoes-membro">
                        {membros
                          .filter(m => m.nome.toLowerCase().includes(buscaMembroModal.toLowerCase()))
                          .map(membro => (
                            <div
                              key={membro.id}
                              className="sugestao-item"
                              onClick={() => {
                                setFormEmprestimo({...formEmprestimo, membro_id: membro.id})
                                setBuscaMembroModal('')
                              }}
                            >
                              {membro.nome} - {membro.cargo}
                            </div>
                          ))}
                      </div>
                    )}
                    {formEmprestimo.membro_id && (
                      <div className="membro-selecionado">
                      ✅ Membro selecionado: {membros.find(m => m.id === parseInt(formEmprestimo.membro_id))?.nome}
                      </div>
                    )}
                  </div>
                  <input type="number" placeholder="⏰ Dias de Empréstimo (máx. 30 dias)" min="1" max="30" value={formEmprestimo.dias_emprestimo} onChange={(e) => setFormEmprestimo({...formEmprestimo, dias_emprestimo: e.target.value})} />
                  <input type="password" placeholder="🔒 Senha do Membro *" value={senhaConfirmacaoEmprestimo} onChange={(e) => setSenhaConfirmacaoEmprestimo(e.target.value)} />
                  <div className="modal-acoes">
                    <button className="btn-secundario" onClick={() => {
                      setShowModal(false)
                      setSenhaConfirmacaoEmprestimo('')
                    }}>Cancelar</button>
                    <button className="btn-primario" onClick={realizarEmprestimo}>Emprestar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ========================================
  // TELA MEMBRO
  // ========================================
  
  if (tela === 'membro') {
    // Função auxiliar para calcular status do empréstimo
    const getStatusEmprestimo = (dataDevolucao) => {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0) // Zera hora para comparação justa
      
      // Converte string ISO para data local
      const [ano, mes, dia] = dataDevolucao.split('-')
      const dataDevol = new Date(ano, mes - 1, dia)
      dataDevol.setHours(0, 0, 0, 0)
      
      const diasRestantes = Math.ceil((dataDevol - hoje) / (1000 * 60 * 60 * 24))
      
      if (diasRestantes < 0) {
        return { status: 'Atrasado', dias: Math.abs(diasRestantes), classe: 'atrasado' }
      } else if (diasRestantes <= 3) {
        return { status: 'Vencendo em breve', dias: diasRestantes, classe: 'alerta' }
      } else {
        return { status: 'No prazo', dias: diasRestantes, classe: 'ok' }
      }
    }

    return (
      <div className="dashboard-membro">
        <header className="header-membro">
          <h1>📚 Biblioteca - {usuarioLogado?.nome}</h1>
          <button className="btn-sair" onClick={handleLogout}>Sair</button>
        </header>

        <div className="container-membro">
          {/* Empréstimos Ativos */}
          <div className="secao">
            <h2>📤 Meus Empréstimos ({emprestimosDoMembro.length})</h2>
            {emprestimosDoMembro.length === 0 ? (
              <p className="sem-dados">Você não tem nenhum livro alugado no momento.</p>
            ) : (
              <div className="tabela-container">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Livro</th>
                      <th>Data Empréstimo</th>
                      <th>Data Devolução</th>
                      <th>Status</th>
                      <th>Dias Restantes</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emprestimosDoMembro.map(emp => {
                      const statusInfo = getStatusEmprestimo(emp.data_prevista_devolucao)
                      return (
                        <tr key={emp.id}>
                          <td><strong>{emp.livro}</strong></td>
                          <td>{formatarData(emp.data_emprestimo)}</td>
                          <td>{formatarData(emp.data_prevista_devolucao)}</td>
                          <td>
                            <span className={`badge ${statusInfo.classe}`}>
                              {statusInfo.status}
                            </span>
                          </td>
                          <td className={statusInfo.classe}>
                            {statusInfo.dias} dia{statusInfo.dias !== 1 ? 's' : ''}
                          </td>
                          <td>
                            <button 
                              className="btn-acao"
                              onClick={() => {
                                setEmprestimoRenovacao(emp)
                                setShowModalRenovacao(true)
                                setSenhaRenovacao('')
                              }}
                              disabled={renovacoesRestantes === 0}
                              title={renovacoesRestantes === 0 ? 'Sem renovações disponíveis' : 'Renovar por 7 dias'}
                            >
                              🔄 Renovar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="info-renovacao">
                  💫 Renovações disponíveis: <strong>{renovacoesRestantes}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Busca de Livros */}
          <div className="secao">
            <h2>📚 Consultar Livros Disponíveis</h2>
            <div className="filtros">
              <input
                type="text"
                placeholder="🔍 Buscar livros..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input-busca"
              />
            </div>

            <div className="livros-grid">
              {livrosFiltrados.filter(l => l.quantidade_disponivel > 0).map(livro => (
                <div key={livro.id} className="livro-card">
                  <h3>{livro.titulo}</h3>
                  <p className="livro-autor">✍️ {livro.autor}</p>
                  <p className="livro-info">📖 {livro.categoria}</p>
                  <span className="disponivel">✅ Disponível ({livro.quantidade_disponivel})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL RENOVAÇÃO */}
        {showModalRenovacao && emprestimoRenovacao && (
          <div className="modal-overlay" onClick={() => {
            setShowModalRenovacao(false)
            setSenhaRenovacao('')
            setEmprestimoRenovacao(null)
          }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>🔄 Renovar Empréstimo</h2>
              <div className="info-renovacao-modal">
                <p><strong>Livro:</strong> {emprestimoRenovacao.livro}</p>
                <p><strong>Data de Devolução Atual:</strong> {formatarData(emprestimoRenovacao.data_prevista_devolucao)}</p>
                <p><strong>Renovação por:</strong> 7 dias</p>
                <p><strong>Renovações disponíveis:</strong> {renovacoesRestantes}</p>
              </div>
              <input 
                type="password" 
                placeholder="🔒 Sua Senha *" 
                value={senhaRenovacao} 
                onChange={(e) => setSenhaRenovacao(e.target.value)}
              />
              <div className="modal-acoes">
                <button 
                  className="btn-secundario" 
                  onClick={() => {
                    setShowModalRenovacao(false)
                    setSenhaRenovacao('')
                    setEmprestimoRenovacao(null)
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primario" 
                  onClick={renovarEmprestimo}
                  disabled={renovacoesRestantes === 0}
                >
                  Renovar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default App