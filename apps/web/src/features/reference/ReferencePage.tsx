// ReferencePage - consulta de regras e glossario como pagina (a navegacao vira rota); o mesmo RefBrowser serve o painel lateral.
import { useLocation, useNavigate } from 'react-router';
import { Page } from '@/components/ui';
import { RefBrowser } from './RefBrowser';

export function ReferencePage() {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <Page title={loc.pathname.startsWith('/glossario') ? 'Glossário' : 'Consulta'} subtitle="Regras e entidades do livro, com página impressa. Atalho: / ou Ctrl+K para buscar de qualquer tela.">
      <RefBrowser key={loc.pathname.split('/').slice(0, 2).join('/')} path={loc.pathname} onNavigate={(p) => nav(p)} />
    </Page>
  );
}
