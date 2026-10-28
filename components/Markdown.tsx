import { Fragment, type ReactNode } from "react";

// Rendu d'un Markdown simple (titres, puces, gras, italique, encadré "À retenir"), sans HTML brut.
function inline(text: string, key: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(m[1] !== undefined ? <strong key={key + i++}>{m[1]}</strong> : <em key={key + i++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ src }: { src: string }) {
  const lines = src.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = (k: number) => {
    if (list.length) {
      blocks.push(<ul key={"ul" + k}>{list}</ul>);
      list = [];
    }
  };
  lines.forEach((raw, k) => {
    const l = raw.trim();
    const li = /^([-*•]|\d+[.)]) /.test(l);
    if (!li) flush(k);
    if (!l) return;
    if (l.startsWith("### ")) blocks.push(<h4 key={k}>{inline(l.slice(4), "h" + k)}</h4>);
    else if (/^#{1,2} /.test(l)) blocks.push(<h3 key={k}>{inline(l.replace(/^#+ /, ""), "h" + k)}</h3>);
    else if (l.startsWith(">")) blocks.push(<div className="keep" key={k}>{inline(l.replace(/^>\s?/, ""), "q" + k)}</div>);
    else if (li) list.push(<li key={k}>{inline(l.replace(/^([-*•]|\d+[.)]) /, ""), "l" + k)}</li>);
    else blocks.push(<p key={k}>{inline(l, "p" + k)}</p>);
  });
  flush(lines.length);
  return <Fragment>{blocks}</Fragment>;
}
