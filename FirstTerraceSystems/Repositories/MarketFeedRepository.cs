using FirstTerraceSystems.Entities;
using System.Text.Json;
using System.Data;
using Dapper;
using FirstTerraceSystems.Services;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;

namespace FirstTerraceSystems.Repositories
{
    public class MarketFeedRepository
    {
        private const int InsertBatchSize = 10000;
        private readonly IDbConnection _connection;
        private readonly DatabaseService _databaseService;
        private readonly object _databaseLock = new object();
        public MarketFeedRepository(IDbConnection connection, DatabaseService databaseService)
        {
            _connection = connection;
            _databaseService = databaseService;
        }

        public MarketFeed? GetLastRecordBySymbol(string symbol)
        {
            if (!_databaseService.IsTableExists(GetSymbolTableName(symbol))) return null;

            try
            {
                string sql = $"SELECT * FROM {GetSymbolTableName(symbol)} ORDER BY Id DESC LIMIT 1";
                return _connection.QueryFirstOrDefault<MarketFeed>(sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public MarketFeed? GetExistsSymbol(string? symbol)
        {
            if (string.IsNullOrEmpty(symbol)) return null;

            try
            {
                string sql = $"SELECT * FROM symbol_{symbol.ToUpper()} LIMIT 1";
                return _connection.QueryFirstOrDefault<MarketFeed>(sql);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public async Task<IEnumerable<MarketFeed>> GetChartDataBySymbol(string symbol, DateTime startDateTime)
        {
            try
            {
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Date >= @StartDateTime ORDER BY Date";
                return await _connection.QueryAsync<MarketFeed>(sql, new { StartDateTime = startDateTime.ToString(AppSettings.DFormat_SQLite) });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }
        }

        public async Task<IEnumerable<MarketFeed>> GetChartDataBySymbol(string symbol, long lastId)
        {
            try
            {
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Id > @LastId ORDER BY Date";
                return await _connection.QueryAsync<MarketFeed>(sql, new { LastId = lastId });
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

        public void InsertMarketFeedDataFromApi(string symbol, IEnumerable<MarketFeed>? marketFeeds)
        {

            if (marketFeeds == null) return;

            CreateTableAndIndexes(symbol);
            var feedsList = marketFeeds.ToList(); // Materialize enumerable to list
            for (int i = 0; i < feedsList.Count; i += InsertBatchSize)
            {
                var batch = feedsList.Skip(i).Take(InsertBatchSize).ToList();
                InsertRecordsBatch(symbol, batch);
            }
            
        }

        public async Task InsertLiveMarketFeedDataFromSocket(NasdaqResponse? response)
        {
            if (response == null) return;

            IEnumerable<IGrouping<string?, MarketFeed>>? groupedData = response.Data.Select(data => new MarketFeed(response.Headers, data)).GroupBy(mf => mf.Symbol);

            foreach (var groupedMarketFeeds in groupedData)
            {
                foreach (var batch in groupedMarketFeeds.Chunk(InsertBatchSize))
                {
                    CreateTableAndIndexes(groupedMarketFeeds.Key!);

                    await InsertRecordsBatchAsync(groupedMarketFeeds.Key!, batch).ConfigureAwait(false);
                }

            }
        }
        private void InsertRecordsBatch(string symbol, IEnumerable<MarketFeed> records)
        {
            lock (_databaseLock)
            {
                try
                {
                    using (IDbConnection? connection = _databaseService.GetNewConnection())
                    {
                        using (IDbTransaction? transaction = connection.BeginTransaction())
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
        }

        private async Task InsertRecordsBatchAsync(string symbol, IEnumerable<MarketFeed> records)
        {
            await Task.Run(() => { 
            lock (_databaseLock)
            {
                try
                {
                    using (IDbConnection? connection = _databaseService.GetNewConnection())
                    {
                        using (IDbTransaction? transaction = connection.BeginTransaction())
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
            });
        }

        private void CreateTableAndIndexes(string symbol)
        {
            lock (_databaseLock)
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
        }

        private static string GetSymbolTableName(string symbol) => $"symbol_{symbol}";
    }
}

