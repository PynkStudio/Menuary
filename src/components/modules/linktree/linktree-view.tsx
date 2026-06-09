import { ExternalLink } from "lucide-react";

export type TenantLinktreeItem = {
  id?: string;
  label: string;
  href: string;
  description?: string | null;
  kind?: string | null;
  enabled?: boolean;
};

export function TenantLinktreeView({
  items,
  className = "",
}: {
  items: TenantLinktreeItem[];
  className?: string;
}) {
  return (
    <div className={`tenant-linktree-list ${className}`.trim()}>
      {items.map((item) => {
        const external = /^https?:\/\//i.test(item.href);
        return (
          <a
            key={`${item.label}-${item.href}`}
            href={item.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            data-kind={item.kind ?? "link"}
          >
            <span>
              <strong>{item.label}</strong>
              {item.description && <small>{item.description}</small>}
            </span>
            <ExternalLink size={16} />
          </a>
        );
      })}
    </div>
  );
}
