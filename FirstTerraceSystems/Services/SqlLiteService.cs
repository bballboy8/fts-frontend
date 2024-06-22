using FirstTerraceSystems.Entities.Nasdaq;
using SQLite;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Globalization;
using System.Text.Json.Serialization;

namespace FirstTerraceSystems.Services
{
    public class SqlLiteService
    {
        private SQLiteConnection _connection;

        public SqlLiteService()
        {
            var dbpath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FTS.db");
            //var dbpath = Path.Combine(Environment.ProcessPath.Replace("FirstTerraceSystems.exe",""), "FTS.db");
            //var dbpath = Path.Combine(@"D:\", "var", "FTS.db");
            _connection = new SQLiteConnection(dbpath);
            _connection.CreateTable<SymbolicData>();
        }

        public SymbolicData? GetLastSample()
        {
            var last = _connection.Table<SymbolicData>().LastOrDefault();
            return last;
        }
        public IEnumerable<dynamic> GetSymbolicData(string symbol)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol)
                .Select(x => new { t = x.TimeStamp, p = x.Price }).ToList();
            return result;
        }

        //Update database from api
        public void UpdateSymbolicDataToDB(List<SymbolicData> data)
        {
            List<SymbolicData> batch = [];
            foreach (var item in data)
            {
                var dt = item.Date;
                dt = dt.AddMilliseconds(long.Parse(item.TrackingID) / 1000000);

                // Convert to Eastern Time
                TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
                DateTime easternTime = TimeZoneInfo.ConvertTimeFromUtc(dt, easternZone);

                item.TimeStamp = easternTime.ToString("yyyy-MM-ddTHH:mm:ss.fff");

                item.Price = item.Price / 100;

                batch.Add(item);
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }
            if (batch.Count > 0)
                _connection.InsertAll(batch);
        }

        //Update database from Socket
        public void UpdateSymbolicsocketDataToDB(NasdaqData data)
        {
            List<SymbolicData> batch = new();
            foreach (var item in data.Data)
            {
                batch.Add(new SymbolicData(data.Headers, item));
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }
            if (batch.Count > 0)
                _connection.InsertAll(batch);
        }
    }
}
