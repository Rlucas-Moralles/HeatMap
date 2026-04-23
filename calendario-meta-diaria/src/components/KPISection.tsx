import React from "react";
import { MonthSummary } from "../dataMapper";
import { VisualSettings } from "../settings";
import { formatValue, formatGap, getKpiBg, getChipColor } from "../colorUtils";

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  bg: string;
  onDarkBg?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, subColor, bg, onDarkBg = false }) => {
  const inkColor = onDarkBg ? "#FFFFFF" : "#1A1A1A";
  const mutedColor = onDarkBg ? "rgba(255,255,255,0.75)" : "#6B6B68";

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: bg,
        border: onDarkBg ? "none" : "1px solid #ECECEA",
        borderRadius: 10,
        padding: "18px 20px",
        fontFamily: "Segoe UI, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 500, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ fontSize: 30, fontWeight: 600, color: inkColor, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: subColor ?? mutedColor, whiteSpace: "nowrap" }}>
        {sub}
      </span>
    </div>
  );
};

interface Props {
  summary: MonthSummary;
  settings: VisualSettings;
}

export const KPISection: React.FC<Props> = ({ summary, settings }) => {
  const { thresholds } = settings;
  const kpiBg = getKpiBg(summary.pctAcum, thresholds.thresholdOk, thresholds.thresholdWarn);
  const kpiOnDark = summary.pctAcum !== null;

  const gapColor =
    summary.gapMes >= 0
      ? getChipColor(1.0, thresholds.thresholdOk, thresholds.thresholdWarn)
      : getChipColor(0, thresholds.thresholdOk, thresholds.thresholdWarn);

  const today = new Date();

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12, flexShrink: 0 }}>
      <KPICard
        label="Faturado no Mês"
        value={formatValue(summary.faturadoMes)}
        sub={`${summary.diasRealizados} dias bateram`}
        bg="#FAFAF9"
      />
      <KPICard
        label="Objetivo Acumulado"
        value={formatValue(summary.objetivoMes)}
        sub={`gap ${formatGap(summary.gapMes)}`}
        subColor={gapColor}
        bg="#FAFAF9"
      />
      <KPICard
        label="% Atingimento"
        value={`${Math.round(summary.pctAcum * 100)}%`}
        sub={`no mês até ${today.getDate()}/${today.getMonth() + 1}`}
        bg={kpiBg}
        onDarkBg={kpiOnDark}
      />
      <KPICard
        label="Projeção Fim de Mês"
        value={formatValue(summary.projecaoMes)}
        sub={`${Math.round(summary.pctProjecao * 100)}% do obj total`}
        bg="#FAFAF9"
      />
    </div>
  );
};
