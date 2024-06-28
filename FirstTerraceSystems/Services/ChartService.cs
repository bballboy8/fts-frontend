using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FirstTerraceSystems.Models;

namespace FirstTerraceSystems.Services
{
    internal class ChartService
    {

        private const string PreferencesKey = "ChartSymbols";

        public List<ChartModal> InitialChartSymbols { get; private set; } = new List<ChartModal>
        {
            new ChartModal { ChartId = "chart-1", Symbol = "AAPL" },
            new ChartModal { ChartId = "chart-2", Symbol = "GOOGL" },
            new ChartModal { ChartId = "chart-3", Symbol = "MSFT" },
            new ChartModal { ChartId = "chart-4", Symbol = "TSLA" },
            new ChartModal { ChartId = "chart-5", Symbol = "AMD" },
            new ChartModal { ChartId = "chart-6", Symbol = "AMZN" },
            new ChartModal { ChartId = "chart-7", Symbol = "META" },
            new ChartModal { ChartId = "chart-8", Symbol = "GOOG" }
        };

        public void Load()
        {
            var savedSymbolsJson = Preferences.Get(PreferencesKey, string.Empty);
            if (!string.IsNullOrEmpty(savedSymbolsJson))
            {
                var savedSymbols = JsonSerializer.Deserialize<List<ChartModal>>(savedSymbolsJson);
                if (savedSymbols != null)
                {
                    foreach (var symbol in savedSymbols)
                    {
                        var existingSymbol = InitialChartSymbols.Find(s => s.ChartId == symbol.ChartId);
                        if (existingSymbol != null)
                        {
                            existingSymbol.Symbol = symbol.Symbol;
                        }
                    }
                }
            }
        }

        public void Save()
        {
            var json = JsonSerializer.Serialize(InitialChartSymbols);
            Preferences.Set(PreferencesKey, json);
        }

        public void UpdateSymbol(string id, string newSymbol)
        {
            var symbol = InitialChartSymbols.Find(s => s.ChartId == id);
            if (symbol != null)
            {
                symbol.Symbol = newSymbol;
            }
        }
    }
}
