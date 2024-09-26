using FirstTerraceSystems.Entities;
using System.Text.Json;
using System.Data;
using Dapper;
using FirstTerraceSystems.Services;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using System.Transactions;
using Microsoft.Maui.ApplicationModel.DataTransfer;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls.PlatformConfiguration;
using Microsoft.Maui.Controls;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Buffers.Text;
using System.Diagnostics;
using System;


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
            Dapper.SqlMapper.AddTypeMap(typeof(string), System.Data.DbType.AnsiString);
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
        //public async Task<IEnumerable<MarketFeed>> GetChartDataBySymbol(string symbol, DateTime startDateTime, bool initialLoad = false)
        //{
        //    try
        //    {
        //        // Get the current time in Eastern Standard Time (EST)
        //        var estTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
        //        DateTime endDateTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, estTimeZone);

        //        // Ensure the query matches the dynamic nature of your inputs, symbol, and time range
        //        string sql = $@"
        //WITH price_range AS (
        //    SELECT 
        //        MIN(price) AS min_price,
        //        MAX(price) AS max_price
        //     FROM 
        //        symbol_{symbol}
        //    WHERE 
        //        symbol = @Symbol
        //        AND date BETWEEN @StartDateTime AND @EndDateTime
        //        AND msgtype = 'T'
        //),
        //pixel_data AS (
        //    SELECT
        //        width_bucket(
        //            EXTRACT(EPOCH FROM date),
        //            EXTRACT(EPOCH FROM @StartDateTime),
        //            EXTRACT(EPOCH FROM @EndDateTime),
        //            1000  -- Number of x-axis pixels
        //        ) AS x_pixel_bin,

        //        width_bucket(
        //            price,
        //            (SELECT min_price FROM price_range),
        //            (SELECT max_price FROM price_range),
        //            500  
        //        ) AS y_pixel_bin,

        //        date,      
        //        symbol,  
        //        price
        //    FROM
        //       symbol_{symbol}
        //    WHERE
        //        symbol = @Symbol
        //         date >= @StartDateTime 
        //)
        //SELECT
        //    DISTINCT ON (x_pixel_bin, y_pixel_bin)
        //    date,
        //    symbol,
        //    price 
        //FROM
        //    pixel_data
        //ORDER BY
        //    x_pixel_bin, y_pixel_bin;";

        //        var thk = sql;

        //        var parameters = new
        //        {
        //            Symbol = symbol,
        //            StartDateTime = startDateTime.ToString("yyyy-MM-dd HH:mm:ss"),
        //            EndDateTime = endDateTime.ToString("yyyy-MM-dd HH:mm:ss")
        //        };

        //        return await _connection.QueryAsync<MarketFeed>(sql, parameters);
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine(ex.Message);
        //        return Enumerable.Empty<MarketFeed>();
        //    }
        //}
        public async Task<IEnumerable<MarketFeed>> GetChartDataBySymbol(string symbol, DateTime startDateTime, bool initialLoad = false)
        {
            try
            {
                //string sql = $"SELECT TOP 500 * FROM symbol_{symbol} WHERE Date >= @StartDateTime ORDER BY Date";
                //         string sql = $"SELECT  * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date   WHERE Date >= @StartDateTime ORDER BY Date limit 300000";

                string sql = $"SELECT  * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date   WHERE Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}' ORDER BY date DESC  limit 100000";





                var marketFeeds = await _connection.QueryAsync<MarketFeed>(sql);
                marketFeeds = marketFeeds.OrderBy((x) => x.Date);

                return marketFeeds;

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }


        }
        public async Task<IEnumerable<MarketFeed>> GetChartDataBySymbol1(string symbol, DateTime startDateTime, bool initialLoad = false,bool isDesc=false)
        {
            try
            {
                string ord = "";

                if (isDesc==true)
                {
                    ord = "DESC";
                }
                
                //string sql = $"SELECT TOP 500 * FROM symbol_{symbol} WHERE Date >= @StartDateTime ORDER BY Date";
                string sql = $"SELECT  * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date WHERE Date >= @StartDateTime ORDER BY Date {ord} 100000 ";
                var marketFeeds = await _connection.QueryAsync<MarketFeed>(sql, new { StartDateTime = startDateTime.ToString(AppSettings.DFormat_SQLite) });
                marketFeeds = marketFeeds.OrderBy((x) => x.Date);

                return marketFeeds;
                 
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }


        }
        public async Task<IEnumerable<MarketFeed>> GetChartDataByMinMax(string symbol, DateTime startDateTime, DateTime endDateTime)
        {
            try
            {
                string sql = $"SELECT * FROM symbol_{symbol} WHERE Date >= @StartDateTime and Date <= @EndDateTime ORDER BY Date ";
                return await _connection.QueryAsync<MarketFeed>(sql, new { StartDateTime = startDateTime.ToString(AppSettings.DFormat_SQLite), EndDateTime = endDateTime.ToString(AppSettings.DFormat_SQLite) });
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
                CreateTableAndIndexes(groupedMarketFeeds.Key!);
                foreach (var batch in groupedMarketFeeds.Chunk(InsertBatchSize))
                {

                    await InsertRecordsBatchAsync(groupedMarketFeeds.Key!, batch).ConfigureAwait(false);
                }

            }
        }


        private void InsertRecordsBatch(string symbol, IEnumerable<MarketFeed> records)
        {
            try
            {
                using (IDbConnection? connection = _databaseService.GetNewConnection())
                {
                    using (IDbTransaction? transaction = connection.BeginTransaction())
                    {
                        connection.Execute($"INSERT INTO {GetSymbolTableName(symbol)} (TrackingID, Date, MsgType, Symbol, Price,Size) VALUES (@TrackingID, @Date, @MsgType, @Symbol, @Price, @Size)", records);

                        transaction.Commit();
                    }
                }
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("database is locked"))
                {
                    Thread.Sleep(100);
                    InsertRecordsBatch(symbol, records);
                }
                Console.WriteLine($"Error inserting records: {ex.Message}");
            }

        }

        private async Task InsertRecordsBatchAsync(string symbol, IEnumerable<MarketFeed> records)
        {
            try
            {
                using (IDbConnection? connection = _databaseService.GetNewConnection())
                {
                    using (IDbTransaction? transaction = connection.BeginTransaction())
                    {
                        connection.Execute($"INSERT INTO {GetSymbolTableName(symbol)} (TrackingID, Date, MsgType, Symbol, Price,Size) VALUES (@TrackingID, @Date, @MsgType, @Symbol, @Price, @Size)", records);

                        transaction.Commit();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting records: {ex.Message}");
                if (ex.Message.Contains("database is locked"))
                {
                    Thread.Sleep(100);
                    await InsertRecordsBatchAsync(symbol, records);
                }
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
                            "Price FLOAT," +
                            "Size VARCHAR)");

                      
                            connection.Execute($"CREATE INDEX IF NOT EXISTS idx_symbol_{symbol}_date ON symbol_{symbol}(Date)");
                           
                            transaction.Commit();
                        }
                    }
               
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Create Table And Indexes: {ex.Message}");
                if (ex.Message.Contains("database is locked"))
                {
                    Thread.Sleep(100);
                    CreateTableAndIndexes(symbol);
                }
            }
        }

        private static string GetSymbolTableName(string symbol) => $"symbol_{symbol}";
    }
}

