using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Repositories;

namespace FirstTerraceSystems.Services
{
    public class NasdaqHistoricalDataService
    {
        private readonly MarketFeedRepository _symbolicRepository;
        private readonly NasdaqService _nasdaqService;
        private readonly ChartService _chartService;

        public NasdaqHistoricalDataService(MarketFeedRepository symbolicRepository, NasdaqService nasdaqService, ChartService chartService)
        {
            _symbolicRepository = symbolicRepository;
            _nasdaqService = nasdaqService;
            _chartService = chartService;
        }

        public async Task<IEnumerable<MarketFeed>> ProcessHistoricalNasdaqMarketFeedAsync(string symbol)
        {

            var startDate = DateTime.Now.AddDays(-3);
            var symbolic = _symbolicRepository.GetLastRecordBySymbol(symbol);
            var symbolicDate = symbolic?.Date ?? startDate;
            if (await _nasdaqService.NasdaqGetDataAsync(symbolicDate, symbol) is List<MarketFeed> datas)
            {
                _symbolicRepository.InsertMarketFeedDataFromApi(symbol, datas);
                return datas;
            };
            return [];
        }
    }
}
