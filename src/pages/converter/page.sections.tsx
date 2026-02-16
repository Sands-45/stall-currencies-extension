import React from "react";

interface ConverterIntroSectionProps {
  is_query_valid: boolean;
}

export const ConverterIntroSection = ({
  is_query_valid,
}: ConverterIntroSectionProps) => {
  return (
    <div className="mt-4">
      <h1 className="text-lg font-semibold">Currency Conveter</h1>
      <p className="text-muted-foreground text-sm">
        Type a query like <span className="font-medium">200 ZAR in USD</span>
      </p>
      {!is_query_valid ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Invalid format. Use: {"<amount> <from> in <to>"} (e.g. 200 ZAR in
          USD)
        </p>
      ) : null}
    </div>
  );
};

interface CenteredCardMessageProps {
  children: React.ReactNode;
  tone?: "muted" | "destructive";
}

export const CenteredCardMessage = ({
  children,
  tone = "muted",
}: CenteredCardMessageProps) => {
  const tone_class =
    tone === "destructive" ? "text-sm text-destructive" : "text-sm text-muted-foreground";

  return (
    <div className="w-full h-65 center-flex">
      <p className={tone_class}>{children}</p>
    </div>
  );
};

