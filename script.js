// script.js - funcionalidades compartilhadas do site

// --- Storage keys ---
const STORAGE_KEY = 'par_cadastros_v1';

// --- Utilitários ---
function readRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function writeRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// --- Form de adoção ---
function handleSubmit(e){
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  const animalInteresse = document.getElementById('animalInteresse').value;
  const temAnimais = document.getElementById('temAnimais').value;
  const mensagem = document.getElementById('mensagem').value.trim();

  if(!nome || !email){
    alert('Por favor preencha o nome e o e-mail.');
    return false;
  }

  const registros = readRecords();
  const novo = {
    id: Date.now(),
    nome, email, telefone, endereco, animalInteresse, temAnimais, mensagem, criadoEm: new Date().toISOString()
  };
  registros.unshift(novo);
  writeRecords(registros);
  renderRecords();
  document.getElementById('cadastro-form').reset();
  alert('Cadastro enviado! Nossa equipe entrará em contato.');
  return false;
}

function renderRecords(){
  const area = document.getElementById('registros-area');
  if(!area) return;
  const registros = readRecords();
  if(registros.length === 0){
    area.innerHTML = '<p class="muted">Nenhum cadastro ainda.</p>';
    return;
  }
  area.innerHTML = registros.map(r => `
    <div class="record">
      <strong>${escapeHtml(r.nome)}</strong>
      <small class="muted">${new Date(r.criadoEm).toLocaleString()}</small>
      <div>📧 ${escapeHtml(r.email)} • 📞 ${escapeHtml(r.telefone || '—')}</div>
      <div>Interesse: ${escapeHtml(r.animalInteresse)} • Tem animais: ${escapeHtml(r.temAnimais)}</div>
      <div class="muted">${escapeHtml(r.endereco || '')}</div>
      ${r.mensagem ? `<div style="margin-top:6px">${escapeHtml(r.mensagem)}</div>` : ''}
    </div>
  `).join('');
}

function clearForm(){
  const f = document.getElementById('cadastro-form');
  if(f) f.reset();
}

function clearAllRecords(){
  if(!confirm('Deseja realmente apagar todos os cadastros? Isso não pode ser desfeito.')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderRecords();
  alert('Registros apagados.');
}

// --- Export CSV e XLS (XML Spreadsheet 2003) ---
function convertToCsv(records){
  const headers = ['id','nome','email','telefone','endereco','animalInteresse','temAnimais','mensagem','criadoEm'];
  const rows = records.map(r => headers.map(h => {
    const v = r[h] ?? '';
    // Escapar " com ""
    return `"${String(v).replace(/"/g,'""')}"`;
  }).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}

// Excel 2003 XML spreadsheet (abre bem no Excel sem libs externas)
function buildExcelXml(records, sheetName = 'Cadastros'){
  const headers = ['ID','Nome','E-mail','Telefone','Endereço','Interesse','Tem animais','Mensagem','Criado Em'];
  const rowsXml = records.map(r => {
    return `<Row>
      <Cell><Data ss:Type="Number">${r.id}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.nome)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.email)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.telefone || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.endereco || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.animalInteresse)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.temAnimais)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(r.mensagem || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(new Date(r.criadoEm).toLocaleString())}</Data></Cell>
    </Row>`;
  }).join('\n');

  const headerRow = `<Row>${headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`;

  return `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="${escapeXml(sheetName)}">
      <Table>
        ${headerRow}
        ${rowsXml}
      </Table>
    </Worksheet>
  </Workbook>`;
}

function exportCSV(){
  const records = readRecords();
  if(records.length === 0){ alert('Não há registros para exportar.'); return; }
  const csv = convertToCsv(records);
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  downloadBlob(blob, `par_cadastros_${dateStamp()}.csv`);
}

function exportXLS(){
  const records = readRecords();
  if(records.length === 0){ alert('Não há registros para exportar.'); return; }
  const xml = buildExcelXml(records, 'Cadastros');
  const blob = new Blob([xml], {type: 'application/vnd.ms-excel'});
  // Extensão .xls irá abrir no Excel (XML Spreadsheet é suportado)
  downloadBlob(blob, `par_cadastros_${dateStamp()}.xls`);
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function dateStamp(){
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
}

// --- Suporte form handler ---
function handleSupportSubmit(e){
  e.preventDefault();
  const nome = document.getElementById('supNome').value.trim();
  const email = document.getElementById('supEmail').value.trim();
  const assunto = document.getElementById('supAssunto').value.trim();
  const mensagem = document.getElementById('supMensagem').value.trim();

  if(!nome || !email || !mensagem){
    alert('Por favor preencha nome, e-mail e a mensagem.');
    return false;
  }

  // Simulação de envio — guardamos no localStorage com prefixo para debug
  const suporteKey = 'par_suporte_v1';
  const prev = JSON.parse(localStorage.getItem(suporteKey) || '[]');
  prev.unshift({id: Date.now(), nome, email, assunto, mensagem, criadoEm: new Date().toISOString()});
  localStorage.setItem(suporteKey, JSON.stringify(prev));

  document.getElementById('suporteForm').reset();
  const info = document.getElementById('supInfo');
  if(info) info.textContent = 'Mensagem enviada! Responderemos por e-mail em até 3 dias úteis.';
  return false;
}

// --- Helpers: escaping ---
function escapeHtml(str = ''){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
function escapeXml(str = ''){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
