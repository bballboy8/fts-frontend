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
            if (!_databaseService.IsTableExists(GetSymbolTableName(symbol))) return null;

            try
            {
                string sql = $"SELECT * FROM {GetSymbolTableName(symbol)} ORDER BY Id DESC LIMIT 1";
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
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Date >= DATETIME(DATE('now'), '-3 days') ORDER BY Date";
                return await _connection.QueryAsync<SymbolicData>(sql);
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

        public void InsertMarketFeedDataFromApi(string symbol, List<SymbolicData> marketFeeds)
        {

            CreateTableAndIndexes(symbol);
            
            int skip = 0;

            while (true)
            {
               var batch = marketFeeds.Skip(skip).Take(insertbatchSize);

               if (!batch.Any())
               {
                   break;
               }

               InsertRecordsBatch(symbol, batch);

               skip += insertbatchSize;
            }

            // var batch = new List<SymbolicData>(insertbatchSize);
            // foreach (var item in marketFeeds)
            // {
            //     item.Price /= 10000;
            //     batch.Add(item);

            //     if (batch.Count >= insertbatchSize)
            //     {
            //         InsertRecordsBatch(symbol, batch);
            //         batch.Clear();
            //     }
            // }
            // if (batch.Count > 0)
            // {
            //     InsertRecordsBatch(symbol, batch);
            // }
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
                    ProcessSymbolGroup(groupedElement.Key, headers, groupedElement);
                }
            }
        }

        private void ProcessSymbolGroup(string symbol, Dictionary<string, int> headers, IGrouping<string, JsonElement> groupedElement)
        {
            CreateTableAndIndexes(symbol);

            foreach (var batch in groupedElement.Chunk(insertbatchSize))
            {
                InsertRecordsBatch(symbol, batch.Select(element => new SymbolicData(headers, element)));
            }

            //int skip = 0;

            //while (true)
            //{
            //    var batch = groupedElement.Skip(skip).Take(insertbatchSize).Select(element => new SymbolicData(headers, element));

            //    if (!batch.Any())
            //    {
            //        break;
            //    }

            //    InsertRecordsBatch(symbol, batch);

            //    skip += insertbatchSize;
            //}
        }

        private void InsertRecordsBatch(string symbol, IEnumerable<SymbolicData> records)
        {
            try
            {
                using (var connection = _databaseService.GetNewConnection())
                {
                    using (var transaction = connection.BeginTransaction())
                    {
                        connection.Execute($"INSERT INTO {GetSymbolTableName(symbol)} (TrackingID, Date, MsgType, Symbol, Price) VALUES (@TrackingID, @Date, @MsgType, @Symbol, @Price)", records);

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
                    if (!_databaseService.IsTableExists($"symbol_{symbol}"))
                    {
                        using (var transaction = connection.BeginTransaction())
                        {

                            connection.Execute($"CREATE TABLE IF NOT EXISTS symbol_{symbol} (" +
                            "Id INTEGER PRIMARY KEY AUTOINCREMENT," +
                            "TrackingID VARCHAR," +
                            "Date DATETIME," +
                            "MsgType VARCHAR," +
                            "Symbol VARCHAR," +
                            "Price FLOAT)");

                            //_connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_symbol ON symbol_{symbol}(Symbol)");
                            connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_date ON symbol_{symbol}(Date)");

                            transaction.Commit();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Create Table And Indexes: {ex.Message}");
            }
        }

        private static string GetSymbolTableName(string symbol) => $"symbol_{symbol}";
    }
}

