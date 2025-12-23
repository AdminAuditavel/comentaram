import React from "react";
import { DailyRankingItem } from "../hooks/useDailyRanking";
import clsx from "clsx";

type Props = {
  items: DailyRankingItem[];
  onClickClub?: (clubId: string) => void;
  limit?: number;
};

export const RankingCard: React.FC<Props> = ({ items, onClickClub, limit = 10 }) => {
  const top = items.slice(0, limit);

  return (
    <div className="bg-white shadow rounded p-4">
      <h3 className="text-lg font-semibold mb-3">Ranking do Dia</h3>
      <div className="space-y-2">
        {top.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum dado disponível</div>
        ) : (
          top.map((it, idx) => (
            <button
              key={it.club.id}
              onClick={() => onClickClub?.(it.club.id)}
              className="w-full text-left rounded hover:bg-gray-50 p-2 flex items-center justify-between"
              aria-label={`Abrir ${it.club.name}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 text-right text-sm text-gray-500">{it.rank ?? idx + 1}</div>
                <div>
                  <div className="font-medium">{it.club.name}</div>
                  <div className="text-xs text-gray-400">{it.club.slug}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{it.mentions.toLocaleString()}</div>
                <div className="text-xs text-gray-500">IAP {it.iap_score?.toFixed(1) ?? "-"}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
