import { useState, useEffect } from 'react';
import { Send, AlertTriangle, FileText, MapPin, Hash, Info, Save, Trash2, Edit2, History, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Report {
  id: string;
  type: 'simples' | 'especial';
  data: {
    codigo?: string;
    tipo?: string;
    descricao?: string;
    local?: string;
    items?: { codigo: string, local: string }[];
  };
  timestamp: number;
}

const CODIGOS_OPCOES = [
  "1 Acompanhamento de alunos",
  "2 Apoio em obras",
  "3 Apoio em eventos",
  "4 Apoio ao agente de trânsito",
  "5 Acompanhamento de veículos (escolta)",
  "6 Fiscalização de caminhão",
  "7 COI",
  "8 Ação educativa",
  "9 Autorização de Caçamba/Caminhão",
  "10 Apoio órgão público/EDP/Telefonia",
  "11 Monitoramento",
  "12 Sinistro de trânsito sem vítima",
  "13 Sinistro de trânsito com vítima",
  "14 Animais na pista",
  "15 Trabalho administrativo",
  "16 Transporte interno",
  "17 Solicitação de munícipe",
  "18 Operação em semáforo",
  "19 Fiscalização em circulação",
  "20 Apoio a veículo quebrado",
  "21 Travessia de alunos",
  "22 Apoio a feira livre",
  "23 Desvio de trânsito",
  "24 Deslocamento ao centro do servidor",
  "25 Apoio a eventos religiosos",
  "26 Aferição de radar",
  "27 Autorizar veículos a passar no vermelho",
  "28 Manutenção da VTR",
  "29 Obra SAAE",
  "30 Remoção de veículo",
  "31 Remoção de veículo abandonado",
  "32 Apoio a pintura",
  "33 Apoio a poda de árvore",
  "34 Apoio a troca de poste/Recolha de fios caídos",
  "35 Deslocamento para diretoria de trânsito",
  "36 Deslocamento limpar VTR",
  "37 Blitz",
  "38 Fiscalização em extensão",
  "39 Controle de fluxo",
  "40 Fiscalização em ponto fixo",
  "41 Posturas",
  "42 Vistoria"
];

const SETORES_INICIAIS = Array.from({ length: 15 }, (_, i) => `Setor ${i + 1}`);

export default function App() {
  const [activeTab, setActiveTab] = useState<'simples' | 'especial' | 'historico'>('simples');
  
  // UI States
  const [showConfirm, setShowConfirm] = useState<{ id: string } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Form States
  const [simplesInput, setSimplesInput] = useState({ 
    codigo: '', 
    local: '', 
    customCodigo: '', 
    customLocal: '' 
  });
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [newLocalName, setNewLocalName] = useState('');
  const [customLocaisOptions, setCustomLocaisOptions] = useState<string[]>([]);
  const [simplesList, setSimplesList] = useState<{ codigo: string, local: string }[]>([]);
  const [especial, setEspecial] = useState({ tipo: 'Sinistro', descricao: '', local: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // CRUD State
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Toast Auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loadData = () => {
      const savedReports = localStorage.getItem('traffic_reports');
      if (savedReports) {
        try {
          const parsed = JSON.parse(savedReports);
          setReports(parsed);
        } catch (e) {
          console.error('Erro ao carregar relatórios', e);
        }
      }

      const savedLocais = localStorage.getItem('custom_locais_options');
      if (savedLocais) {
        try {
          const parsed = JSON.parse(savedLocais);
          setCustomLocaisOptions(parsed);
        } catch (e) {
          console.error('Erro ao carregar locais customizados', e);
        }
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('traffic_reports', JSON.stringify(reports));
      localStorage.setItem('custom_locais_options', JSON.stringify(customLocaisOptions));
    }
  }, [reports, customLocaisOptions, isLoaded]);

  const handleClear = () => {
    setSimplesInput({ codigo: '', local: '', customCodigo: '', customLocal: '' });
    setIsLocalModalOpen(false);
    setNewLocalName('');
    setSimplesList([]);
    setEspecial({ tipo: 'Sinistro', descricao: '', local: '' });
    setEditingId(null);
  };

  const handleAddSimples = () => {
    const finalCodigo = simplesInput.codigo === 'Outros' ? simplesInput.customCodigo : simplesInput.codigo;
    const finalLocal = simplesInput.local === 'Outros' ? simplesInput.customLocal : simplesInput.local;

    if (!finalCodigo || !finalLocal) {
      setToast({ message: 'Preencha Código e Local.', type: 'error' });
      return;
    }
    setSimplesList([...simplesList, { codigo: finalCodigo, local: finalLocal }]);
    // Reset local inputs but keep code for next entry
    setSimplesInput({ 
      ...simplesInput, 
      local: '', 
      customLocal: '' 
    });
  };

  const handleConfirmNewLocal = () => {
    if (!newLocalName.trim()) {
      setToast({ message: 'Digite um nome para o local.', type: 'error' });
      return;
    }
    if ([...SETORES_INICIAIS, ...customLocaisOptions].includes(newLocalName.trim())) {
      setToast({ message: 'Este local já existe.', type: 'error' });
      return;
    }
    setCustomLocaisOptions([...customLocaisOptions, newLocalName.trim()]);
    setSimplesInput({ ...simplesInput, local: newLocalName.trim() });
    setNewLocalName('');
    setIsLocalModalOpen(false);
    setToast({ message: 'Local adicionado!', type: 'success' });
  };

  // Group reports by date for history tab
  const getGroupedReports = () => {
    const groups: { [key: string]: { simples: Report[], especial: Report[] } } = {};
    
    reports.forEach(report => {
      const date = new Date(report.timestamp).toLocaleDateString('pt-BR');
      if (!groups[date]) groups[date] = { simples: [], especial: [] };
      if (report.type === 'simples') {
        groups[date].simples.push(report);
      } else {
        groups[date].especial.push(report);
      }
    });

    // Sort dates descending
    return Object.entries(groups).sort((a, b) => {
      const [da, ma, ya] = a[0].split('/');
      const [db, mb, yb] = b[0].split('/');
      const dateA = new Date(`${ya}-${ma}-${da}`).getTime();
      const dateB = new Date(`${yb}-${mb}-${db}`).getTime();
      return dateB - dateA;
    });
  };

  const handleRemoveSimples = (index: number) => {
    setSimplesList(simplesList.filter((_, i) => i !== index));
  };

  const handleSaveReport = () => {
    let reportData: { items?: { codigo: string, local: string }[], tipo?: string, descricao?: string, local?: string };
    
    if (activeTab === 'simples') {
      const finalCodigo = simplesInput.codigo === 'Outros' ? simplesInput.customCodigo : simplesInput.codigo;
      const finalLocal = simplesInput.local === 'Outros' ? simplesInput.customLocal : simplesInput.local;

      if (simplesList.length === 0 && !finalCodigo) {
        setToast({ message: 'Adicione pelo menos uma ocorrência.', type: 'error' });
        return;
      }
      // If user has inputs but didn't click "Add", add it automatically
      const finalItems = [...simplesList];
      if (finalCodigo && finalLocal) {
        finalItems.push({ codigo: finalCodigo, local: finalLocal });
      }
      
      if (finalItems.length === 0) {
        setToast({ message: 'Nenhuma ocorrência para salvar.', type: 'error' });
        return;
      }
      reportData = { items: finalItems };
    } else {
      if (!especial.descricao || !especial.local) {
        setToast({ message: 'Preencha os campos obrigatórios.', type: 'error' });
        return;
      }
      reportData = { ...especial };
    }

    const newReport: Report = {
      id: editingId || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
      type: activeTab === 'simples' ? 'simples' : 'especial',
      data: reportData,
      timestamp: Date.now(),
    };

    if (editingId) {
      setReports(reports.map(r => r.id === editingId ? newReport : r));
      setEditingId(null);
      setToast({ message: 'Registro atualizado!', type: 'success' });
    } else {
      setReports([newReport, ...reports]);
      setToast({ message: 'Relatório salvo localmente!', type: 'success' });
    }

    handleClear();
  };

  const confirmDelete = () => {
    if (showConfirm) {
      const ids = showConfirm.id.split(',');
      setReports(reports.filter(r => !ids.includes(r.id)));
      setShowConfirm(null);
      setToast({ message: ids.length > 1 ? 'Registros excluídos.' : 'Registro excluído.', type: 'success' });
    }
  };

  const handleDeleteReport = (id: string) => {
    setShowConfirm({ id });
  };

  const handleEditReport = (report: Report) => {
    setEditingId(report.id);
    setActiveTab(report.type);
    if (report.type === 'simples') {
      setSimplesList(report.data.items || []);
      setSimplesInput({ codigo: '', local: '', customCodigo: '', customLocal: '' });
    } else {
      setEspecial({ 
        tipo: report.data.tipo || 'Sinistro', 
        descricao: report.data.descricao || '', 
        local: report.data.local || '' 
      });
    }
  };

  const handleSendWhatsApp = (reportData?: { items?: { codigo: string, local: string }[], tipo?: string, descricao?: string, local?: string }, reportType?: string) => {
    let message = '';
    const type = reportType || activeTab;
    let data = reportData;

    if (!data) {
      if (type === 'simples') {
        const finalCodigo = simplesInput.codigo === 'Outros' ? simplesInput.customCodigo : simplesInput.codigo;
        const finalLocal = simplesInput.local === 'Outros' ? simplesInput.customLocal : simplesInput.local;

        const finalItems = [...simplesList];
        if (finalCodigo && finalLocal) {
          finalItems.push({ codigo: finalCodigo, local: finalLocal });
        }
        if (finalItems.length === 0) {
          setToast({ message: 'Adicione ocorrências primeiro.', type: 'error' });
          return;
        }
        data = { items: finalItems };
      } else {
        data = { ...especial };
      }
    }

    if (type === 'simples') {
      const items = data.items || [];
      // Group by code
      const grouped: { [key: string]: string[] } = {};
      items.forEach((item: { codigo: string, local: string }) => {
        if (!grouped[item.codigo]) grouped[item.codigo] = [];
        grouped[item.codigo].push(item.local);
      });

      message = `*OCORRÊNCIAS SIMPLES*\n`;
      Object.keys(grouped).forEach(codigo => {
        message += `\n*Código:* ${codigo}\n*Locais:*`;
        grouped[codigo].forEach(local => {
          message += `\n- ${local}`;
        });
        message += `\n`;
      });
    } else {
      if (!data.descricao || !data.local) {
        setToast({ message: 'Por favor, preencha todos os campos.', type: 'error' });
        return;
      }
      message = `*OCORRÊNCIA ESPECIAL*\n\n*Tipo:* ${data.tipo}\n*Descrição:* ${data.descricao}\n*Local:* ${data.local}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg text-white font-bold text-sm flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <Save className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-xs w-full text-center space-y-6 shadow-2xl"
            >
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">Excluir Registro?</h3>
                <p className="text-slate-500 text-sm">Esta ação não pode ser desfeita e o registro será removido do histórico.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Modal */}
      <AnimatePresence>
        {isLocalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLocalModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" /> Novo Local
                  </h3>
                  <button 
                    onClick={() => setIsLocalModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Nome do Local
                  </label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Ex: Rua das Flores, 123"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-all"
                    value={newLocalName}
                    onChange={(e) => setNewLocalName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmNewLocal()}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsLocalModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmNewLocal}
                    className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-amber-500 text-white p-6 shadow-md sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Agente Trânsito</h1>
              <p className="text-amber-100 text-[10px] uppercase tracking-widest font-bold">Registro Operacional</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab !== 'historico' && (
              <button 
                onClick={handleClear}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-bold uppercase transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('simples'); setEditingId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'simples' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Simples
          </button>
          <button
            onClick={() => { setActiveTab('especial'); setEditingId(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'especial' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Especial
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'historico' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>
        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'historico' ? (
            <motion.div
              key="historico"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h2 className="font-black text-slate-400 uppercase text-xs tracking-widest">Registros Salvos ({reports.length})</h2>
              </div>
              
              {reports.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-200">
                  <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">Nenhum registro encontrado no dispositivo.</p>
                </div>
              ) : (
                getGroupedReports().map(([date, groups]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <div className="h-[1px] flex-1 bg-slate-200"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
                      <div className="h-[1px] flex-1 bg-slate-200"></div>
                    </div>

                    {/* Grouped Simples Card */}
                    {groups.simples.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                            Ocorrências Simples
                          </span>
                          <button 
                            onClick={() => {
                              const ids = groups.simples.map(r => r.id);
                              setShowConfirm({ id: ids.join(',') }); // Special case for bulk delete
                            }}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {groups.simples.sort((a, b) => b.timestamp - a.timestamp).map((report) => (
                            <div key={report.id} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-400 font-bold">
                                  {new Date(report.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditReport(report)} className="text-[9px] text-amber-500 font-bold uppercase">Editar</button>
                                  <button onClick={() => handleDeleteReport(report.id)} className="text-[9px] text-red-400 font-bold uppercase">Remover</button>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                {report.data.items?.map((item, i) => (
                                  <div key={i} className="flex justify-between">
                                    <span className="font-bold text-slate-600">{item.codigo}</span>
                                    <span className="truncate ml-2 text-slate-400">{item.local}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            const allItems = groups.simples.flatMap(r => r.data.items || []);
                            handleSendWhatsApp({ items: allItems }, 'simples');
                          }}
                          className="w-full bg-green-50 text-green-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-100 transition-all active:scale-95 border border-green-100"
                        >
                          <Send className="w-3 h-3" /> Enviar Tudo ({date})
                        </button>
                      </div>
                    )}

                    {/* Individual Especial Cards */}
                    {groups.especial.sort((a, b) => b.timestamp - a.timestamp).map((report) => (
                      <div key={report.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                              {report.data.tipo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(report.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditReport(report)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-bold text-slate-700">{report.data.descricao}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {report.data.local}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSendWhatsApp(report.data, report.type)}
                          className="w-full bg-green-50 text-green-600 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-100 transition-colors border border-green-100"
                        >
                          <Send className="w-3 h-3" /> Reenviar WhatsApp
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
                {editingId && (
                  <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-tight flex items-center gap-2">
                      <Edit2 className="w-3 h-3" /> Editando Registro
                    </span>
                    <button onClick={handleClear} className="text-[10px] font-black text-amber-500 uppercase">Cancelar</button>
                  </div>
                )}

                {activeTab === 'simples' ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                          <Hash className="w-4 h-4" /> Código
                        </label>
                        <select
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors appearance-none"
                          value={simplesInput.codigo}
                          onChange={(e) => setSimplesInput({ ...simplesInput, codigo: e.target.value })}
                        >
                          <option value="">Selecione um código...</option>
                          {CODIGOS_OPCOES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="Outros">Outros (Escrever manualmente)</option>
                        </select>
                        
                        {simplesInput.codigo === 'Outros' && (
                          <motion.input
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            type="text"
                            placeholder="Digite o código manualmente..."
                            className="w-full p-4 mt-2 bg-white border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors"
                            value={simplesInput.customCodigo}
                            onChange={(e) => setSimplesInput({ ...simplesInput, customCodigo: e.target.value })}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Local
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <select
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors appearance-none"
                              value={simplesInput.local}
                              onChange={(e) => setSimplesInput({ ...simplesInput, local: e.target.value })}
                            >
                              <option value="">Selecione um local...</option>
                              {SETORES_INICIAIS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                              {customLocaisOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                              <option value="Outros">Outros (Escrever manualmente)</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setIsLocalModalOpen(true)}
                            title="Adicionar novo local"
                            className="bg-amber-50 text-amber-600 p-4 rounded-xl active:scale-95 transition-all border-2 border-amber-100 hover:bg-amber-100"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>

                        {simplesInput.local === 'Outros' && (
                          <motion.input
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            type="text"
                            placeholder="Digite o local manualmente..."
                            className="w-full p-4 mt-2 bg-white border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors"
                            value={simplesInput.customLocal}
                            onChange={(e) => setSimplesInput({ ...simplesInput, customLocal: e.target.value })}
                          />
                        )}

                        <div className="pt-2">
                          <button
                            onClick={handleAddSimples}
                            className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold uppercase shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-5 h-5" /> Adicionar Ocorrência
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* List of added items */}
                    {simplesList.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens na Lista ({simplesList.length})</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {simplesList.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="text-sm">
                                <span className="font-bold text-amber-600 mr-2">{item.codigo}</span>
                                <span className="text-slate-600">{item.local}</span>
                              </div>
                              <button onClick={() => handleRemoveSimples(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Info className="w-4 h-4" /> Tipo de Ocorrência
                      </label>
                      <select
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors appearance-none"
                        value={especial.tipo}
                        onChange={(e) => setEspecial({ ...especial, tipo: e.target.value })}
                      >
                        <option value="Sinistro">Sinistro</option>
                        <option value="Buraco na Via">Buraco na Via</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Descrição
                      </label>
                      <textarea
                        placeholder="Descreva a situação..."
                        rows={3}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors"
                        value={especial.descricao}
                        onChange={(e) => setEspecial({ ...especial, descricao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Local
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Cruzamento X com Y"
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-medium transition-colors"
                        value={especial.local}
                        onChange={(e) => setEspecial({ ...especial, local: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSaveReport}
                  className="bg-white border-2 border-amber-500 text-amber-600 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-sm active:scale-95 transition-all"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  onClick={() => handleSendWhatsApp()}
                  className="bg-green-600 text-white py-4 rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center gap-2 font-bold uppercase text-sm active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                  Enviar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-md mx-auto px-6 py-4 text-center">
        <p className="text-slate-400 text-[10px] italic uppercase tracking-widest font-bold">
          Sistema de Apoio Operacional - Local Storage v1.0
        </p>
      </footer>
    </div>
  );
}
