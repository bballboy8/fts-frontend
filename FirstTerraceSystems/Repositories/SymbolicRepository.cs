using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using SQLite;
using System.Collections;
using System.Collections.Concurrent;

namespace FirstTerraceSystems.Repositories
{
    internal class SymbolicRepository
    {
        private readonly SQLiteConnection _connection;

        public SymbolicRepository(SQLiteConnection connection)
        {
            _connection = connection;
        }

        public SymbolicData? GetLastRecord()
        {
            return _connection.Table<SymbolicData>().LastOrDefault();
        }

        public SymbolicData? GetLastRecordBySymbol(string symbol)
        {
            return _connection.Table<SymbolicData>().LastOrDefault(s => s.Symbol == symbol);
        }

        public IEnumerable<string?>? GetAllSymbols()
        {
            var symbols = _connection.Table<SymbolicData>().Select(s => s.Symbol).Distinct();
            return symbols;
        }

        public IEnumerable<dynamic> GetSymbolicDataBySymbol(string symbol)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol).Select(x => new { t = x.TimeStamp, p = x.Price }).ToList();
            return result;
        }

        public IEnumerable<SymbolicData> GetChartDataBySymbol(string symbol)
        {
            DateTime threeDaysAgo = DateTime.Now.AddDays(-3);
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol && x.Date >= threeDaysAgo);
            return result;
        }

        public IEnumerable<SymbolicData> GetChartDataBySymbol(string symbol, long lastPrimaryKey)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol && x.Id > lastPrimaryKey);
            return result;
        }


        public void UpdateSymbolicDataToDBFromApi(List<SymbolicData>? data)
        {
            if (data == null) return;

            List<SymbolicData> batch = [];
            foreach (var item in data)
            {
                item.ApplyTransformations();

                batch.Add(item);

                if (batch.Count > 10000)
                {
                    InsertBatchIntoDatabase(batch);
                    batch.Clear();
                }
            }

            if (batch.Count > 0) InsertBatchIntoDatabase(batch);
        }

        public void UpdateSymbolicDataToDBFromSocket(NasdaqResponse data)
        {
            List<SymbolicData> batch = new();
            Dictionary<string, int> headers = data.Headers.Select((h, i) => new { Header = h, Index = i }).ToDictionary(x => x.Header, x => x.Index);

            foreach (var item in data.Data)
            {
                batch.Add(new SymbolicData(headers, item));
                if (batch.Count > 10000)
                {
                    InsertBatchIntoDatabase(batch);
                    batch.Clear();
                }
            }

            if (batch.Count > 0)
            {
                InsertBatchIntoDatabase(batch);
            }
        }

        //public void UpdateSymbolicDataToDBFromSocket(NasdaqResponse data)
        //{
        //    int batchSize = 10000;
        //    var headers = data.Headers.Select((h, i) => new { Header = h, Index = i }).ToDictionary(x => x.Header, x => x.Index);

        //    ConcurrentBag<List<SymbolicData>> batches = new();
        //    List<SymbolicData> batch = new(batchSize);

        //    Parallel.ForEach(data.Data, item =>
        //    {
        //        var symbolicData = new SymbolicData(headers, item);

        //        lock (batch)
        //        {
        //            batch.Add(symbolicData);
        //            if (batch.Count >= batchSize)
        //            {
        //                batches.Add(batch);
        //                batch = new List<SymbolicData>(batchSize);
        //            }
        //        }

        //        // Insert the batch directly into the database
        //        if (batch.Count > 0)
        //        {
        //            lock (_connection)
        //            {
        //                //InsertBatchIntoDatabase(batch);
        //            }
        //        }
        //    });

        //    // Insert any remaining items in the last batch
        //    if (batch.Count > 0)
        //    {
        //        lock (_connection)
        //        {
        //            //InsertBatchIntoDatabase(batch);
        //        }
        //    }
        //}


        public int CleanupOldRecords()
        {
            var easternTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
            var cutoffDateUtc = DateTime.UtcNow.AddDays(-3);
            var cutoffDateETC = TimeZoneInfo.ConvertTimeFromUtc(cutoffDateUtc, easternTimeZone).ToString("yyyy-MM-dd HH:mm:ss");

            var deleteCommand = new SQLiteCommand(_connection);
            deleteCommand.CommandText = $"DELETE FROM SymbolicData WHERE datetime(TimeStamp) < datetime('{cutoffDateETC}')";
            //deleteCommand.CommandText = $"DELETE FROM SymbolicData WHERE datetime(DateTime) < datetime('{cutoffDateETC}')";
            int result = deleteCommand.ExecuteNonQuery();
            return result;
        }

        private void InsertBatchIntoDatabase(List<SymbolicData> batch)
        {
            try
            {
                _connection.InsertAll(batch);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting batch into database: {ex.Message}");
            }
        }
    }
}
