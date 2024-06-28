using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class MultiChats
    {
        //protected override async Task OnInitializedAsync()
        //{

        //    // var charts = await LocalStorage.GetItemAsync<List<ChartModal>>(ApplicationConst.LS_ChartSymbols);
        //}

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await JS.InvokeVoidAsync("T5.SetDotNetReference", DotNetObjectReference.Create(this));

                await JSRuntime.InvokeVoidAsync("loadDashboard");

                await UpdateSymbolicDataToDB();  

                //await WebSocketClient.ConnectAsync();

                //WebSocketClient.ActionRealDataReceived -= OnRealDataReceived;
                //WebSocketClient.ActionReferenceChart -= RefreshCharts;

                //WebSocketClient.ActionRealDataReceived += OnRealDataReceived;
                //WebSocketClient.ActionReferenceChart += RefreshCharts;

                //WebSocketClient.ListenAsync();

            }
        }

        private async Task UpdateSymbolicDataToDB()
        {
            var lastSymbol = SymbolicRepository.GetLastRecord();

            if (lastSymbol?.Date is not DateTime startDate)
            {
                startDate = DateTime.Now.AddDays(-2);
            }

            //if (!(lastSymbol != null && DateTime.TryParse(lastSymbol.TimeStamp, out DateTime startDate)))
            //{
            //    startDate = DateTime.Now.AddDays(-2);
            //}

            var data = await NasdaqService.GetSymbolicData(startDate, "AAPL");

            SymbolicRepository.UpdateSymbolicDataToDBFromApi(data);
        }

        private void OnRealDataReceived(NasdaqResponse? nasdaqData)
        {
            if (nasdaqData != null)
            {
                SymbolicRepository.UpdateSymbolicDataToDBFromSocket(nasdaqData);
            }
        }

        private async Task RefreshCharts()
        {
            // await JSRuntime.InvokeVoidAsync("RefreshChartData");
            await JSRuntime.InvokeVoidAsync("refreshCharts");
        }

        [JSInvokable("GetStockBySymbol")]
        public async Task<dynamic> GetStockBySymbol(string symbol)
        {
            var symbolicdata = SymbolicRepository.GetSymbolicDataBySymbol(symbol);
            return await Task.FromResult(symbolicdata);
        }

        [JSInvokable]
        public async Task<IEnumerable<SymbolicData>> GetChartDataBySymbol(string symbol, LastDataPoint? lastPoint)
        {
            if (lastPoint == null)
            {
                var symbolics = SymbolicRepository.GetChartDataBySymbol(symbol);
                return await Task.FromResult(symbolics);
            }
            else
            {
                var symbolics = SymbolicRepository.GetChartDataBySymbol(symbol, lastPoint.PrimaryKey);
                return await Task.FromResult(symbolics);
            }
        }

        public async ValueTask DisposeAsync()
        {
            await WebSocketClient.CloseAsync();
        }
    }
}
