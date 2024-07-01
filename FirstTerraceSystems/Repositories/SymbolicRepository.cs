using FirstTerraceSystems.Entities;
using System.Text.Json;
using System.Data;
using Dapper;
using FirstTerraceSystems.Services;

namespace FirstTerraceSystems.Repositories
{
    public class SymbolicRepository
    {
        private const int insertbatchSize = 5000;
        private readonly IDbConnection _connection;
        private readonly DatabaseService _databaseService;

        public SymbolicRepository(IDbConnection connection, DatabaseService databaseService)
        {
            _connection = connection;
            _databaseService = databaseService;
        }

        public SymbolicData? GetLastRecordBySymbol(string symbol)
        {
            try
            {
                string sql = $"SELECT * FROM symbol_{symbol} ORDER BY Id DESC LIMIT 1";
                return _connection.QueryFirstOrDefault<SymbolicData>(sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public SymbolicData? GetExistsSymbol(string? symbol)
        {
            if (string.IsNullOrEmpty(symbol)) return null;

            try
            {
                string sql = $"SELECT * FROM symbol_{symbol.ToUpper()} LIMIT 1";
                return _connection.QueryFirstOrDefault<SymbolicData>(sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public async Task<IEnumerable<SymbolicData>> GetChartDataBySymbol(string symbol)
        {
            try
            {
                DateTime threeDaysAgo = DateTime.Now.AddDays(-3);
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Date >= @StartDate ORDER BY Date";
                return _connection.Query<SymbolicData>(sql, new { StartDate = threeDaysAgo });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }
        }

        public async Task<IEnumerable<SymbolicData>> GetChartDataBySymbol(string symbol, long lastId)
        {
            try
            {
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Id > @LastId ORDER BY Date";
                return await _connection.QueryAsync<SymbolicData>(sql, new { LastId = lastId });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }
        }

        public IEnumerable<string> GetAllSymbols()
        {
            try
            {
                string sql = "SELECT REPLACE(name, 'symbol_', '') AS symbol FROM sqlite_master WHERE type = 'table' AND name LIKE 'symbol_%';";
                return _connection.Query<string>(sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }
        }

        public void InsertMarketFeedDataFromApi(string symbol, IEnumerable<SymbolicData> marketFeeds)
        {
            foreach (var item in marketFeeds)
            {
                item.Price /= 10000;
            }

            CreateTableAndIndexes(symbol);
            InsertRecordsBatch(symbol, marketFeeds);
        }

        public void InsertLiveMarketFeedDataFromSocket(string jsonData)
        {
            using (JsonDocument document = JsonDocument.Parse(jsonData))
            {
                var headerElement = document.RootElement.GetProperty("headers");
                var dataElement = document.RootElement.GetProperty("data");
                var headers = headerElement.EnumerateArray().Select((element, index) => new { Header = element.GetString() ?? "", Index = index }).ToDictionary(x => x.Header, x => x.Index);

                var groupedElements = dataElement.EnumerateArray().GroupBy(e => e[headers["symbol"]].GetString()!);

                foreach (var groupedElement in groupedElements)
                {
                    string symbol = groupedElement.Key;

                    IEnumerable<SymbolicData>? datas = groupedElement.Select(element => new SymbolicData(headers, element));

                    CreateTableAndIndexes(symbol);
                    InsertRecordsBatch(symbol, datas);
                }
            }
        }

        private void InsertRecordsBatch(string symbol, IEnumerable<SymbolicData> records)
        {
            try
            {
                using (var connection = _databaseService.GetNewConnection())
                {
                    using (var transaction = connection.BeginTransaction())
                    {
                        connection.Execute($"INSERT INTO symbol_{symbol} (TrackingID, Date, MsgType, Symbol, Price) VALUES (@TrackingID, @Date, @MsgType, @Symbol, @Price)", records);

                        transaction.Commit();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting records: {ex.Message}");
            }
        }

        private void CreateTableAndIndexes(string symbol)
        {
            try      
            {
                using (var connection = _databaseService.GetNewConnection())
                {
                    using (var transaction = connection.BeginTransaction())
                    {
                        connection.Execute($"CREATE TABLE IF NOT EXISTS symbol_{symbol} (" +
                        "Id INTEGER PRIMARY KEY AUTOINCREMENT," +
                        "TrackingID VARCHAR," +
                        "Date BIGINT," +
                        "MsgType VARCHAR," +
                        "Symbol VARCHAR," +
                        "Price FLOAT)");

                        //_connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_symbol ON symbol_{symbol}(Symbol)");
                        connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_date ON symbol_{symbol}(Date)");

                        transaction.Commit();
                    }

                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Create Table And Indexes: {ex.Message}");
            }
        }
    }
}
