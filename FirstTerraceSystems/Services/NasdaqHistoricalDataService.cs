using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Repositories;

namespace FirstTerraceSystems.Services
{
    public class NasdaqHistoricalDataService
    {
        private readonly SymbolicRepository _symbolicRepository;
        private readonly NasdaqService _nasdaqService;
        private readonly ChartService _chartService;

        public NasdaqHistoricalDataService(SymbolicRepository symbolicRepository, NasdaqService nasdaqService, ChartService chartService)
        {
            _symbolicRepository = symbolicRepository;
            _nasdaqService = nasdaqService;
            _chartService = chartService;
        }

        //public async Task InsertHistoricalNasdaqMarketFeedsAsync()
        //{
        //    var startDate = DateTime.Now.AddDays(-3);
        //    var tasks = _chartService.InitialChartSymbols.Where(a => a.IsVisible).Select(chart => ProcessHistoricalNasdaqMarketFeedsAsync(chart, startDate));
        //    await Task.WhenAll(tasks);
        //}

        //private async Task ProcessHistoricalNasdaqMarketFeedsAsync(ChartModal chart, DateTime startDate)
        //{
        //    var symbolic = _symbolicRepository.GetLastRecordBySymbol(chart.Symbol);
        //    var symbolicDate = symbolic?.Date ?? startDate;
        //    var symbolicDatas = await _nasdaqService.NasdaqGetDataAsync(symbolicDate, chart.Symbol);

        //    if (symbolicDatas != null && symbolicDatas.Count() != 0)
        //    {
        //        var semaphore = new SemaphoreSlim(1, 1);

        //        foreach (var batch in symbolicDatas.Chunk(10000))
        //        {
        //            await semaphore.WaitAsync();
        //            try
        //            {
        //                _symbolicRepository.InsertMarketFeedDataFromApi(chart.Symbol, batch.ToList());
        //            }
        //            finally
        //            {
        //                semaphore.Release();
        //            }
        //        }
        //    }
        //}

        public async Task<IEnumerable<SymbolicData>> ProcessHistoricalNasdaqMarketFeedAsync(string symbol)
        {

            var startDate = DateTime.Now.AddDays(-3);
            var symbolic = _symbolicRepository.GetLastRecordBySymbol(symbol);
            var symbolicDate = symbolic?.Date ?? startDate;
            if (await _nasdaqService.NasdaqGetDataAsync(symbolicDate, symbol) is List<SymbolicData> datas)
            {
                _symbolicRepository.InsertMarketFeedDataFromApi(symbol, datas);
                return datas;
            };
            return [];
        }
    }
}
