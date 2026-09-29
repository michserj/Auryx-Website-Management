import ReactMarkdown from "react-markdown";

/**
 * Renders admin-authored Markdown. Raw HTML is NOT rendered (react-markdown
 * escapes it by default), and link protocols are restricted — so content
 * cannot inject scripts.
 */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div
      className={`prose prose-slate max-w-none prose-headings:tracking-tight prose-headings:text-ink prose-a:text-navy-600 prose-a:underline-offset-2 prose-blockquote:border-gold-500 prose-blockquote:text-muted ${className}`}
    >
      <ReactMarkdown
        skipHtml
        urlTransform={(url) => (/^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : "")}
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
