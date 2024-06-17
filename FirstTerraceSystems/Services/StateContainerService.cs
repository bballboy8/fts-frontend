using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BlazorBootstrap;
using FirstTerraceSystems.Models;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Services
{
    internal class StateContainerService
    {
        public static bool IsAllowCloseAllWindows { get; set; } = false;
        public static bool IsDarkMode { get; set; } = true;

        public static List<ChartPageModal> ChartPages { get; set; } = [];

        public static void AddChartPage(ChartPageModal chartPage)
        {
            RemoveChartPage(chartPage.ChartId);
            ChartPages.Add(chartPage);
        }

        public static void RemoveChartPage(string? chartId)
        {
            var page = ChartPages?.FirstOrDefault(cp => cp.ChartId == chartId);
            if (page != null)
            {
                ChartPages?.Remove(page);
            }
        }
    }
}
