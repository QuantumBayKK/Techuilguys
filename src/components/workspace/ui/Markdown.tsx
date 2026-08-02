import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders `body_md` columns. react-markdown escapes raw HTML by default and we
 * deliberately don't add rehype-raw — client-authored comments must not be able
 * to inject markup into a staff member's page.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="ws-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: kids }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {kids}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
