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
        public List<IJSRuntime>? JSRuntimes { get; set; }
        public List<ChartPageModal>? ChartPages { get; set; }

        public void AddChartPage(ChartPageModal chartPage)
        {
            ChartPages ??= new();
            ChartPages.Add(chartPage);
        }

        public void RemoveChartPage(string chartId)
        {
            var page = ChartPages?.FirstOrDefault(cp => cp.ChartId == chartId);
            if (page != null)
            {
                ChartPages?.Remove(page);
            }
        }

        public void AddJSRuntimes(IJSRuntime jSRuntime)
        {
            JSRuntimes ??= new();
            JSRuntimes.Add(jSRuntime);
        }
    }
}
