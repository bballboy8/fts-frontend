using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
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
        public static bool IsMainPage { get; set; } = true;
        public static bool IsDarkMode { get; set; } = true;
        public static bool IsMaximizeClikedForChart { get; set; } = true;
        public static ObservableCollection<ChartPageModal> ChartPages { get; set; } = [];

        public static void AddChartPage(ChartPageModal chartPage)
        {
            var existingPage = ChartPages.FirstOrDefault(cp => cp.ChartId == chartPage.ChartId);

            if (existingPage != null)
            {
                existingPage.JSRuntime = chartPage.JSRuntime;
                existingPage.UpdatedMaxExtreme = chartPage.UpdatedMaxExtreme;
                existingPage.UpdatedMinExtreme = chartPage.UpdatedMinExtreme;
            }
            else
            {
                ChartPages.Add(chartPage);
            }
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
