using FirstTerraceSystems.Entities;
using System.Data;
using Dapper;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;

namespace FirstTerraceSystems.Repositories
{
    public class MarketFeedRepository
    {
        private const int InsertBatchSize = 10000;
        private readonly DatabaseContext _context;

        public MarketFeedRepository(DatabaseContext context)
        {
            _context = context;
        }

        public MarketFeed? GetLastRecordBySymbol(string symbol)
        {
            if (!_context.IsTableExists(GetSymbolTableName(symbol))) return null;

            try
            {
                using IDbConnection connection = _context.CreateConnection();
                string sql = $"SELECT * FROM {GetSymbolTableName(symbol)} ORDER BY Id DESC LIMIT 1";
                return connection.QueryFirstOrDefault<MarketFeed>(sql);
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
                using IDbConnection connection = _context.CreateConnection();
                string sql = $"SELECT * FROM symbol_{symbol.ToUpper()} LIMIT 1";
                return connection.QueryFirstOrDefault<MarketFeed>(sql);
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
                using IDbConnection connection = _context.CreateConnection();
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Date >= @StartDateTime ORDER BY Date";
                return await connection.QueryAsync<MarketFeed>(sql, new { StartDateTime = startDateTime.ToString(AppSettings.DFormat_SQLite) });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }
        }

        public async Task<IEnumerable<MarketFeed>> GetChartDataBySymbol(string symbol, string? trackingId)
        {
            try
            {
                using IDbConnection connection = _context.CreateConnection();
                string sql = $"SELECT * FROM symbol_{symbol} WHERE TrackingID > @TrackingID ORDER BY Date";
                return await connection.QueryAsync<MarketFeed>(sql, new { TrackingID = trackingId });
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
                using IDbConnection connection = _context.CreateConnection();
                string sql = "SELECT REPLACE(name, 'symbol_', '') AS symbol FROM sqlite_master WHERE type = 'table' AND name LIKE 'symbol_%';";
                return connection.Query<string>(sql);
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

            Queue<MarketFeed>? queue = new Queue<MarketFeed>(marketFeeds);

            while (queue.Count > 0)
            {
                List<MarketFeed>? batch = new List<MarketFeed>();

                for (int i = 0; i < InsertBatchSize && queue.Count > 0; i++)
                {
                    batch.Add(queue.Dequeue());
                }

                if (batch.Count != 0)
                {
                    InsertRecordsBatch(symbol, batch);
                }

                batch.Clear();
                batch = null;
            }
        }

        public void InsertLiveMarketFeedDataFromSocket(NasdaqResponse? response)
        {
            if (response == null) return;

            IEnumerable<IGrouping<string?, MarketFeed>>? groupedData = response.Data.Select(data => new MarketFeed(response.Headers, data)).GroupBy(mf => mf.Symbol);

            foreach (var groupedMarketFeeds in groupedData)
            {
                foreach (var batch in groupedMarketFeeds.Chunk(InsertBatchSize))
                {
                    CreateTableAndIndexes(groupedMarketFeeds.Key!);

                    InsertRecordsBatch(groupedMarketFeeds.Key!, batch);
                }

            }
        }

        private void InsertRecordsBatch(string symbol, IEnumerable<MarketFeed> records)
        {
            try
            {
                using (IDbConnection connection = _context.CreateConnection())
                {
                    connection.Open();
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

        private async Task InsertRecordsBatchAsync(string symbol, IEnumerable<MarketFeed> records)
        {
            try
            {
                using (IDbConnection? connection = _context.CreateConnection())
                {
                    connection.Open();
                    using (IDbTransaction? transaction = connection.BeginTransaction())
                    {
                        await connection.ExecuteAsync($"INSERT INTO {GetSymbolTableName(symbol)} (TrackingID, Date, MsgType, Symbol, Price) VALUES (@TrackingID, @Date, @MsgType, @Symbol, @Price)", records);

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
                using (IDbConnection connection = _context.CreateConnection())
                {
                    connection.Open();
                    if (!_context.IsTableExists($"symbol_{symbol}"))
                    {
                        using (IDbTransaction transaction = connection.BeginTransaction())
                        {

                            connection.Execute($"CREATE TABLE IF NOT EXISTS symbol_{symbol} (" +
                            "TrackingID VARCHAR," +
                            "Date DATETIME," +
                            "MsgType VARCHAR," +
                            "Symbol VARCHAR," +
                            "Price FLOAT)");

                            //_connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_symbol ON symbol_{symbol}(Symbol)");
                            connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_date ON symbol_{symbol}(Date)");
                            connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_tracking_id ON symbol_{symbol}(TrackingID)");

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

