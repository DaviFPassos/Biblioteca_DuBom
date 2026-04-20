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
          console.log(`<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M336.5-561Q278-620 278-704.5T336.34-847q58.34-58 143.5-58t143.66 58Q682-789 682-704.5T623.66-561q-58.34 59-143.5 59T336.5-561ZM114-86v-159q0-46.47 23.41-84.51Q160.81-367.56 201-387q66-34 136.31-51t142.5-17Q554-455 624-438t135 50q40.19 19.44 63.59 56.99Q846-293.47 846-245v159H114Z"/></svg> usuarioLogado:`, usuarioLogado)
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
            <h1><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#EFEFEF"><path d="M484-108q-51.56-37.05-111.05-60.02Q313.45-191 248-191q-34.29 0-66.65 9.5Q149-172 117-162q-33 17-65.5-1T19-222v-459.31Q19-706 30-727q11-21 33-33 43.37-18 89.61-26.5Q198.84-795 246-795q76 0 128.5 18.5T482-721q14 10 21.5 25t7.5 31v442q50.2-25 98.41-37.5Q657.62-273 711.83-273q38.17 0 78.17 6t69 16v-521q8.98 3.41 18.99 6.21Q888-763 896-760q22 12 33.5 33t11.5 46v470q0 37-33 53t-66-4q-31-11-63.45-20t-66.85-9q-61.7 0-119.2 23.98Q535-143.05 484-108Zm127-271v-468l148-55v469l-148 54Z"/></svg> Biblioteca DuBom</h1>
            <p>Sistema de Gerenciamento de Acervo</p>
          </div>
        </header>

        <div className="cards-login">
          <div className="card-acesso" onClick={() => setTela('login-admin')}>
            <div className="icone"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M224-62q-36.1 0-64.05-26.96Q132-115.91 132-153v-415q0-37.5 27.95-64.75T224-660h52v-71q0-89.87 57.13-146.94Q390.25-935 473.63-935 557-935 615-877t58 146v71h52q36.1 0 64.05 27.25Q817-605.5 817-568v94q-20-4-43.91-3.5-23.91.5-48.09 4.5-85 19-143 88.2t-58 157.71q0 44.56 16.96 87.86Q557.92-95.92 586-62H224Zm416-31.04q-56-56.04-56-134Q584-305 640.04-361q56.04-56 134-56Q852-417 908-360.96q56 56.04 56 134Q964-149 907.96-93q-56.04 56-134 56Q696-37 640-93.04ZM367-660h215v-71q0-49-30.76-80.5-30.77-31.5-77.06-31.5-46.3 0-76.74 31.33Q367-780.33 367-731v71Zm454.5 403.71Q842-275.59 842-304t-20.5-47.21Q801-370 773.59-370q-26.41 0-45.5 19.15T709-304.21q0 28.5 19 47.86Q747-237 774-237t47.5-19.29Zm14.73 136.79Q865-135 883-163q-25-13-52.18-22-27.19-9-55.86-9-28.67 0-56.51 9-27.84 9-53.45 22 19 28 47.68 43.5 28.67 15.5 61.73 15.5 33.05 0 61.82-15.5Z"/></svg></div>
            <h3>Administrador</h3>
            <p>Acesso completo ao sistema</p>
          </div>

          <div className="card-acesso" onClick={() => setTela('login-membro')}>
            <div className="icone"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M353.8-542.8q-48.8-48.79-48.8-126 0-77.2 48.8-126.2 48.79-49 126-49 77.2 0 126.7 49T656-668.8q0 77.21-49.5 126Q557-494 479.8-494q-77.21 0-126-48.8ZM135-122v-120.79q0-44.21 22.63-77.63Q180.27-353.83 217-371q69-31 133.5-46.5T479.73-433q66.73 0 130.5 16Q674-401 742-371q38 16 61 49.5t23 78.5v121H135Z"/></svg></div>
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
            <h2 style={{ color: '#8C1AF6' }}><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M452-222v-427q-45-30-97.62-46.5Q301.76-712 248-712q-38 0-74.5 9.5T100-679v434q31-14 70.5-20.5T248-272q53.57 0 104.28 12.5Q403-247 452-222Zm32.18 117Q432-142 372.33-165.5 312.65-189 248-189q-34.15 0-67.07 9.5Q148-170 115-159q-33.1 17-65.55-2.16Q17-180.32 17-219v-462q0-25 11-46.3 11-21.3 33-32.7 44-19.5 90.39-27.75Q197.79-796 246-796q73.83 0 126.92 19Q426-758 481-722q14 10 22.5 26t8.5 33v441q50-25.01 98-37.53 48-12.53 102-12.53 38 0 78.5 6.02Q831-260.03 860-250v-523q8.89 3.65 18.94 6.82Q889-763 898-760q22 11.4 33.5 32.7Q943-706 943-681v473q0 36.94-33 52.97T844-159q-32-12-64.93-21-32.92-9-67.07-9-63.22 0-119.93 24.5Q535.36-140 484.18-105ZM612-382v-467.83L760-906v470l-148 54Zm-336-85Z"/></svg> Biblioteca </h2>
            <p>{usuarioLogado?.nome}</p>
          </div>
          
          <nav className="sidebar-nav">

            <button className="nav-item" onClick={() => {
              setShowModal(true)
              setModalTipo('livro')
              setSenhaConfirmacaoLivro('')
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#8C1AF6"><path d="M543-423h80v-120h120v-80H623v-120h-80v120H423v80h120v120ZM355-229q-53 0-89.5-36.5T229-355v-456q0-53 36.5-89.5T355-937h456q53 0 89.5 36.5T937-811v456q0 53-36.5 89.5T811-229H355ZM149-23q-53 0-89.5-36.5T23-149v-582h126v582h582v126H149Z"/></svg> Novo Livro</button>
            <button className="nav-item" onClick={() => {
              setShowModal(true)
              setModalTipo('membro')
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#8C1AF6"><path d="M336.5-561Q278-620 278-704.5T336.34-847q58.34-58 143.5-58t143.66 58Q682-789 682-704.5T623.66-561q-58.34 59-143.5 59T336.5-561ZM114-86v-159q0-46.47 23.41-84.51Q160.81-367.56 201-387q66-34 136.31-51t142.5-17Q554-455 624-438t135 50q40.19 19.44 63.59 56.99Q846-293.47 846-245v159H114Z"/></svg> Novo Membro</button>
            <button className="nav-item" onClick={() => {
              setShowModal(true)
              setModalTipo('emprestimo')
              setSenhaConfirmacaoEmprestimo('')
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#8C1AF6"><path d="M212-86q-53 0-89.5-36.5T86-212v-536q0-53 36.5-89.5T212-874h536q53 0 89.5 36.5T874-748v536q0 53-36.5 89.5T748-86H212Zm337-262q31-22 43-58h156v-342H212v342h156q12 36 43 58t69 22q38 0 69-22Zm-109-46v-172l-66 66-56-56 162-162 162 162-56 56-66-66v172h-80Z"/></svg> Emprestar</button>
          </nav>

          <button className="btn-sair" onClick={handleLogout}> Sair</button>
        </aside>

        {/* Conteúdo Principal */}
        <main className="conteudo-principal">
          {/* Estatísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M70-151v-73h820v73H70Zm85-164v-332h73v332h-73Zm164 0v-497h73v497h-73Zm163 0v-497h73v497h-73Zm287 0L596-609l65-36 170 293-62 37Z"/></svg></div>
              <div>
                <h3>{estatisticas.total_livros}</h3>
                <p>Total de Livros</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M438-220.62 289.85-368.77l60.38-60.38L438-341.38l173.77-173.77 60.38 60.38L438-220.62ZM206.31-70q-41.03 0-69.67-28.64T108-168.31v-547.38q0-41.03 28.64-69.67T206.31-814h23.38v-80.61h87.54V-814h327.08v-80.61h86V-814h23.38q41.03 0 69.67 28.64T852-715.69v547.38q0 41.03-28.64 69.67T753.69-70H206.31Zm0-86h547.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-399.38H194v399.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85Z"/></svg></div>
              <div>
                <h3>{estatisticas.livros_disponiveis}</h3>
                <p>Disponíveis</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M212-86q-53 0-89.5-36.5T86-212v-536q0-53 36.5-89.5T212-874h536q53 0 89.5 36.5T874-748v536q0 53-36.5 89.5T748-86H212Zm337-262q31-22 43-58h156v-342H212v342h156q12 36 43 58t69 22q38 0 69-22Zm-109-46v-172l-66 66-56-56 162-162 162 162-56 56-66-66v172h-80Z"/></svg></div>
              <div>
                <h3>{estatisticas.emprestimos_ativos}</h3>
                <p>Emprestados</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M334-97q-68-29-119-80t-80.5-119Q105-364 105-442q0-77 29.5-145.5T215-707q51-51 119-80.5T479.5-817q77.5 0 145.5 29.5T744-707q51 51 80.5 119.5T854-442q0 78-29.5 146T744-177q-51 51-119 80T479.5-68Q402-68 334-97Zm263-176 51-51-129-129v-190h-73v219l151 151ZM208-885l51 51L84-665l-51-51 175-169Zm543 0 175 169-51 51-175-169 51-51Z"/></svg></div>
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
              placeholder= "Buscar por título ou autor..."
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
            <h2><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M480-111q-68-55-151-87.5T156-239v-365q96 7 178.5 47.5T480-461q63-55 145.5-95.5T804-604v365q-90 8-173 40.5T480-111Zm-90.5-545Q352-693 352-747.5t37.5-92Q427-877 481-877t91.5 37.5q37.5 37.5 37.5 92T572.5-656Q535-619 481-619t-91.5-37Z"/></svg> Acervo ({livrosFiltrados.length})</h2>
            <div className="livros-grid">
              {livrosFiltrados.map(livro => (
                <div key={livro.id} className="livro-card">
                  <div className="livro-header">
                    <h3>{livro.titulo}</h3>
                    <button 
                      className="btn-deletar"
                      onClick={() => deletarLivro(livro.id)}
                    ><svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white"><path d="M267-74q-55.73 0-95.86-39.44Q131-152.88 131-210v-501H68v-136h268v-66h287v66h269v136h-63v501q0 57.12-39.44 96.56Q750.13-74 693-74H267Zm67-205h113v-363H334v363Zm180 0h113v-363H514v363Z"/></svg></button>
                  </div>
                  <p className="livro-autor">Autor: {livro.autor}</p>
                  <p className="livro-info">Tipo: {livro.categoria || 'Sem categoria'}</p>
                  <p className="livro-info">📍 {livro.localizacao || 'Não informado'}</p>
                  <div className="livro-disponibilidade">
                    <span className={livro.quantidade_disponivel > 0 ? 'disponivel' : 'indisponivel'}>
                      {livro.quantidade_disponivel > 0 ? 'Livro Disponível' : 'Livro Indisponível'}
                    </span>
                    <span>{livro.quantidade_disponivel}/{livro.quantidade_total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empréstimos Ativos */}
          <div className="secao">
            <h2><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#8C1AF6"><path d="M212-86q-53 0-89.5-36.5T86-212v-536q0-53 36.5-89.5T212-874h536q53 0 89.5 36.5T874-748v536q0 53-36.5 89.5T748-86H212Zm337-262q31-22 43-58h156v-342H212v342h156q12 36 43 58t69 22q38 0 69-22Zm-109-46v-172l-66 66-56-56 162-162 162 162-56 56-66-66v172h-80Z"/></svg> Empréstimos Ativos ({emprestimosAtivosFilrados.length})</h2>
            <div className='filtros'>
              <input
                type="text"
                placeholder="Buscar por livro ou membro..."
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
                  <h2><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M336.5-561Q278-620 278-704.5T336.34-847q58.34-58 143.5-58t143.66 58Q682-789 682-704.5T623.66-561q-58.34 59-143.5 59T336.5-561ZM114-86v-159q0-46.47 23.41-84.51Q160.81-367.56 201-387q66-34 136.31-51t142.5-17Q554-455 624-438t135 50q40.19 19.44 63.59 56.99Q846-293.47 846-245v159H114Z"/></svg> Cadastrar Membro</h2>
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
          <h1><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M484-108q-51.56-37.05-111.05-60.02Q313.45-191 248-191q-34.29 0-66.65 9.5Q149-172 117-162q-33 17-65.5-1T19-222v-459.31Q19-706 30-727q11-21 33-33 43.37-18 89.61-26.5Q198.84-795 246-795q76 0 128.5 18.5T482-721q14 10 21.5 25t7.5 31v442q50.2-25 98.41-37.5Q657.62-273 711.83-273q38.17 0 78.17 6t69 16v-521q8.98 3.41 18.99 6.21Q888-763 896-760q22 12 33.5 33t11.5 46v470q0 37-33 53t-66-4q-31-11-63.45-20t-66.85-9q-61.7 0-119.2 23.98Q535-143.05 484-108Zm127-271v-468l148-55v469l-148 54Z"/></svg> Biblioteca - {usuarioLogado?.nome}</h1>
          <button className="btn-sair" onClick={handleLogout}>Sair</button>
        </header>

        <div className="container-membro">
          {/* Empréstimos Ativos */}
          <div className="secao">
            <h2><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#8C1AF6"><path d="M212-86q-53 0-89.5-36.5T86-212v-536q0-53 36.5-89.5T212-874h536q53 0 89.5 36.5T874-748v536q0 53-36.5 89.5T748-86H212Zm337-262q31-22 43-58h156v-342H212v342h156q12 36 43 58t69 22q38 0 69-22Zm-109-46v-172l-66 66-56-56 162-162 162 162-56 56-66-66v172h-80Z"/></svg> Meus Empréstimos ({emprestimosDoMembro.length})</h2>
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
                              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EFEFEF"><path d="M483-142q-134 0-232-89.5T142-454v-5l-52 52-75-75 180-180 180 180-73 75-53-53v5q8 85 74 146t160 61q29 0 55-7t49-19l78 78q-42 26-87.5 40T483-142Zm282-160L585-482l73-75 53 53v-5q-8-85-74-146t-160-61q-29 0-55 7t-49 19l-78-78q42-26 87.5-40t94.5-14q134 0 232 89.5T818-510v5l52-52 75 75-180 180Z"/></svg> Renovar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="info-renovacao">
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#8C1AF6"><path d="M327.5-71Q256-102 203-155t-84-124.5Q88-351 88-432h106q0 119 83.5 202.5T480-146q119 0 202.5-83.5T766-432q0-119-83.5-202.5T480-718l60 60-74 78-190-190 190-190 74 76-60 60q81 0 152.5 31T757-709q53 53 84 124.5T872-432q0 81-31 152.5T757-155q-53 53-124.5 84T480-40q-81 0-152.5-31Z"/></svg> Renovações disponíveis: <strong>{renovacoesRestantes}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Busca de Livros */}
          <div className="secao">
            <h2><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#8C1AF6"><path d="M484-108q-51.56-37.05-111.05-60.02Q313.45-191 248-191q-34.29 0-66.65 9.5Q149-172 117-162q-33 17-65.5-1T19-222v-459.31Q19-706 30-727q11-21 33-33 43.37-18 89.61-26.5Q198.84-795 246-795q76 0 128.5 18.5T482-721q14 10 21.5 25t7.5 31v442q50.2-25 98.41-37.5Q657.62-273 711.83-273q38.17 0 78.17 6t69 16v-521q8.98 3.41 18.99 6.21Q888-763 896-760q22 12 33.5 33t11.5 46v470q0 37-33 53t-66-4q-31-11-63.45-20t-66.85-9q-61.7 0-119.2 23.98Q535-143.05 484-108Zm127-271v-468l148-55v469l-148 54Z"/></svg> Consultar Livros Disponíveis</h2>
            <div className="filtros">
              <input
                type="text"
                placeholder="Buscar livros..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input-busca"
              />
            </div>

            <div className="livros-grid">
              {livrosFiltrados.filter(l => l.quantidade_disponivel > 0).map(livro => (
                <div key={livro.id} className="livro-card">
                  <h3>{livro.titulo}</h3>
                  <p className="livro-autor">Autor: {livro.autor}</p>
                  <p className="livro-info">Tipo: {livro.categoria}</p>
                  <span className="disponivel"> Disponível ({livro.quantidade_disponivel})</span>
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
              <h2><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#EFEFEF"><path d="M483-142q-134 0-232-89.5T142-454v-5l-52 52-75-75 180-180 180 180-73 75-53-53v5q8 85 74 146t160 61q29 0 55-7t49-19l78 78q-42 26-87.5 40T483-142Zm282-160L585-482l73-75 53 53v-5q-8-85-74-146t-160-61q-29 0-55 7t-49 19l-78-78q42-26 87.5-40t94.5-14q134 0 232 89.5T818-510v5l52-52 75 75-180 180Z"/></svg> Renovar Empréstimo</h2>
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