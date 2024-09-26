using FirstTerraceSystems.Entities;
using System.Text.Json;
using System.Data;
using Dapper;
using FirstTerraceSystems.Services;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using System.Transactions;
using System.Diagnostics;
using Microsoft.Data.Sqlite;
using System.Collections;

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
        //with ff as (select count(id) as count1 from symbol_NVDA), dff as(select id,date,Symbol,price,size from symbol_NVDA  indexed by idx_symbol_NVDA_date  where date BETWEEN ('2024-09-01') and ('2024-09-26') order by date ) select * from ff,dff WHERE id%(count1/1000)==0 ;
        public async Task<IEnumerable<MarketFeed>?> GetChartDataBySymbol(string symbol, DateTime startDateTime, bool initialLoad = false)
        {
            try
            {
                var pointsize = 20000;
          var stopwatch1 = new Stopwatch();
            stopwatch1.Start();
                //string sql = $"SELECT TOP 500 * FROM symbol_{symbol} WHERE Date >= @StartDateTime ORDER BY Date";
                //         string sql = $"SELECT  * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date   WHERE Date >= @StartDateTime ORDER BY Date limit 300000";
           //     string sql = $"SELECT  * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date   WHERE Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}' ORDER BY Date  limit 400000";
                string sql1 = $"with count_table as (select count(id) as datacounter from symbol_{symbol} where Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}'  ), symbol_table as(select id,date,Symbol,price,size from symbol_{symbol}  indexed by idx_symbol_{symbol}_date  where Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}' order by date ) select * from count_table,symbol_table WHERE ((id%(datacounter/{pointsize})==0 and datacounter>{pointsize}) or datacounter<={pointsize})";
        var marketfeedlist=   await _connection.QueryAsync<MarketFeed>(sql1).ConfigureAwait(false);
        //   var marketfeedlist = _connection.Query(sql).ToList();
              stopwatch1.Stop();
              //  var ausy = GC.GetTotalMemory(false);
             var elapsedtime = stopwatch1.ElapsedMilliseconds.ToString();
                GC.Collect();
                var ausy1 = GC.GetTotalMemory(false);
                return marketfeedlist;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }
          
           }
        public async Task<IEnumerable<MarketFeed>?> GetChartDataBySymbol1(string symbol, DateTime startDateTime, bool initialLoad = false,bool isDesc=false)
        {
            try
            {
                string ord = "";

                if (isDesc==true)
                {
                    ord = "DESC";
                }
                
                //string sql = $"SELECT TOP 500 * FROM symbol_{symbol} WHERE Date >= @StartDateTime ORDER BY Date";
                string sql = $"SELECT  * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date WHERE Date >= @StartDateTime ORDER BY Date {ord}  limit 400000";
                var marketfeed= await _connection.QueryAsync<MarketFeed>(sql, new { StartDateTime = startDateTime.ToString(AppSettings.DFormat_SQLite) }).ConfigureAwait(false);
                GC.Collect();
                return marketfeed;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return [];
            }

        }


      
        public IEnumerable<MarketFeed>? tryado(string symbol, DateTime startDateTime)
        {
            var stopwatch1 = new Stopwatch();
            stopwatch1.Start();
            var ff = _connection.CreateCommand();
         ff.CommandText=   @$"
select * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date   WHERE Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}' ORDER BY Date  limit 400000
            ";
            var ff1 = new List<MarketFeed>();
            using (var reader = ff.ExecuteReader())
            {
                while (reader.Read())
                {

                    var name=reader.GetValue(0);
                    ff1.Add(new MarketFeed
                    {
                        Id = Convert.ToInt64(reader.GetValue(0)),
                        TrackingID = Convert.ToString(reader.GetValue(1)),
                        Date = Convert.ToDateTime(reader.GetValue(2)),
                        MsgType = Convert.ToString(reader.GetValue(3)),
                        Symbol = symbol,
                        Price = Convert.ToDouble(reader.GetValue(5)),
                        Size = Convert.ToString(reader.GetValue(6))

                    });
                }
            }
         
            stopwatch1.Stop();
            //  var ausy = GC.GetTotalMemory(false);
            var elapsedtime = stopwatch1.ElapsedMilliseconds.ToString();
            var fff= "";
            return ff1.AsEnumerable<MarketFeed>();
        }
        public async Task<IEnumerable<MarketFeed>?> GetChartDataByMinMax(string symbol, DateTime startDateTime, DateTime endDateTime)
        {
            try
            {
                var pointsize = 300;
                //  string sql = $"SELECT * FROM symbol_{symbol}  indexed by idx_symbol_{symbol}_date   WHERE Date >= @StartDateTime and Date <= @EndDateTime ORDER BY Date limit 3000";
                string sql1 = $"with count_table as (select count(id) as datacounter from symbol_{symbol} where Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}' and Date<='{endDateTime.ToString(AppSettings.DFormat_SQLite)}' ), symbol_table as(select id,date,Symbol,price,size from symbol_{symbol}  indexed by idx_symbol_{symbol}_date  where Date >= '{startDateTime.ToString(AppSettings.DFormat_SQLite)}' and Date<='{endDateTime.ToString(AppSettings.DFormat_SQLite)}' order by date ) select * from count_table,symbol_table WHERE ((id%(datacounter/{pointsize})==0 and datacounter>{pointsize}) or datacounter<={pointsize})";
                var marketfeeed= await _connection.QueryAsync<MarketFeed>(sql1).ConfigureAwait(false);
                GC.Collect();
                return marketfeeed;
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

