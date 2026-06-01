"use client";

export function TenantLanguagePicker<TLanguage extends string>({
  ariaLabel,
  className,
  language,
  languages,
  onChange,
}: {
  ariaLabel: string;
  className?: string;
  language: TLanguage;
  languages: readonly TLanguage[];
  onChange: (language: TLanguage) => void;
}) {
  return (
    <div className={className} aria-label={ariaLabel}>
      {languages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={item === language ? "is-active" : undefined}
          aria-pressed={item === language}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

